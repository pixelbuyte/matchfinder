import { db } from "@/lib/db";
import { users, profiles, matchParticipants, matches } from "@/db/schema";
import { requireAuth } from "@/lib/auth";
import { notFound } from "next/navigation";
import { eq, desc, sql } from "drizzle-orm";
import Link from "next/link";
import {
  getUserAverageRating,
  getUserRatings,
  getUserRatingCount,
} from "@/lib/ratings";
import {
  isFollowing,
  getFollowerCount,
  getFollowingCount,
} from "@/lib/follows";
import { toggleFollow } from "./actions";
import { SPORT_COLORS } from "@/lib/constants";

export default async function ProfilePage({ params }: { params: Promise<{ userId: string }> }) {
  const { userId: userIdStr } = await params;
  const userId = parseInt(userIdStr);
  if (isNaN(userId)) notFound();

  const [user] = await db.select().from(users).where(eq(users.id, userId)).limit(1);
  if (!user) notFound();

  const [profile] = await db.select().from(profiles).where(eq(profiles.userId, userId)).limit(1);

  const currentUser = await requireAuth();
  const isSelf = currentUser?.id === userId;
  const following = currentUser && !isSelf ? await isFollowing(currentUser.id, userId) : false;

  const [followerCount, followingCount, avgRating, ratingCount] = await Promise.all([
    getFollowerCount(userId),
    getFollowingCount(userId),
    getUserAverageRating(userId),
    getUserRatingCount(userId),
  ]);

  // Recent ratings received
  const recentRatings = await getUserRatings(userId);

  // Matches the user participated in
  const participations = await db
    .select({ matchId: matchParticipants.matchId })
    .from(matchParticipants)
    .where(eq(matchParticipants.userId, userId));

  const matchCount = participations.length;

  let recentMatches: typeof matches.$inferSelect[] = [];
  if (participations.length > 0) {
    const ids = participations.map((p) => p.matchId);
    recentMatches = await db
      .select()
      .from(matches)
      .where(sql`${matches.id} IN (${sql.join(ids.map((id) => sql`${id}`), sql`, `)})`)
      .orderBy(desc(matches.scheduledAt))
      .limit(5);
  }

  const displayName = profile?.displayName ?? user.email;

  return (
    <div className="max-w-2xl mx-auto space-y-6">
      <Link href="/matches" className="text-sm text-blue-600 hover:underline">← Browse Matches</Link>

      {/* Profile header */}
      <div className="bg-white rounded-xl shadow p-6">
        <div className="flex items-start justify-between gap-4">
          <div className="flex items-center gap-4">
            <div className="w-16 h-16 rounded-full bg-blue-100 text-blue-700 flex items-center justify-center text-2xl font-bold">
              {displayName[0].toUpperCase()}
            </div>
            <div>
              <h1 className="text-xl font-bold text-gray-900">{displayName}</h1>
              {profile && (
                <p className="text-sm text-gray-500">{profile.city} · {profile.mainSport} · {profile.skillLevel}</p>
              )}
            </div>
          </div>
          {currentUser && !isSelf && (
            <form action={toggleFollow.bind(null, userId, following)}>
              <button
                type="submit"
                className={`px-4 py-2 rounded-lg text-sm font-semibold transition-colors ${
                  following
                    ? "border border-gray-300 text-gray-600 hover:bg-gray-50"
                    : "bg-blue-600 text-white hover:bg-blue-700"
                }`}
              >
                {following ? "Unfollow" : "Follow"}
              </button>
            </form>
          )}
          {isSelf && (
            <Link
              href="/auth/onboarding"
              className="border border-gray-300 text-gray-600 px-4 py-2 rounded-lg text-sm hover:bg-gray-50"
            >
              Edit Profile
            </Link>
          )}
        </div>

        {profile?.bio && (
          <p className="mt-4 text-sm text-gray-600">{profile.bio}</p>
        )}

        {/* Stats row */}
        <div className="mt-5 grid grid-cols-4 gap-3 text-center">
          <div>
            <p className="text-xl font-bold text-gray-900">{matchCount}</p>
            <p className="text-xs text-gray-500">Matches</p>
          </div>
          <div>
            <p className="text-xl font-bold text-gray-900">
              {avgRating !== null ? `${avgRating}⭐` : "—"}
            </p>
            <p className="text-xs text-gray-500">Avg rating ({ratingCount})</p>
          </div>
          <div>
            <p className="text-xl font-bold text-gray-900">{followerCount}</p>
            <p className="text-xs text-gray-500">Followers</p>
          </div>
          <div>
            <p className="text-xl font-bold text-gray-900">{followingCount}</p>
            <p className="text-xs text-gray-500">Following</p>
          </div>
        </div>
      </div>

      {/* Recent matches */}
      {recentMatches.length > 0 && (
        <div className="bg-white rounded-xl shadow p-6">
          <h2 className="font-semibold text-gray-800 mb-3">Recent Matches</h2>
          <ul className="space-y-2">
            {recentMatches.map((m) => (
              <li key={m.id}>
                <Link href={`/matches/${m.id}`} className="flex items-center justify-between group hover:bg-gray-50 rounded-lg p-2 -mx-2 transition-colors">
                  <div className="flex items-center gap-3">
                    <span className={`text-xs font-semibold px-2 py-0.5 rounded-full ${SPORT_COLORS[m.sport] ?? "bg-gray-100 text-gray-800"}`}>
                      {m.sport}
                    </span>
                    <span className="text-sm text-gray-800 font-medium group-hover:text-blue-600">{m.title}</span>
                  </div>
                  <div className="flex items-center gap-2 text-xs text-gray-400">
                    <span>{new Date(m.scheduledAt).toLocaleDateString()}</span>
                    <span className={`px-1.5 py-0.5 rounded-full font-medium ${
                      m.status === "completed" ? "bg-green-100 text-green-700" :
                      m.status === "cancelled" ? "bg-red-100 text-red-600" :
                      "bg-blue-100 text-blue-700"
                    }`}>{m.status}</span>
                  </div>
                </Link>
              </li>
            ))}
          </ul>
        </div>
      )}

      {/* Recent ratings received */}
      {recentRatings.length > 0 && (
        <div className="bg-white rounded-xl shadow p-6">
          <h2 className="font-semibold text-gray-800 mb-3">
            Recent Ratings
            {avgRating !== null && (
              <span className="ml-2 text-sm font-normal text-gray-500">
                avg {avgRating} ⭐ from {ratingCount} rating{ratingCount !== 1 ? "s" : ""}
              </span>
            )}
          </h2>
          <ul className="space-y-3">
            {recentRatings.slice(0, 8).map((r) => {
              const raterName = r.raterProfile?.displayName ?? "Anonymous";
              return (
                <li key={r.rating.id} className="text-sm">
                  <div className="flex items-center gap-2 mb-0.5">
                    <span className="font-medium text-gray-700">{raterName}</span>
                    <span className="text-yellow-500">{"⭐".repeat(r.rating.stars)}</span>
                    <span className="text-gray-400 text-xs">{new Date(r.rating.createdAt).toLocaleDateString()}</span>
                  </div>
                  {r.rating.comment && (
                    <p className="text-gray-500 pl-0.5">{r.rating.comment}</p>
                  )}
                </li>
              );
            })}
          </ul>
        </div>
      )}
    </div>
  );
}
