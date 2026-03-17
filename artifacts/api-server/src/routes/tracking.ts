import { Router } from "express";
import { db, trackingSessionsTable } from "@workspace/db";
import { eq } from "drizzle-orm";
import { authMiddleware, AuthRequest } from "../middleware/auth.js";
import { UpdateTrackingLocationBody } from "@workspace/api-zod";

const router = Router();

function serializeSession(s: any) {
  return {
    ...s,
    createdAt: s.createdAt instanceof Date ? s.createdAt.toISOString() : s.createdAt,
    expiresAt: s.expiresAt instanceof Date ? s.expiresAt.toISOString() : s.expiresAt,
    pathHistory: s.pathHistory || [],
  };
}

router.get("/:sessionId", async (req, res) => {
  const session = await db
    .select()
    .from(trackingSessionsTable)
    .where(eq(trackingSessionsTable.sessionId, req.params.sessionId))
    .then(r => r[0]);

  if (!session) {
    res.status(404).json({ error: "not_found", message: "Tracking session not found" });
    return;
  }

  if (session.expiresAt < new Date() && session.status === "active") {
    await db
      .update(trackingSessionsTable)
      .set({ status: "expired" })
      .where(eq(trackingSessionsTable.sessionId, req.params.sessionId));
    session.status = "expired";
  }

  res.json(serializeSession(session));
});

router.post("/:sessionId/update", authMiddleware, async (req: AuthRequest, res) => {
  const parsed = UpdateTrackingLocationBody.safeParse(req.body);
  if (!parsed.success) {
    res.status(400).json({ error: "validation_error", message: "Invalid location data" });
    return;
  }

  const { lat, lng } = parsed.data;
  const session = await db
    .select()
    .from(trackingSessionsTable)
    .where(eq(trackingSessionsTable.sessionId, req.params.sessionId))
    .then(r => r[0]);

  if (!session || session.userId !== req.userId) {
    res.status(404).json({ error: "not_found", message: "Session not found" });
    return;
  }

  const newPoint = { lat, lng, timestamp: new Date().toISOString() };
  const pathHistory = [...(session.pathHistory || []), newPoint].slice(-100);

  await db
    .update(trackingSessionsTable)
    .set({ currentLat: lat, currentLng: lng, pathHistory })
    .where(eq(trackingSessionsTable.sessionId, req.params.sessionId));

  res.json({ success: true, message: "Location updated" });
});

export default router;
