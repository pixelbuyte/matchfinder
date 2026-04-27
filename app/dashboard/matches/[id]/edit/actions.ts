"use server";
import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { db } from "@/lib/db";
import { matches } from "@/db/schema";
import { eq } from "drizzle-orm";
import { requireAuth } from "@/lib/auth";

export async function updateMatch(matchId: number, formData: FormData) {
  const user = await requireAuth();
  if (!user) redirect("/auth/login");

  const [match] = await db.select().from(matches).where(eq(matches.id, matchId)).limit(1);
  if (!match || match.createdById !== user.id) return { error: "Not authorized." };
  if (match.status !== "open") return { error: "Cannot edit a match that is not open." };

  const title = (formData.get("title") as string)?.trim();
  const description = (formData.get("description") as string)?.trim() || null;
  const city = (formData.get("city") as string)?.trim();
  const location = (formData.get("location") as string)?.trim();
  const scheduledAt = formData.get("scheduledAt") as string;
  const maxPlayers = parseInt(formData.get("maxPlayers") as string);
  const skillLevel = formData.get("skillLevel") as string;

  if (!title || !city || !location || !scheduledAt || !skillLevel)
    return { error: "All required fields must be filled." };
  if (isNaN(maxPlayers) || maxPlayers < 2)
    return { error: "Max players must be at least 2." };

  await db
    .update(matches)
    .set({
      title,
      description,
      city,
      location,
      scheduledAt: new Date(scheduledAt).toISOString(),
      maxPlayers,
      skillLevel,
    })
    .where(eq(matches.id, matchId));

  revalidatePath(`/matches/${matchId}`);
  redirect(`/matches/${matchId}`);
}
