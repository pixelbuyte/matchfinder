import { db } from "./db";
import { follows, profiles, users } from "@/db/schema";
import { eq, and, sql } from "drizzle-orm";

export async function followUser(followerId: number, followeeId: number) {
  if (followerId === followeeId) return;
  await db
    .insert(follows)
    .values({ followerId, followeeId })
    .onConflictDoNothing();
}

export async function unfollowUser(followerId: number, followeeId: number) {
  await db
    .delete(follows)
    .where(and(eq(follows.followerId, followerId), eq(follows.followeeId, followeeId)));
}

export async function isFollowing(followerId: number, followeeId: number): Promise<boolean> {
  const [row] = await db
    .select()
    .from(follows)
    .where(and(eq(follows.followerId, followerId), eq(follows.followeeId, followeeId)))
    .limit(1);
  return !!row;
}

export async function getFollowerCount(userId: number): Promise<number> {
  const [row] = await db
    .select({ count: sql<number>`count(*)` })
    .from(follows)
    .where(eq(follows.followeeId, userId));
  return row?.count ?? 0;
}

export async function getFollowingCount(userId: number): Promise<number> {
  const [row] = await db
    .select({ count: sql<number>`count(*)` })
    .from(follows)
    .where(eq(follows.followerId, userId));
  return row?.count ?? 0;
}

export async function getFollowers(userId: number) {
  return db
    .select({ follow: follows, profile: profiles, user: users })
    .from(follows)
    .innerJoin(users, eq(users.id, follows.followerId))
    .leftJoin(profiles, eq(profiles.userId, follows.followerId))
    .where(eq(follows.followeeId, userId));
}

export async function getFollowing(userId: number) {
  return db
    .select({ follow: follows, profile: profiles, user: users })
    .from(follows)
    .innerJoin(users, eq(users.id, follows.followeeId))
    .leftJoin(profiles, eq(profiles.userId, follows.followeeId))
    .where(eq(follows.followerId, userId));
}
