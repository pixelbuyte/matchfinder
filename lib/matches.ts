import { db } from "./db";
import { matches, matchParticipants, users, profiles } from "@/db/schema";
import { eq, gt, and, like, sql, lt, desc, or } from "drizzle-orm";

export interface MatchFilters {
  city?: string;
  sport?: string;
  skillLevel?: string;
  date?: string; // YYYY-MM-DD
  page?: number;
  perPage?: number;
}

export interface PaginatedMatches {
  matches: Awaited<ReturnType<typeof enrichMatches>>;
  total: number;
  page: number;
  perPage: number;
  totalPages: number;
}

export async function getMatches(filters: MatchFilters = {}): Promise<PaginatedMatches> {
  const page = Math.max(1, filters.page ?? 1);
  const perPage = Math.min(50, Math.max(1, filters.perPage ?? 12));
  const offset = (page - 1) * perPage;

  const now = new Date().toISOString();
  const conditions = [eq(matches.status, "open"), gt(matches.scheduledAt, now)];

  if (filters.city) conditions.push(like(matches.city, `%${filters.city}%`));
  if (filters.sport) conditions.push(eq(matches.sport, filters.sport));
  if (filters.skillLevel) conditions.push(eq(matches.skillLevel, filters.skillLevel));
  if (filters.date) {
    const start = filters.date + "T00:00:00.000Z";
    const end = filters.date + "T23:59:59.999Z";
    conditions.push(
      sql`${matches.scheduledAt} >= ${start} AND ${matches.scheduledAt} <= ${end}`
    );
  }

  const where = and(...conditions);

  const [countRow] = await db
    .select({ count: sql<number>`count(*)` })
    .from(matches)
    .where(where);
  const total = countRow?.count ?? 0;

  const rows = await db
    .select()
    .from(matches)
    .where(where)
    .orderBy(matches.scheduledAt)
    .limit(perPage)
    .offset(offset);

  return {
    matches: await enrichMatches(rows),
    total,
    page,
    perPage,
    totalPages: Math.ceil(total / perPage),
  };
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

export interface UserMatches {
  created: typeof matches.$inferSelect[];
  joined: typeof matches.$inferSelect[];
}

export async function getUserMatches(userId: number): Promise<UserMatches> {
  const created = await db
    .select()
    .from(matches)
    .where(eq(matches.createdById, userId))
    .orderBy(desc(matches.scheduledAt));

  const participatingIn = await db
    .select({ matchId: matchParticipants.matchId })
    .from(matchParticipants)
    .where(eq(matchParticipants.userId, userId));

  const joinedIds = participatingIn.map((p) => p.matchId);
  const createdIds = new Set(created.map((m) => m.id));

  let joined: typeof matches.$inferSelect[] = [];
  if (joinedIds.length > 0) {
    const allJoined = await db
      .select()
      .from(matches)
      .where(
        sql`${matches.id} IN (${sql.join(joinedIds.map((id) => sql`${id}`), sql`, `)})`
      )
      .orderBy(desc(matches.scheduledAt));
    // Exclude matches the user created (those appear in created)
    joined = allJoined.filter((m) => !createdIds.has(m.id));
  }

  return { created, joined };
}

export async function getMatchById(matchId: number) {
  const [match] = await db
    .select()
    .from(matches)
    .where(eq(matches.id, matchId))
    .limit(1);
  return match ?? null;
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
