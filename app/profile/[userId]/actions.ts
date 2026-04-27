"use server";
import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { requireAuth } from "@/lib/auth";
import { followUser, unfollowUser } from "@/lib/follows";

export async function toggleFollow(targetUserId: number, currentlyFollowing: boolean) {
  const user = await requireAuth();
  if (!user) redirect("/auth/login");
  if (user.id === targetUserId) return;

  if (currentlyFollowing) {
    await unfollowUser(user.id, targetUserId);
  } else {
    await followUser(user.id, targetUserId);
  }

  revalidatePath(`/profile/${targetUserId}`);
}
