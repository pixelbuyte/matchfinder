import { getMatches, getUserUpcomingMatches } from "@/lib/matches";
import { getSession } from "@/lib/auth";
import MatchCard from "@/components/MatchCard";
import NearMeButton from "@/components/NearMeButton";
import Link from "next/link";

const SPORTS = ["soccer", "basketball", "padel", "tennis", "running", "other"];

export default async function MatchesPage({
  searchParams,
}: {
  searchParams: Promise<{ city?: string; sport?: string; date?: string }>;
}) {
  const params = await searchParams;
  const session = await getSession();

  let matchList: Awaited<ReturnType<typeof getMatches>> = [];
  let dbError = false;
  try {
    matchList = await getMatches({
      city: params.city,
      sport: params.sport,
      date: params.date,
    });
  } catch (e) {
    console.error("getMatches failed:", e);
    dbError = true;
  }

  let upcomingMatches: Awaited<ReturnType<typeof getUserUpcomingMatches>> = [];
  if (session) {
    try {
      upcomingMatches = await getUserUpcomingMatches(session.userId);
    } catch {}
  }

  const isFiltered = params.city || params.sport || params.date;

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-bold text-gray-900">Browse Matches</h1>
        {session && (
          <Link href="/dashboard/matches/create" className="bg-blue-600 text-white px-4 py-2 rounded-lg text-sm font-semibold hover:bg-blue-700">
            + Create
          </Link>
        )}
      </div>

      {/* Upcoming matches notification banner */}
      {upcomingMatches.length > 0 && (
        <div className="bg-blue-50 border border-blue-200 rounded-xl p-4">
          <p className="text-sm font-semibold text-blue-800 mb-2">
            🔔 You have {upcomingMatches.length} match{upcomingMatches.length > 1 ? "es" : ""} coming up in the next 48 hours!
          </p>
          <div className="space-y-1">
            {upcomingMatches.map((m) => (
              <Link key={m.id} href={`/matches/${m.id}`} className="flex items-center gap-2 text-sm text-blue-700 hover:underline">
                <span>⚽</span>
                <span className="font-medium">{m.title}</span>
                <span className="text-blue-500">— {new Date(m.scheduledAt).toLocaleString([], { weekday: "short", month: "short", day: "numeric", hour: "2-digit", minute: "2-digit" })}</span>
              </Link>
            ))}
          </div>
        </div>
      )}

      {/* Filter bar */}
      <form method="GET" className="bg-white rounded-xl shadow p-4 flex flex-wrap gap-3 items-end">
        <div className="flex gap-2 flex-1 min-w-40">
          <input
            name="city"
            defaultValue={params.city}
            placeholder="Filter by city"
            className="border border-gray-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 flex-1"
          />
          <NearMeButton currentCity={params.city} />
        </div>
        <select
          name="sport"
          defaultValue={params.sport ?? ""}
          className="border border-gray-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
        >
          <option value="">All sports</option>
          {SPORTS.map((s) => (
            <option key={s} value={s}>{s.charAt(0).toUpperCase() + s.slice(1)}</option>
          ))}
        </select>
        <input
          name="date"
          type="date"
          defaultValue={params.date}
          className="border border-gray-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
        />
        <button type="submit" className="bg-blue-600 text-white px-4 py-2 rounded-lg text-sm font-semibold hover:bg-blue-700">
          Filter
        </button>
        {isFiltered && (
          <Link href="/matches" className="text-gray-500 text-sm px-2 py-2 hover:text-gray-700">Clear</Link>
        )}
      </form>

      {/* DB error state */}
      {dbError && (
        <div className="bg-red-50 border border-red-200 rounded-xl p-6 text-center">
          <p className="text-red-700 font-medium mb-1">Couldn't load matches right now</p>
          <p className="text-sm text-red-500">There was a connection issue. Try refreshing.</p>
        </div>
      )}

      {/* Match list or empty state */}
      {!dbError && matchList.length === 0 && (
        <div className="bg-white rounded-xl shadow p-10 text-center space-y-4">
          {isFiltered ? (
            <>
              <p className="text-2xl">🔍</p>
              <p className="text-gray-700 font-medium">No matches found for those filters</p>
              <p className="text-sm text-gray-500">Try different filters or clear them to see all matches</p>
              <Link href="/matches" className="inline-block text-blue-600 text-sm hover:underline">Clear filters</Link>
            </>
          ) : session ? (
            <>
              <p className="text-3xl">⚽</p>
              <p className="text-gray-700 font-medium text-lg">No upcoming matches yet</p>
              <p className="text-sm text-gray-500">Be the first to create one in your city!</p>
              <Link
                href="/dashboard/matches/create"
                className="inline-block bg-blue-600 text-white px-6 py-2.5 rounded-lg font-semibold hover:bg-blue-700"
              >
                Create a Match
              </Link>
            </>
          ) : (
            <>
              <p className="text-3xl">🏅</p>
              <p className="text-gray-700 font-medium text-lg">No upcoming matches yet</p>
              <p className="text-sm text-gray-500">Join to create or browse matches near you</p>
              <div className="flex justify-center gap-3 mt-2">
                <Link href="/auth/register" className="bg-blue-600 text-white px-5 py-2 rounded-lg font-semibold hover:bg-blue-700 text-sm">
                  Sign Up Free
                </Link>
                <Link href="/auth/login" className="border border-gray-300 text-gray-700 px-5 py-2 rounded-lg font-semibold hover:bg-gray-50 text-sm">
                  Log In
                </Link>
              </div>
            </>
          )}
        </div>
      )}

      {!dbError && matchList.length > 0 && (
        <div className="grid gap-4 sm:grid-cols-2">
          {matchList.map((match) => (
            <MatchCard key={match.id} match={match} />
          ))}
        </div>
      )}
    </div>
  );
}
