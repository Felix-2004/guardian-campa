import { pgTable, text, serial, integer, real, boolean, timestamp, jsonb } from "drizzle-orm/pg-core";
import { createInsertSchema } from "drizzle-zod";
import { z } from "zod/v4";

export const usersTable = pgTable("users", {
  id: serial("id").primaryKey(),
  phone: text("phone").unique(),
  email: text("email").unique(),
  googleId: text("google_id").unique(),
  name: text("name"),
  avatarUrl: text("avatar_url"),
  age: integer("age"),
  gender: text("gender"),
  healthConcerns: text("health_concerns"),
  issues: jsonb("issues").$type<string[]>().default([]),
  profileCompleted: boolean("profile_completed").notNull().default(false),
  homeLat: real("home_lat"),
  homeLng: real("home_lng"),
  preferences: jsonb("preferences").$type<{
    routineReminders: boolean;
    safetyCheckIns: boolean;
    emergencyAlerts: boolean;
    sosDelay: number;
  }>().default({
    routineReminders: true,
    safetyCheckIns: true,
    emergencyAlerts: true,
    sosDelay: 3,
  }),
  familyToken: text("family_token"),
  createdAt: timestamp("created_at").notNull().defaultNow(),
});

export const insertUserSchema = createInsertSchema(usersTable).omit({ id: true, createdAt: true });
export type InsertUser = z.infer<typeof insertUserSchema>;
export type User = typeof usersTable.$inferSelect;
