"use server";
import { redirect } from "next/navigation";
import { db } from "@/lib/db";
import { matches, matchParticipants } from "@/db/schema";
import { requireAuth } from "@/lib/auth";

export async function createMatch(formData: FormData) {
  const user = await requireAuth();
  if (!user) redirect("/auth/login");

  const title = (formData.get("title") as string)?.trim();
  const sport = formData.get("sport") as string;
  const description = (formData.get("description") as string)?.trim() || null;
  const city = (formData.get("city") as string)?.trim();
  const location = (formData.get("location") as string)?.trim();
  const scheduledAt = formData.get("scheduledAt") as string;
  const maxPlayers = parseInt(formData.get("maxPlayers") as string);
  const skillLevel = formData.get("skillLevel") as string;

  if (!title || !sport || !city || !location || !scheduledAt || !skillLevel)
    return { error: "All required fields must be filled." };
  if (isNaN(maxPlayers) || maxPlayers < 2)
    return { error: "Max players must be at least 2." };

  const [match] = await db.insert(matches).values({
    title, sport, description, city, location,
    scheduledAt: new Date(scheduledAt).toISOString(),
    maxPlayers, skillLevel, createdById: user.id,
  }).returning();

  await db.insert(matchParticipants).values({ matchId: match.id, userId: user.id });

  redirect(`/matches/${match.id}`);
}
