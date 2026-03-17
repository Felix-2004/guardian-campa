import { Router } from "express";
import { db, locationsTable } from "@workspace/db";
import { eq, and } from "drizzle-orm";
import { authMiddleware, AuthRequest } from "../middleware/auth.js";
import { CreateLocationBody } from "@workspace/api-zod";

const router = Router();

function serializeLoc(l: any) {
  return {
    ...l,
    createdAt: l.createdAt instanceof Date ? l.createdAt.toISOString() : l.createdAt,
  };
}

router.get("/", authMiddleware, async (req: AuthRequest, res) => {
  const locs = await db.select().from(locationsTable).where(eq(locationsTable.userId, req.userId!));
  res.json(locs.map(serializeLoc));
});

router.post("/", authMiddleware, async (req: AuthRequest, res) => {
  const parsed = CreateLocationBody.safeParse(req.body);
  if (!parsed.success) {
    res.status(400).json({ error: "validation_error", message: "Invalid location data" });
    return;
  }

  const [loc] = await db.insert(locationsTable).values({
    userId: req.userId!,
    ...parsed.data,
  }).returning();

  res.status(201).json(serializeLoc(loc));
});

router.delete("/:locationId", authMiddleware, async (req: AuthRequest, res) => {
  const locationId = parseInt(req.params.locationId);
  if (isNaN(locationId)) {
    res.status(400).json({ error: "validation_error", message: "Invalid location ID" });
    return;
  }

  await db.delete(locationsTable).where(and(eq(locationsTable.id, locationId), eq(locationsTable.userId, req.userId!)));
  res.json({ success: true, message: "Location deleted" });
});

export default router;
