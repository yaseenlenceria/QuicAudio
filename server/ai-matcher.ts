import OpenAI from "openai";

if (!process.env.OPENAI_API_KEY) {
  throw new Error("OPENAI_API_KEY must be set");
}

const openai = new OpenAI({ apiKey: process.env.OPENAI_API_KEY });

interface UserProfile {
  userId: string;
  countries?: string[];
  languages?: string[];
  moods?: string[];
  abuseScore: number;
  trustLevel: string;
}

export async function calculateMatchScore(
  user1: UserProfile,
  user2: UserProfile
): Promise<number> {
  let score = 100;

  if (user1.countries && user1.countries.length > 0) {
    if (user2.countries && user2.countries.some(c => user1.countries!.includes(c))) {
      score += 20;
    }
  }

  if (user1.languages && user1.languages.length > 0) {
    if (user2.languages && user2.languages.some(l => user1.languages!.includes(l))) {
      score += 30;
    }
  }

  if (user1.moods && user1.moods.length > 0) {
    if (user2.moods && user2.moods.some(m => user1.moods!.includes(m))) {
      score += 15;
    }
  }

  score -= user1.abuseScore * 5;
  score -= user2.abuseScore * 5;

  if (user1.trustLevel === 'regular') score += 10;
  if (user2.trustLevel === 'regular') score += 10;

  return Math.max(0, score);
}

export async function detectSuspiciousBehavior(
  userId: string,
  callDuration: number,
  totalCalls: number,
  reportCount: number
): Promise<{ isSuspicious: boolean; reason?: string }> {
  if (reportCount > 3) {
    return { isSuspicious: true, reason: 'Multiple reports' };
  }

  if (totalCalls > 10 && callDuration < 10) {
    return { isSuspicious: true, reason: 'Excessive short calls (possible bot)' };
  }

  if (totalCalls > 20 && callDuration < 15) {
    return { isSuspicious: true, reason: 'Pattern suggests spam behavior' };
  }

  return { isSuspicious: false };
}

export async function analyzeMatchQuality(
  preferences: {
    countries?: string[];
    languages?: string[];
    moods?: string[];
  }
): Promise<{
  priority: 'high' | 'medium' | 'low';
  estimatedWaitTime: number;
}> {
  const hasFilters =
    (preferences.countries && preferences.countries.length > 0) ||
    (preferences.languages && preferences.languages.length > 0) ||
    (preferences.moods && preferences.moods.length > 0);

  if (!hasFilters) {
    return { priority: 'high', estimatedWaitTime: 5 };
  }

  const filterCount =
    (preferences.countries?.length || 0) +
    (preferences.languages?.length || 0) +
    (preferences.moods?.length || 0);

  if (filterCount <= 3) {
    return { priority: 'medium', estimatedWaitTime: 15 };
  }

  return { priority: 'low', estimatedWaitTime: 30 };
}
