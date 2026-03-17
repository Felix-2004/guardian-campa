import { Router } from "express";
import { db, alertsTable, contactsTable, usersTable, trackingSessionsTable } from "@workspace/db";
import { eq, and, desc } from "drizzle-orm";
import { authMiddleware, AuthRequest } from "../middleware/auth.js";
import { TriggerSosBody, ResolveAlertParams } from "@workspace/api-zod";
import { sendSosAlert } from "../services/smsService.js";
import crypto from "crypto";

const router = Router();

function serializeAlert(a: any) {
  return {
    ...a,
    createdAt: a.createdAt instanceof Date ? a.createdAt.toISOString() : a.createdAt,
    resolvedAt: a.resolvedAt instanceof Date ? a.resolvedAt.toISOString() : a.resolvedAt,
  };
}

router.get("/", authMiddleware, async (req: AuthRequest, res) => {
  const alerts = await db
    .select()
    .from(alertsTable)
    .where(eq(alertsTable.userId, req.userId!))
    .orderBy(desc(alertsTable.createdAt))
    .limit(50);
  res.json(alerts.map(serializeAlert));
});

router.post("/", authMiddleware, async (req: AuthRequest, res) => {
  const parsed = TriggerSosBody.safeParse(req.body);
  if (!parsed.success) {
    res.status(400).json({ error: "validation_error", message: "Invalid SOS data" });
    return;
  }

  const { lat, lng, message } = parsed.data;

  const sessionId = crypto.randomUUID();
  const expiresAt = new Date(Date.now() + 2 * 60 * 60 * 1000); // 2 hours

  await db.insert(trackingSessionsTable).values({
    sessionId,
    userId: req.userId!,
    currentLat: lat,
    currentLng: lng,
    pathHistory: [{ lat, lng, timestamp: new Date().toISOString() }],
    status: "active",
    expiresAt,
  });

  const [alert] = await db.insert(alertsTable).values({
    userId: req.userId!,
    type: "sos",
    status: "active",
    lat,
    lng,
    trackingSessionId: sessionId,
  }).returning();

  const user = await db.select().from(usersTable).where(eq(usersTable.id, req.userId!)).then(r => r[0]);
  const contacts = await db.select().from(contactsTable).where(eq(contactsTable.userId, req.userId!));

  const baseUrl = process.env.APP_URL || `https://${process.env.REPLIT_DEV_DOMAIN || "localhost"}`;
  const trackingUrl = `${baseUrl}/track/${sessionId}`;

  let smsSent = false;
  let contactsNotified = 0;

  for (const contact of contacts) {
    const sent = await sendSosAlert(
      contact.phone,
      user?.name || "Your contact",
      lat,
      lng,
      trackingUrl,
      message
    );
    if (sent) {
      contactsNotified++;
      smsSent = true;
    }
  }

  res.status(201).json({
    alert: serializeAlert(alert),
    trackingUrl,
    smsSent,
    contactsNotified,
  });
});

router.post("/:alertId/resolve", authMiddleware, async (req: AuthRequest, res) => {
  const params = ResolveAlertParams.safeParse(req.params);
  if (!params.success) {
    res.status(400).json({ error: "validation_error", message: "Invalid alert ID" });
    return;
  }

  const [alert] = await db
    .update(alertsTable)
    .set({ status: "resolved", resolvedAt: new Date() })
    .where(and(eq(alertsTable.id, params.data.alertId), eq(alertsTable.userId, req.userId!)))
    .returning();

  if (!alert) {
    res.status(404).json({ error: "not_found", message: "Alert not found" });
    return;
  }

  if (alert.trackingSessionId) {
    await db
      .update(trackingSessionsTable)
      .set({ status: "expired" })
      .where(eq(trackingSessionsTable.sessionId, alert.trackingSessionId));
  }

  res.json(serializeAlert(alert));
});

export default router;
