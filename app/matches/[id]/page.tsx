import { db } from "@/lib/db";
import { matches, matchParticipants, users, profiles } from "@/db/schema";
import { requireAuth } from "@/lib/auth";
import { joinMatch, leaveMatch, cancelMatch } from "./actions";
import { notFound } from "next/navigation";
import { eq, sql } from "drizzle-orm";
import Link from "next/link";

const SPORT_COLORS: Record<string, string> = {
  soccer: "bg-green-100 text-green-800",
  basketball: "bg-orange-100 text-orange-800",
  padel: "bg-blue-100 text-blue-800",
  tennis: "bg-yellow-100 text-yellow-800",
  running: "bg-purple-100 text-purple-800",
  other: "bg-gray-100 text-gray-800",
};

export default async function MatchDetailPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const matchId = parseInt(id);
  if (isNaN(matchId)) notFound();

  const [match] = await db.select().from(matches).where(eq(matches.id, matchId)).limit(1);
  if (!match) notFound();

  // Get creator
  const [creatorRow] = await db
    .select({ user: users, profile: profiles })
    .from(users)
    .leftJoin(profiles, eq(profiles.userId, users.id))
    .where(eq(users.id, match.createdById))
    .limit(1);

  // Get participants with user info
  const participantRows = await db
    .select({ participant: matchParticipants, user: users, profile: profiles })
    .from(matchParticipants)
    .innerJoin(users, eq(users.id, matchParticipants.userId))
    .leftJoin(profiles, eq(profiles.userId, matchParticipants.userId))
    .where(eq(matchParticipants.matchId, matchId));

  const currentUser = await requireAuth();
  const isCreator = currentUser?.id === match.createdById;
  const isParticipant = participantRows.some((p) => p.participant.userId === currentUser?.id);
  const isFull = participantRows.length >= match.maxPlayers;
  const spotsLeft = match.maxPlayers - participantRows.length;

  const creatorName = creatorRow?.profile?.displayName ?? creatorRow?.user?.email ?? "Unknown";

  return (
    <div className="max-w-3xl mx-auto space-y-6">
      <Link href="/matches" className="text-sm text-blue-600 hover:underline">← Back to matches</Link>

      {match.status === "cancelled" && (
        <div className="bg-red-50 border border-red-200 rounded-xl p-4 text-red-700 text-sm font-medium">
          This match has been cancelled.
        </div>
      )}

      <div className="bg-white rounded-xl shadow p-6">
        <div className="flex flex-wrap items-start justify-between gap-4 mb-4">
          <div>
            <span className={`inline-block text-xs font-semibold px-2 py-1 rounded-full mb-2 ${SPORT_COLORS[match.sport] ?? "bg-gray-100 text-gray-800"}`}>
              {match.sport.charAt(0).toUpperCase() + match.sport.slice(1)}
            </span>
            <h1 className="text-2xl font-bold text-gray-900">{match.title}</h1>
          </div>
          <div className="text-right text-sm text-gray-500">
            <p className="font-medium text-gray-700">{participantRows.length} / {match.maxPlayers} players</p>
            <p>{spotsLeft} spot{spotsLeft !== 1 ? "s" : ""} left</p>
          </div>
        </div>

        {match.description && <p className="text-gray-600 mb-4">{match.description}</p>}

        <div className="grid sm:grid-cols-2 gap-3 text-sm text-gray-600 mb-6">
          <div><span className="font-medium">📅 Date:</span> {new Date(match.scheduledAt).toLocaleString()}</div>
          <div><span className="font-medium">📍 Location:</span> {match.location}</div>
          <div><span className="font-medium">🏙️ City:</span> {match.city}</div>
          <div><span className="font-medium">⚡ Skill:</span> {match.skillLevel}</div>
          <div><span className="font-medium">👤 Created by:</span> {creatorName}</div>
        </div>

        {match.status === "open" && currentUser && (
          <div className="flex gap-3">
            {isCreator ? (
              <form action={cancelMatch.bind(null, match.id)}>
                <button type="submit" className="bg-red-600 text-white px-4 py-2 rounded-lg text-sm font-semibold hover:bg-red-700">
                  Cancel Match
                </button>
              </form>
            ) : isParticipant ? (
              <form action={leaveMatch.bind(null, match.id)}>
                <button type="submit" className="border border-gray-300 text-gray-600 px-4 py-2 rounded-lg text-sm hover:bg-gray-50">
                  Leave Match
                </button>
              </form>
            ) : isFull ? (
              <button disabled className="bg-gray-100 text-gray-400 px-4 py-2 rounded-lg text-sm cursor-not-allowed">
                Match Full
              </button>
            ) : (
              <form action={joinMatch.bind(null, match.id)}>
                <button type="submit" className="bg-blue-600 text-white px-4 py-2 rounded-lg text-sm font-semibold hover:bg-blue-700">
                  Join Match
                </button>
              </form>
            )}
          </div>
        )}
        {!currentUser && (
          <p className="text-sm text-gray-500">
            <Link href="/auth/login" className="text-blue-600 hover:underline">Log in</Link> to join this match.
          </p>
        )}
      </div>

      <div className="bg-white rounded-xl shadow p-6">
        <h2 className="font-semibold text-gray-800 mb-3">Participants ({participantRows.length})</h2>
        {participantRows.length === 0 ? (
          <p className="text-sm text-gray-500">No participants yet.</p>
        ) : (
          <ul className="space-y-2">
            {participantRows.map((p) => {
              const name = p.profile?.displayName ?? p.user.email;
              return (
                <li key={p.participant.id} className="flex items-center gap-2 text-sm text-gray-700">
                  <span className="w-7 h-7 rounded-full bg-blue-100 text-blue-700 flex items-center justify-center font-semibold text-xs">
                    {name[0].toUpperCase()}
                  </span>
                  {name}
                  {p.participant.userId === match.createdById && (
                    <span className="text-xs bg-gray-100 text-gray-500 px-1.5 py-0.5 rounded">creator</span>
                  )}
                </li>
              );
            })}
          </ul>
        )}
      </div>
    </div>
  );
}
