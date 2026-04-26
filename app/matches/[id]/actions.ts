"use server";
import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { db } from "@/lib/db";
import { matches, matchParticipants, matchRatings, users, profiles } from "@/db/schema";
import { eq, and, sql } from "drizzle-orm";
import { requireAuth } from "@/lib/auth";
import {
  sendJoinedEmail,
  sendLeftEmail,
  sendJoinConfirmationEmail,
  sendCancelledEmail,
  sendMatchCompletedEmail,
} from "@/lib/email";

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

  try {
    const [creator] = await db.select().from(users).where(eq(users.id, match.createdById)).limit(1);
    const [creatorProfile] = await db.select().from(profiles).where(eq(profiles.userId, match.createdById)).limit(1);
    const joinerName = user.profile?.displayName ?? user.email;
    const creatorName = creatorProfile?.displayName ?? creator?.email ?? "there";

    if (creator && creator.id !== user.id) {
      await sendJoinedEmail({
        creatorEmail: creator.email,
        creatorName,
        joinerName,
        matchTitle: match.title,
        matchId,
      });
    }
    await sendJoinConfirmationEmail({
      userEmail: user.email,
      userName: joinerName,
      matchTitle: match.title,
      matchLocation: match.location,
      matchDate: match.scheduledAt,
      matchId,
    });
  } catch (e) {
    console.error("Email failed:", e);
  }

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

  try {
    const [creator] = await db.select().from(users).where(eq(users.id, match.createdById)).limit(1);
    const [creatorProfile] = await db.select().from(profiles).where(eq(profiles.userId, match.createdById)).limit(1);
    const leaverName = user.profile?.displayName ?? user.email;
    const creatorName = creatorProfile?.displayName ?? creator?.email ?? "there";

    if (creator) {
      await sendLeftEmail({
        creatorEmail: creator.email,
        creatorName,
        leaverName,
        matchTitle: match.title,
        matchId,
      });
    }
  } catch (e) {
    console.error("Email failed:", e);
  }

  revalidatePath(`/matches/${matchId}`);
}

export async function cancelMatch(matchId: number) {
  const user = await requireAuth();
  if (!user) redirect("/auth/login");

  const [match] = await db.select().from(matches).where(eq(matches.id, matchId)).limit(1);
  if (!match || match.createdById !== user.id) return { error: "Not authorized." };

  await db.update(matches).set({ status: "cancelled" }).where(eq(matches.id, matchId));

  // Notify all participants (except creator)
  try {
    const [creatorProfile] = await db.select().from(profiles).where(eq(profiles.userId, user.id)).limit(1);
    const creatorName = creatorProfile?.displayName ?? user.email;

    const participants = await db
      .select({ user: users, profile: profiles })
      .from(matchParticipants)
      .innerJoin(users, eq(users.id, matchParticipants.userId))
      .leftJoin(profiles, eq(profiles.userId, matchParticipants.userId))
      .where(eq(matchParticipants.matchId, matchId));

    await Promise.allSettled(
      participants
        .filter((p) => p.user.id !== user.id)
        .map((p) =>
          sendCancelledEmail({
            participantEmail: p.user.email,
            participantName: p.profile?.displayName ?? p.user.email,
            matchTitle: match.title,
            matchDate: match.scheduledAt,
            creatorName,
          })
        )
    );
  } catch (e) {
    console.error("Cancel email failed:", e);
  }

  revalidatePath(`/matches/${matchId}`);
  redirect("/matches");
}

export async function markMatchComplete(matchId: number) {
  const user = await requireAuth();
  if (!user) redirect("/auth/login");

  const [match] = await db.select().from(matches).where(eq(matches.id, matchId)).limit(1);
  if (!match || match.createdById !== user.id) return { error: "Not authorized." };
  if (match.status !== "open") return { error: "Match is not open." };

  await db.update(matches).set({ status: "completed" }).where(eq(matches.id, matchId));

  // Notify all participants to rate their teammates
  try {
    const participants = await db
      .select({ user: users, profile: profiles })
      .from(matchParticipants)
      .innerJoin(users, eq(users.id, matchParticipants.userId))
      .leftJoin(profiles, eq(profiles.userId, matchParticipants.userId))
      .where(eq(matchParticipants.matchId, matchId));

    await Promise.allSettled(
      participants.map((p) =>
        sendMatchCompletedEmail({
          participantEmail: p.user.email,
          participantName: p.profile?.displayName ?? p.user.email,
          matchTitle: match.title,
          matchId,
        })
      )
    );
  } catch (e) {
    console.error("Completed email failed:", e);
  }

  revalidatePath(`/matches/${matchId}`);
}

export async function submitRating(formData: FormData) {
  const user = await requireAuth();
  if (!user) redirect("/auth/login");

  const matchId = parseInt(formData.get("matchId") as string);
  const rateeId = parseInt(formData.get("rateeId") as string);
  const stars = parseInt(formData.get("stars") as string);
  const comment = (formData.get("comment") as string)?.trim() || null;

  if (isNaN(matchId) || isNaN(rateeId) || isNaN(stars) || stars < 1 || stars > 5) {
    return { error: "Invalid rating data." };
  }

  if (rateeId === user.id) return { error: "Cannot rate yourself." };

  // Verify user is a participant
  const [participant] = await db
    .select()
    .from(matchParticipants)
    .where(and(eq(matchParticipants.matchId, matchId), eq(matchParticipants.userId, user.id)))
    .limit(1);
  if (!participant) return { error: "You were not part of this match." };

  // Verify match is completed or past
  const [match] = await db.select().from(matches).where(eq(matches.id, matchId)).limit(1);
  if (!match) return { error: "Match not found." };
  const isPast = new Date(match.scheduledAt) < new Date();
  if (match.status !== "completed" && !isPast) {
    return { error: "Match must be completed before rating." };
  }

  await db
    .insert(matchRatings)
    .values({ matchId, raterId: user.id, rateeId, stars, comment })
    .onConflictDoNothing();

  revalidatePath(`/matches/${matchId}`);
}
