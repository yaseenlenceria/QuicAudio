import { sql } from "drizzle-orm";
import { pgTable, text, varchar, timestamp, integer, jsonb, boolean } from "drizzle-orm/pg-core";
import { createInsertSchema } from "drizzle-zod";
import { z } from "zod";

// Anonymous users - identified by browser-generated UUID
export const users = pgTable("users", {
  id: varchar("id", { length: 36 }).primaryKey(),
  country: varchar("country", { length: 2 }),
  lastSeen: timestamp("last_seen").defaultNow(),
  totalCalls: integer("total_calls").default(0),
  totalDuration: integer("total_duration").default(0), // in seconds
  abuseScore: integer("abuse_score").default(0), // higher = more problematic
  trustLevel: varchar("trust_level", { length: 20 }).default("new"), // new, verified, regular
  createdAt: timestamp("created_at").defaultNow(),
});

// Call sessions for analytics
export const callSessions = pgTable("call_sessions", {
  id: varchar("id", { length: 36 }).primaryKey().default(sql`gen_random_uuid()`),
  user1Id: varchar("user1_id", { length: 36 }).notNull(),
  user2Id: varchar("user2_id", { length: 36 }).notNull(),
  startedAt: timestamp("started_at").defaultNow(),
  endedAt: timestamp("ended_at"),
  duration: integer("duration"), // in seconds
  endedBy: varchar("ended_by", { length: 36 }), // which user ended it
  connectionQuality: varchar("connection_quality", { length: 20 }), // strong, medium, weak
  reconnects: integer("reconnects").default(0),
});

// Abuse reports
export const abuseReports = pgTable("abuse_reports", {
  id: varchar("id", { length: 36 }).primaryKey().default(sql`gen_random_uuid()`),
  reporterId: varchar("reporter_id", { length: 36 }).notNull(),
  reportedUserId: varchar("reported_user_id", { length: 36 }).notNull(),
  sessionId: varchar("session_id", { length: 36 }),
  reason: varchar("reason", { length: 50 }).notNull(), // harassment, spam, inappropriate, other
  details: text("details"),
  createdAt: timestamp("created_at").defaultNow(),
});

// Matchmaking preferences (stored per user)
export const matchPreferences = pgTable("match_preferences", {
  id: varchar("id", { length: 36 }).primaryKey().default(sql`gen_random_uuid()`),
  userId: varchar("user_id", { length: 36 }).notNull().unique(),
  countries: jsonb("countries").$type<string[]>(), // array of country codes
  languages: jsonb("languages").$type<string[]>(),
  ageRange: jsonb("age_range").$type<{ min: number; max: number }>(),
  moods: jsonb("moods").$type<string[]>(), // sad, happy, talkative, chill, etc.
  updatedAt: timestamp("updated_at").defaultNow(),
});

// Zod schemas for validation
export const insertUserSchema = createInsertSchema(users).omit({
  createdAt: true,
  lastSeen: true,
  totalCalls: true,
  totalDuration: true,
  abuseScore: true,
  trustLevel: true,
});

export const insertCallSessionSchema = createInsertSchema(callSessions).omit({
  id: true,
  startedAt: true,
});

export const insertAbuseReportSchema = createInsertSchema(abuseReports).omit({
  id: true,
  createdAt: true,
});

export const insertMatchPreferencesSchema = createInsertSchema(matchPreferences).omit({
  id: true,
  updatedAt: true,
});

// Types
export type User = typeof users.$inferSelect;
export type InsertUser = z.infer<typeof insertUserSchema>;

export type CallSession = typeof callSessions.$inferSelect;
export type InsertCallSession = z.infer<typeof insertCallSessionSchema>;

export type AbuseReport = typeof abuseReports.$inferSelect;
export type InsertAbuseReport = z.infer<typeof insertAbuseReportSchema>;

export type MatchPreferences = typeof matchPreferences.$inferSelect;
export type InsertMatchPreferences = z.infer<typeof insertMatchPreferencesSchema>;

// WebSocket message types for signaling
export const wsMessageSchema = z.discriminatedUnion("type", [
  z.object({
    type: z.literal("join-queue"),
    userId: z.string(),
    preferences: z.object({
      countries: z.array(z.string()).optional(),
      languages: z.array(z.string()).optional(),
      ageRange: z.object({ min: z.number(), max: z.number() }).optional(),
      moods: z.array(z.string()).optional(),
    }).optional(),
  }),
  z.object({
    type: z.literal("leave-queue"),
    userId: z.string(),
  }),
  z.object({
    type: z.literal("offer"),
    userId: z.string(),
    targetUserId: z.string(),
    offer: z.any(), // RTCSessionDescriptionInit
  }),
  z.object({
    type: z.literal("answer"),
    userId: z.string(),
    targetUserId: z.string(),
    answer: z.any(), // RTCSessionDescriptionInit
  }),
  z.object({
    type: z.literal("ice-candidate"),
    userId: z.string(),
    targetUserId: z.string(),
    candidate: z.any(), // RTCIceCandidateInit
  }),
  z.object({
    type: z.literal("end-call"),
    userId: z.string(),
    targetUserId: z.string(),
  }),
  z.object({
    type: z.literal("heartbeat"),
    userId: z.string(),
  }),
]);

export type WSMessage = z.infer<typeof wsMessageSchema>;
