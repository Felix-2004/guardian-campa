import { pgTable, text, serial, integer, real, timestamp, jsonb } from "drizzle-orm/pg-core";
import { createInsertSchema } from "drizzle-zod";
import { z } from "zod/v4";

export const trackingSessionsTable = pgTable("tracking_sessions", {
  id: serial("id").primaryKey(),
  sessionId: text("session_id").notNull().unique(),
  userId: integer("user_id").notNull(),
  currentLat: real("current_lat"),
  currentLng: real("current_lng"),
  pathHistory: jsonb("path_history").$type<Array<{ lat: number; lng: number; timestamp: string }>>().default([]),
  status: text("status").notNull().default("active"),
  createdAt: timestamp("created_at").notNull().defaultNow(),
  expiresAt: timestamp("expires_at").notNull(),
});

export const insertTrackingSchema = createInsertSchema(trackingSessionsTable).omit({ id: true, createdAt: true });
export type InsertTracking = z.infer<typeof insertTrackingSchema>;
export type TrackingSession = typeof trackingSessionsTable.$inferSelect;
