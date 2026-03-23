"use server";
import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { db } from "@/lib/db";
import { matches, matchParticipants } from "@/db/schema";
import { eq, and, sql } from "drizzle-orm";
import { requireAuth } from "@/lib/auth";

export async function joinMatch(matchId: number) {
  const user = await requireAuth();
  if (!user) redirect("/auth/login");

  const [match] = await db.select().from(matches).where(eq(matches.id, matchId)).limit(1);
  if (!match || match.status !== "open") return { error: "Match not available." };

  const [countRow] = await db
    .select({ count: sql<number>`count(*)` })
    .from(matchParticipants)
    .where(eq(matchParticipants.matchId, matchId));
  if ((countRow?.count ?? 0) >= match.maxPlayers) return { error: "Match is full." };

  const [alreadyJoined] = await db
    .select()
    .from(matchParticipants)
    .where(and(eq(matchParticipants.matchId, matchId), eq(matchParticipants.userId, user.id)))
    .limit(1);
  if (alreadyJoined) return { error: "Already joined." };

  await db.insert(matchParticipants).values({ matchId, userId: user.id });
  revalidatePath(`/matches/${matchId}`);
}

export async function leaveMatch(matchId: number) {
  const user = await requireAuth();
  if (!user) redirect("/auth/login");

  const [match] = await db.select().from(matches).where(eq(matches.id, matchId)).limit(1);
  if (!match) return { error: "Match not found." };
  if (match.createdById === user.id) return { error: "Creators cannot leave. Cancel the match instead." };

  await db.delete(matchParticipants).where(
    and(eq(matchParticipants.matchId, matchId), eq(matchParticipants.userId, user.id))
  );
  revalidatePath(`/matches/${matchId}`);
}

export async function cancelMatch(matchId: number) {
  const user = await requireAuth();
  if (!user) redirect("/auth/login");

  const [match] = await db.select().from(matches).where(eq(matches.id, matchId)).limit(1);
  if (!match || match.createdById !== user.id) return { error: "Not authorized." };

  await db.update(matches).set({ status: "cancelled" }).where(eq(matches.id, matchId));
  revalidatePath(`/matches/${matchId}`);
  redirect("/matches");
}
