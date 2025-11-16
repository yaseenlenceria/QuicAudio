import { calculateMatchScore } from './ai-matcher';

interface QueuedUser {
  userId: string;
  socketId: string;
  joinedAt: number;
  preferences: {
    countries?: string[];
    languages?: string[];
    moods?: string[];
  };
  abuseScore: number;
  trustLevel: string;
}

export class MatchmakingQueue {
  private queue: Map<string, QueuedUser> = new Map();
  private matchingInProgress: Set<string> = new Set();

  addUser(user: QueuedUser): number {
    this.queue.set(user.userId, user);
    return this.queue.size;
  }

  removeUser(userId: string): boolean {
    this.matchingInProgress.delete(userId);
    return this.queue.delete(userId);
  }

  getQueuePosition(userId: string): number | null {
    const user = this.queue.get(userId);
    if (!user) return null;

    const sorted = Array.from(this.queue.values()).sort((a, b) => a.joinedAt - b.joinedAt);
    return sorted.findIndex(u => u.userId === userId) + 1;
  }

  getQueueSize(): number {
    return this.queue.size;
  }

  async findMatch(userId: string): Promise<{ partnerId: string; score: number } | null> {
    const user = this.queue.get(userId);
    if (!user || this.matchingInProgress.has(userId)) {
      return null;
    }

    this.matchingInProgress.add(userId);

    let bestMatch: { partnerId: string; score: number } | null = null;

    for (const [candidateId, candidate] of Array.from(this.queue.entries())) {
      if (candidateId === userId || this.matchingInProgress.has(candidateId)) {
        continue;
      }

      const score = await calculateMatchScore(
        {
          userId: user.userId,
          countries: user.preferences.countries,
          languages: user.preferences.languages,
          moods: user.preferences.moods,
          abuseScore: user.abuseScore,
          trustLevel: user.trustLevel,
        },
        {
          userId: candidate.userId,
          countries: candidate.preferences.countries,
          languages: candidate.preferences.languages,
          moods: candidate.preferences.moods,
          abuseScore: candidate.abuseScore,
          trustLevel: candidate.trustLevel,
        }
      );

      if (!bestMatch || score > bestMatch.score) {
        bestMatch = { partnerId: candidateId, score };
      }
    }

    if (bestMatch && bestMatch.score > 50) {
      this.matchingInProgress.add(bestMatch.partnerId);
      this.queue.delete(userId);
      this.queue.delete(bestMatch.partnerId);
      return bestMatch;
    }

    this.matchingInProgress.delete(userId);
    return null;
  }

  getUserSocketId(userId: string): string | undefined {
    return this.queue.get(userId)?.socketId;
  }

  getWaitingUsers(): QueuedUser[] {
    return Array.from(this.queue.values());
  }
}

export const matchmakingQueue = new MatchmakingQueue();
