import {
  users,
  callSessions,
  abuseReports,
  matchPreferences,
  type User,
  type InsertUser,
  type CallSession,
  type InsertCallSession,
  type AbuseReport,
  type InsertAbuseReport,
  type MatchPreferences,
  type InsertMatchPreferences,
} from "@shared/schema";
import { db } from "./db";
import { eq, desc } from "drizzle-orm";

export interface IStorage {
  getUser(id: string): Promise<User | undefined>;
  createUser(user: InsertUser): Promise<User>;
  updateUserActivity(id: string): Promise<void>;
  updateUserStats(id: string, callDuration: number): Promise<void>;
  
  createCallSession(session: InsertCallSession): Promise<CallSession>;
  endCallSession(id: string, duration: number, endedBy: string, quality: string): Promise<void>;
  
  createAbuseReport(report: InsertAbuseReport): Promise<AbuseReport>;
  
  getMatchPreferences(userId: string): Promise<MatchPreferences | undefined>;
  upsertMatchPreferences(prefs: InsertMatchPreferences): Promise<MatchPreferences>;
}

export class DatabaseStorage implements IStorage {
  async getUser(id: string): Promise<User | undefined> {
    const [user] = await db.select().from(users).where(eq(users.id, id));
    return user || undefined;
  }

  async createUser(insertUser: InsertUser): Promise<User> {
    const [user] = await db
      .insert(users)
      .values(insertUser)
      .returning();
    return user;
  }

  async updateUserActivity(id: string): Promise<void> {
    await db
      .update(users)
      .set({ lastSeen: new Date() })
      .where(eq(users.id, id));
  }

  async updateUserStats(id: string, callDuration: number): Promise<void> {
    const user = await this.getUser(id);
    if (!user) return;

    await db
      .update(users)
      .set({
        totalCalls: (user.totalCalls || 0) + 1,
        totalDuration: (user.totalDuration || 0) + callDuration,
      })
      .where(eq(users.id, id));
  }

  async createCallSession(insertSession: InsertCallSession): Promise<CallSession> {
    const [session] = await db
      .insert(callSessions)
      .values(insertSession)
      .returning();
    return session;
  }

  async endCallSession(
    id: string,
    duration: number,
    endedBy: string,
    quality: string
  ): Promise<void> {
    await db
      .update(callSessions)
      .set({
        endedAt: new Date(),
        duration,
        endedBy,
        connectionQuality: quality,
      })
      .where(eq(callSessions.id, id));
  }

  async createAbuseReport(insertReport: InsertAbuseReport): Promise<AbuseReport> {
    const [report] = await db
      .insert(abuseReports)
      .values(insertReport)
      .returning();
    return report;
  }

  async getMatchPreferences(userId: string): Promise<MatchPreferences | undefined> {
    const [prefs] = await db
      .select()
      .from(matchPreferences)
      .where(eq(matchPreferences.userId, userId));
    return prefs || undefined;
  }

  async upsertMatchPreferences(insertPrefs: InsertMatchPreferences): Promise<MatchPreferences> {
    const existing = await this.getMatchPreferences(insertPrefs.userId);
    
    if (existing) {
      const [updated] = await db
        .update(matchPreferences)
        .set({
          countries: insertPrefs.countries,
          languages: insertPrefs.languages,
          ageRange: insertPrefs.ageRange,
          moods: insertPrefs.moods,
          updatedAt: new Date(),
        })
        .where(eq(matchPreferences.userId, insertPrefs.userId))
        .returning();
      return updated;
    } else {
      const [created] = await db
        .insert(matchPreferences)
        .values(insertPrefs)
        .returning();
      return created;
    }
  }
}

export const storage = new DatabaseStorage();
