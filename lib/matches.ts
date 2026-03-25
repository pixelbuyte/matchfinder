import { db } from "./db";
import { matches, matchParticipants, users, profiles } from "@/db/schema";
import { eq, gt, and, like, sql, lt } from "drizzle-orm";

export interface MatchFilters {
  city?: string;
  sport?: string;
  date?: string; // YYYY-MM-DD
}

export async function getMatches(filters: MatchFilters = {}) {
  const now = new Date().toISOString();
  const conditions = [eq(matches.status, "open"), gt(matches.scheduledAt, now)];

  if (filters.city) conditions.push(like(matches.city, `%${filters.city}%`));
  if (filters.sport) conditions.push(eq(matches.sport, filters.sport));
  if (filters.date) {
    const start = filters.date + "T00:00:00.000Z";
    const end = filters.date + "T23:59:59.999Z";
    conditions.push(
      sql`${matches.scheduledAt} >= ${start} AND ${matches.scheduledAt} <= ${end}`
    );
  }

  const rows = await db
    .select()
    .from(matches)
    .where(and(...conditions))
    .orderBy(matches.scheduledAt);

  return enrichMatches(rows);
}

export async function getUserUpcomingMatches(userId: number) {
  const now = new Date().toISOString();
  const in48h = new Date(Date.now() + 48 * 60 * 60 * 1000).toISOString();

  const joined = await db
    .select({ matchId: matchParticipants.matchId })
    .from(matchParticipants)
    .where(eq(matchParticipants.userId, userId));

  if (joined.length === 0) return [];

  const ids = joined.map((j) => j.matchId);
  return db
    .select()
    .from(matches)
    .where(
      and(
        eq(matches.status, "open"),
        gt(matches.scheduledAt, now),
        lt(matches.scheduledAt, in48h),
        sql`${matches.id} IN (${sql.join(ids.map((id) => sql`${id}`), sql`, `)})`
      )
    )
    .orderBy(matches.scheduledAt);
}

// Attach createdBy + participants to each match
export async function enrichMatches(matchRows: typeof matches.$inferSelect[]) {
  if (matchRows.length === 0) return [];

  const matchIds = matchRows.map((m) => m.id);

  const allParticipants = await db
    .select()
    .from(matchParticipants)
    .where(sql`${matchParticipants.matchId} IN (${sql.join(matchIds.map(id => sql`${id}`), sql`, `)})`);

  const creatorIds = [...new Set(matchRows.map((m) => m.createdById))];
  const allCreators = await db
    .select({ user: users, profile: profiles })
    .from(users)
    .leftJoin(profiles, eq(profiles.userId, users.id))
    .where(sql`${users.id} IN (${sql.join(creatorIds.map(id => sql`${id}`), sql`, `)})`);

  const creatorMap = new Map(allCreators.map((c) => [c.user.id, c]));
  const participantMap = new Map<number, typeof matchParticipants.$inferSelect[]>();
  for (const p of allParticipants) {
    if (!participantMap.has(p.matchId)) participantMap.set(p.matchId, []);
    participantMap.get(p.matchId)!.push(p);
  }

  return matchRows.map((m) => ({
    ...m,
    createdBy: creatorMap.get(m.createdById) ?? { user: { email: "" }, profile: null },
    participants: participantMap.get(m.id) ?? [],
  }));
}
