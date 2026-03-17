import { Router } from "express";
import { db, usersTable, contactsTable } from "@workspace/db";
import { eq } from "drizzle-orm";
import { authMiddleware, AuthRequest } from "../middleware/auth.js";
import { CompleteSetupBody, UpdateMeBody } from "@workspace/api-zod";

const router = Router();

function serializeUser(user: any) {
  return {
    ...user,
    createdAt: user.createdAt instanceof Date ? user.createdAt.toISOString() : user.createdAt,
  };
}

router.get("/me", authMiddleware, async (req: AuthRequest, res) => {
  const user = await db.select().from(usersTable).where(eq(usersTable.id, req.userId!)).then(r => r[0]);
  if (!user) {
    res.status(404).json({ error: "not_found", message: "User not found" });
    return;
  }
  res.json(serializeUser(user));
});

router.put("/me", authMiddleware, async (req: AuthRequest, res) => {
  const parsed = UpdateMeBody.safeParse(req.body);
  if (!parsed.success) {
    res.status(400).json({ error: "validation_error", message: "Invalid data" });
    return;
  }

  const updates: any = {};
  if (parsed.data.name !== undefined) updates.name = parsed.data.name;
  if (parsed.data.age !== undefined) updates.age = parsed.data.age;
  if (parsed.data.gender !== undefined) updates.gender = parsed.data.gender;
  if (parsed.data.healthConcerns !== undefined) updates.healthConcerns = parsed.data.healthConcerns;
  if (parsed.data.preferences !== undefined) updates.preferences = parsed.data.preferences;

  const [updated] = await db.update(usersTable).set(updates).where(eq(usersTable.id, req.userId!)).returning();
  res.json(serializeUser(updated));
});

router.post("/setup", authMiddleware, async (req: AuthRequest, res) => {
  const parsed = CompleteSetupBody.safeParse(req.body);
  if (!parsed.success) {
    res.status(400).json({ error: "validation_error", message: "Invalid setup data" });
    return;
  }

  const { name, age, gender, healthConcerns, issues, homeLat, homeLng, preferences, contacts } = parsed.data;

  const updates: any = {
    name,
    profileCompleted: true,
    issues: issues || [],
  };
  if (age !== undefined) updates.age = age;
  if (gender !== undefined) updates.gender = gender;
  if (healthConcerns !== undefined) updates.healthConcerns = healthConcerns;
  if (homeLat !== undefined) updates.homeLat = homeLat;
  if (homeLng !== undefined) updates.homeLng = homeLng;
  if (preferences !== undefined) updates.preferences = preferences;

  const [updated] = await db.update(usersTable).set(updates).where(eq(usersTable.id, req.userId!)).returning();

  if (contacts && contacts.length > 0) {
    for (const contact of contacts) {
      await db.insert(contactsTable).values({
        userId: req.userId!,
        name: contact.name,
        phone: contact.phone,
        relationship: contact.relationship,
        priority: contact.priority,
      });
    }
  }

  res.json(serializeUser(updated));
});

export default router;
