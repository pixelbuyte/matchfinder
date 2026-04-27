import { requireAuth } from "@/lib/auth";
import { getRecommendations } from "@/lib/recommendations";
import { logout } from "@/app/auth/actions";
import { getUserMatches } from "@/lib/matches";
import { getUserAverageRating, getUserRatingCount } from "@/lib/ratings";
import { getFollowerCount, getFollowingCount } from "@/lib/follows";
import MatchCard from "@/components/MatchCard";
import Link from "next/link";
import { redirect } from "next/navigation";

export default async function DashboardPage() {
  const user = await requireAuth();
  if (!user) redirect("/auth/login");

  const [recommendations, { created, joined }, avgRating, ratingCount, followerCount, followingCount] =
    await Promise.all([
      user.profile ? getRecommendations(user.id) : Promise.resolve([]),
      getUserMatches(user.id),
      getUserAverageRating(user.id),
      getUserRatingCount(user.id),
      getFollowerCount(user.id),
      getFollowingCount(user.id),
    ]);

  const upcomingJoined = joined.filter(
    (m) => m.status === "open" && new Date(m.scheduledAt) > new Date()
  );
  const upcomingCreated = created.filter(
    (m) => m.status === "open" && new Date(m.scheduledAt) > new Date()
  );

  return (
    <div className="space-y-8">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">
            Welcome back, {user.profile?.displayName ?? user.email}!
          </h1>
          <p className="text-gray-500 text-sm mt-1">{user.email}</p>
        </div>
        <div className="flex gap-3">
          <Link
            href="/dashboard/matches/create"
            className="bg-blue-600 text-white px-4 py-2 rounded-lg text-sm font-semibold hover:bg-blue-700"
          >
            + Create Match
          </Link>
          <form action={logout}>
            <button type="submit" className="border border-gray-300 text-gray-600 px-4 py-2 rounded-lg text-sm hover:bg-gray-50">
              Log out
            </button>
          </form>
        </div>
      </div>

      {/* Profile prompt */}
      {!user.profile && (
        <div className="bg-yellow-50 border border-yellow-200 rounded-xl p-4">
          <p className="text-yellow-800 text-sm">
            Complete your profile to get match recommendations.{" "}
            <Link href="/auth/onboarding" className="font-semibold underline">Set up now →</Link>
          </p>
        </div>
      )}

      {/* Stats */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
        <div className="bg-white rounded-xl shadow p-4 text-center">
          <p className="text-2xl font-bold text-gray-900">{created.length}</p>
          <p className="text-xs text-gray-500 mt-1">Matches Created</p>
        </div>
        <div className="bg-white rounded-xl shadow p-4 text-center">
          <p className="text-2xl font-bold text-gray-900">{joined.length + upcomingCreated.length}</p>
          <p className="text-xs text-gray-500 mt-1">Matches Played</p>
        </div>
        <div className="bg-white rounded-xl shadow p-4 text-center">
          <p className="text-2xl font-bold text-gray-900">
            {avgRating !== null ? `${avgRating}⭐` : "—"}
          </p>
          <p className="text-xs text-gray-500 mt-1">Avg Rating ({ratingCount})</p>
        </div>
        <div className="bg-white rounded-xl shadow p-4 text-center">
          <p className="text-2xl font-bold text-gray-900">{followerCount}</p>
          <p className="text-xs text-gray-500 mt-1">Followers</p>
        </div>
      </div>

      {/* Quick links */}
      <div className="flex flex-wrap gap-3">
        <Link
          href="/dashboard/my-matches"
          className="inline-flex items-center gap-2 border border-gray-200 bg-white text-gray-700 px-4 py-2 rounded-lg text-sm font-medium hover:border-blue-300 hover:text-blue-600 transition-colors"
        >
          My Matches ({created.length + joined.length})
        </Link>
        <Link
          href={`/profile/${user.id}`}
          className="inline-flex items-center gap-2 border border-gray-200 bg-white text-gray-700 px-4 py-2 rounded-lg text-sm font-medium hover:border-blue-300 hover:text-blue-600 transition-colors"
        >
          My Profile
        </Link>
        <Link
          href="/auth/onboarding"
          className="inline-flex items-center gap-2 border border-gray-200 bg-white text-gray-700 px-4 py-2 rounded-lg text-sm font-medium hover:border-blue-300 hover:text-blue-600 transition-colors"
        >
          Edit Profile
        </Link>
      </div>

      {/* Upcoming matches */}
      {(upcomingJoined.length > 0 || upcomingCreated.length > 0) && (
        <div>
          <h2 className="text-lg font-semibold text-gray-800 mb-3">Upcoming Matches</h2>
          <div className="space-y-2">
            {[...upcomingCreated, ...upcomingJoined]
              .sort((a, b) => a.scheduledAt.localeCompare(b.scheduledAt))
              .map((m) => (
                <Link
                  key={m.id}
                  href={`/matches/${m.id}`}
                  className="flex items-center justify-between bg-white rounded-xl shadow-sm border border-gray-100 p-4 hover:shadow transition-shadow"
                >
                  <span className="font-medium text-gray-900">{m.title}</span>
                  <div className="text-sm text-gray-500">
                    {new Date(m.scheduledAt).toLocaleString([], {
                      weekday: "short",
                      month: "short",
                      day: "numeric",
                      hour: "2-digit",
                      minute: "2-digit",
                    })}
                  </div>
                </Link>
              ))}
          </div>
        </div>
      )}

      {/* Recommendations */}
      <div>
        <h2 className="text-lg font-semibold text-gray-800 mb-4">Recommended for You</h2>
        {recommendations.length === 0 ? (
          <p className="text-gray-500 text-sm">
            {user.profile
              ? "No recommendations right now — check back later or browse all matches."
              : "Complete your profile to see recommendations."}
          </p>
        ) : (
          <div className="grid gap-4 sm:grid-cols-2">
            {recommendations.map((match) => (
              <MatchCard key={match.id} match={match} />
            ))}
          </div>
        )}
      </div>

      <div className="pt-2">
        <Link href="/matches" className="text-blue-600 hover:underline text-sm font-medium">
          Browse all matches →
        </Link>
      </div>
    </div>
  );
}
