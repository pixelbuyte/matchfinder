import { db } from "./db";
import { matches, matchParticipants, profiles } from "@/db/schema";
import { eq, gt, and, notInArray, sql } from "drizzle-orm";
import { enrichMatches } from "./matches";

export async function getRecommendations(userId: number) {
  const [profile] = await db
    .select()
    .from(profiles)
    .where(eq(profiles.userId, userId))
    .limit(1);
  if (!profile) return [];

  const now = new Date().toISOString();

  // Get match IDs the user already joined
  const joined = await db
    .select({ matchId: matchParticipants.matchId })
    .from(matchParticipants)
    .where(eq(matchParticipants.userId, userId));
  const joinedIds = joined.map((j) => j.matchId);

  const query = db
    .select()
    .from(matches)
    .where(
      and(
        eq(matches.status, "open"),
        gt(matches.scheduledAt, now),
        joinedIds.length > 0 ? notInArray(matches.id, joinedIds) : undefined
      )
    )
    .orderBy(matches.scheduledAt);

  const allMatches = await query;

  // Get participant counts per match to filter out full ones
  const participantCounts = await db
    .select({
      matchId: matchParticipants.matchId,
      count: sql<number>`count(*)`.as("count"),
    })
    .from(matchParticipants)
    .groupBy(matchParticipants.matchId);

  const countMap = new Map(participantCounts.map((p) => [p.matchId, p.count]));

  // Score and filter
  const scored = allMatches
    .filter((m) => (countMap.get(m.id) ?? 0) < m.maxPlayers)
    .map((m) => {
      let score = 0;
      if (m.city.toLowerCase() === profile.city.toLowerCase()) score += 3;
      if (m.sport === profile.mainSport) score += 2;
      if (m.skillLevel === profile.skillLevel) score += 1;
      return { match: m, score };
    })
    .sort((a, b) => b.score - a.score || a.match.scheduledAt.localeCompare(b.match.scheduledAt));

  const top = scored.slice(0, 5).map((s) => s.match);
  return enrichMatches(top);
}
