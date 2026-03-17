import { Router } from "express";
import { db, usersTable, alertsTable, trackingSessionsTable } from "@workspace/db";
import { eq, desc } from "drizzle-orm";

const router = Router();

function serializeUser(u: any) {
  return {
    ...u,
    createdAt: u.createdAt instanceof Date ? u.createdAt.toISOString() : u.createdAt,
  };
}

function serializeAlert(a: any) {
  return {
    ...a,
    createdAt: a.createdAt instanceof Date ? a.createdAt.toISOString() : a.createdAt,
    resolvedAt: a.resolvedAt instanceof Date ? a.resolvedAt.toISOString() : a.resolvedAt,
  };
}

router.get("/dashboard", async (req, res) => {
  const { token } = req.query;

  if (!token || typeof token !== "string") {
    res.status(403).json({ error: "forbidden", message: "Access token required" });
    return;
  }

  const user = await db.select().from(usersTable).where(eq(usersTable.familyToken, token)).then(r => r[0]);

  if (!user) {
    res.status(403).json({ error: "forbidden", message: "Invalid access token" });
    return;
  }

  const recentAlerts = await db
    .select()
    .from(alertsTable)
    .where(eq(alertsTable.userId, user.id))
    .orderBy(desc(alertsTable.createdAt))
    .limit(10);

  const latestAlert = recentAlerts[0] || null;

  let isTracking = false;
  let trackingSessionId = null;

  if (latestAlert?.trackingSessionId && latestAlert.status === "active") {
    const session = await db
      .select()
      .from(trackingSessionsTable)
      .where(eq(trackingSessionsTable.sessionId, latestAlert.trackingSessionId))
      .then(r => r[0]);
    if (session && session.status === "active") {
      isTracking = true;
      trackingSessionId = session.sessionId;
    }
  }

  res.json({
    user: serializeUser(user),
    latestAlert: latestAlert ? serializeAlert(latestAlert) : null,
    recentAlerts: recentAlerts.map(serializeAlert),
    isTracking,
    trackingSessionId,
  });
});

export default router;
