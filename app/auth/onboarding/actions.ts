"use server";
import { redirect } from "next/navigation";
import { db } from "@/lib/db";
import { profiles } from "@/db/schema";
import { eq } from "drizzle-orm";
import { requireAuth } from "@/lib/auth";

export async function saveProfile(formData: FormData) {
  const user = await requireAuth();
  if (!user) redirect("/auth/login");

  const displayName = (formData.get("displayName") as string)?.trim();
  const city = (formData.get("city") as string)?.trim();
  const mainSport = formData.get("mainSport") as string;
  const skillLevel = formData.get("skillLevel") as string;

  if (!displayName || !city || !mainSport || !skillLevel)
    return { error: "All fields are required." };

  const [existing] = await db.select().from(profiles).where(eq(profiles.userId, user.id)).limit(1);

  if (existing) {
    await db.update(profiles).set({ displayName, city, mainSport, skillLevel }).where(eq(profiles.userId, user.id));
  } else {
    await db.insert(profiles).values({ userId: user.id, displayName, city, mainSport, skillLevel });
  }

  redirect("/dashboard");
}
