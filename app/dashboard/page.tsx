import { requireAuth } from "@/lib/auth";
import { getRecommendations } from "@/lib/recommendations";
import { logout } from "@/app/auth/actions";
import MatchCard from "@/components/MatchCard";
import Link from "next/link";
import { redirect } from "next/navigation";

export default async function DashboardPage() {
  const user = await requireAuth();
  if (!user) redirect("/auth/login");

  const recommendations = user.profile ? await getRecommendations(user.id) : [];

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
