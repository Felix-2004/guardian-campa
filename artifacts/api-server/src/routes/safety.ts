import { Router } from "express";
import { db, usersTable, contactsTable, alertsTable } from "@workspace/db";
import { eq, and, gte } from "drizzle-orm";
import { authMiddleware, AuthRequest } from "../middleware/auth.js";
import { getRecommendations, computeSafetyScore } from "../services/recommendationService.js";

const router = Router();

router.get("/score", authMiddleware, async (req: AuthRequest, res) => {
  const user = await db.select().from(usersTable).where(eq(usersTable.id, req.userId!)).then(r => r[0]);
  if (!user) {
    res.status(404).json({ error: "not_found", message: "User not found" });
    return;
  }

  const contacts = await db.select().from(contactsTable).where(eq(contactsTable.userId, req.userId!));

  const oneDayAgo = new Date(Date.now() - 24 * 60 * 60 * 1000);
  const recentAlerts = await db
    .select()
    .from(alertsTable)
    .where(and(eq(alertsTable.userId, req.userId!), gte(alertsTable.createdAt, oneDayAgo)));

  const hour = new Date().getHours();

  const { score, riskLevel, factors } = computeSafetyScore({
    hasContacts: contacts.length > 0,
    hasHomeLocation: user.homeLat !== null && user.homeLat !== undefined,
    recentAlerts: recentAlerts.length,
    issues: user.issues || [],
    hour,
  });

  res.json({
    score,
    riskLevel,
    factors,
    lastUpdated: new Date().toISOString(),
  });
});

router.get("/recommendations", authMiddleware, async (req: AuthRequest, res) => {
  const user = await db.select().from(usersTable).where(eq(usersTable.id, req.userId!)).then(r => r[0]);
  if (!user) {
    res.status(404).json({ error: "not_found", message: "User not found" });
    return;
  }

  const recs = getRecommendations(user.issues || []);
  res.json(recs);
});

export default router;
