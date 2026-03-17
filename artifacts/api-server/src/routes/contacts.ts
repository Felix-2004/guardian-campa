import { Router } from "express";
import { db, contactsTable } from "@workspace/db";
import { eq, and } from "drizzle-orm";
import { authMiddleware, AuthRequest } from "../middleware/auth.js";
import { CreateContactBody, UpdateContactParams } from "@workspace/api-zod";

const router = Router();

function serializeContact(c: any) {
  return {
    ...c,
    createdAt: c.createdAt instanceof Date ? c.createdAt.toISOString() : c.createdAt,
  };
}

router.get("/", authMiddleware, async (req: AuthRequest, res) => {
  const contacts = await db.select().from(contactsTable).where(eq(contactsTable.userId, req.userId!));
  res.json(contacts.map(serializeContact));
});

router.post("/", authMiddleware, async (req: AuthRequest, res) => {
  const parsed = CreateContactBody.safeParse(req.body);
  if (!parsed.success) {
    res.status(400).json({ error: "validation_error", message: "Invalid contact data" });
    return;
  }

  const [contact] = await db.insert(contactsTable).values({
    userId: req.userId!,
    ...parsed.data,
  }).returning();

  res.status(201).json(serializeContact(contact));
});

router.put("/:contactId", authMiddleware, async (req: AuthRequest, res) => {
  const params = UpdateContactParams.safeParse(req.params);
  if (!params.success) {
    res.status(400).json({ error: "validation_error", message: "Invalid contact ID" });
    return;
  }

  const parsed = CreateContactBody.safeParse(req.body);
  if (!parsed.success) {
    res.status(400).json({ error: "validation_error", message: "Invalid contact data" });
    return;
  }

  const [contact] = await db
    .update(contactsTable)
    .set(parsed.data)
    .where(and(eq(contactsTable.id, params.data.contactId), eq(contactsTable.userId, req.userId!)))
    .returning();

  if (!contact) {
    res.status(404).json({ error: "not_found", message: "Contact not found" });
    return;
  }

  res.json(serializeContact(contact));
});

router.delete("/:contactId", authMiddleware, async (req: AuthRequest, res) => {
  const contactId = parseInt(req.params.contactId);
  if (isNaN(contactId)) {
    res.status(400).json({ error: "validation_error", message: "Invalid contact ID" });
    return;
  }

  await db.delete(contactsTable).where(and(eq(contactsTable.id, contactId), eq(contactsTable.userId, req.userId!)));
  res.json({ success: true, message: "Contact deleted" });
});

export default router;
