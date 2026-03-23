import { getMatches } from "@/lib/matches";
import MatchCard from "@/components/MatchCard";
import Link from "next/link";

const SPORTS = ["soccer", "basketball", "padel", "tennis", "running", "other"];

export default async function MatchesPage({
  searchParams,
}: {
  searchParams: Promise<{ city?: string; sport?: string; date?: string }>;
}) {
  const params = await searchParams;
  const matches = await getMatches({
    city: params.city,
    sport: params.sport,
    date: params.date,
  });

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-bold text-gray-900">Browse Matches</h1>
        <Link href="/dashboard/matches/create" className="bg-blue-600 text-white px-4 py-2 rounded-lg text-sm font-semibold hover:bg-blue-700">
          + Create
        </Link>
      </div>

      {/* Filter bar */}
      <form method="GET" className="bg-white rounded-xl shadow p-4 flex flex-wrap gap-3">
        <input
          name="city"
          defaultValue={params.city}
          placeholder="Filter by city"
          className="border border-gray-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 flex-1 min-w-32"
        />
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
        <Link href="/matches" className="text-gray-500 text-sm px-2 py-2 hover:text-gray-700">Clear</Link>
      </form>

      {/* Match list */}
      {matches.length === 0 ? (
        <p className="text-gray-500 text-center py-12">No upcoming matches found. <Link href="/dashboard/matches/create" className="text-blue-600 hover:underline">Create one!</Link></p>
      ) : (
        <div className="grid gap-4 sm:grid-cols-2">
          {matches.map((match) => (
            <MatchCard key={match.id} match={match} />
          ))}
        </div>
      )}
    </div>
  );
}
