import { db } from "./db";
import { matchRatings, profiles, users, matchParticipants } from "@/db/schema";
import { eq, and, avg, sql } from "drizzle-orm";

export async function getMatchRatings(matchId: number) {
  return db
    .select({
      rating: matchRatings,
      raterProfile: profiles,
      rateeProfile: profiles,
    })
    .from(matchRatings)
    .leftJoin(profiles, eq(profiles.userId, matchRatings.raterId))
    .where(eq(matchRatings.matchId, matchId));
}

export async function getUserRatings(userId: number) {
  return db
    .select({
      rating: matchRatings,
      raterProfile: profiles,
    })
    .from(matchRatings)
    .leftJoin(profiles, eq(profiles.userId, matchRatings.raterId))
    .where(eq(matchRatings.rateeId, userId))
    .orderBy(sql`${matchRatings.createdAt} DESC`);
}

export async function getUserAverageRating(userId: number): Promise<number | null> {
  const [row] = await db
    .select({ avg: avg(matchRatings.stars) })
    .from(matchRatings)
    .where(eq(matchRatings.rateeId, userId));
  if (!row?.avg) return null;
  return Math.round(Number(row.avg) * 10) / 10;
}

export async function getRatingsGivenByUser(userId: number, matchId: number) {
  return db
    .select()
    .from(matchRatings)
    .where(and(eq(matchRatings.raterId, userId), eq(matchRatings.matchId, matchId)));
}

// Returns participant userIds that the current user has NOT yet rated for a match
export async function getUnratedParticipants(matchId: number, currentUserId: number) {
  const participants = await db
    .select({ userId: matchParticipants.userId, profile: profiles, user: users })
    .from(matchParticipants)
    .leftJoin(users, eq(users.id, matchParticipants.userId))
    .leftJoin(profiles, eq(profiles.userId, matchParticipants.userId))
    .where(eq(matchParticipants.matchId, matchId));

  const alreadyRated = await db
    .select({ rateeId: matchRatings.rateeId })
    .from(matchRatings)
    .where(and(eq(matchRatings.matchId, matchId), eq(matchRatings.raterId, currentUserId)));

  const ratedIds = new Set(alreadyRated.map((r) => r.rateeId));

  return participants.filter(
    (p) => p.userId !== currentUserId && !ratedIds.has(p.userId)
  );
}

export async function getUserRatingCount(userId: number): Promise<number> {
  const [row] = await db
    .select({ count: sql<number>`count(*)` })
    .from(matchRatings)
    .where(eq(matchRatings.rateeId, userId));
  return row?.count ?? 0;
}
