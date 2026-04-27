import { db } from "@/lib/db";
import { matches, matchParticipants, users, profiles, matchRatings } from "@/db/schema";
import { requireAuth } from "@/lib/auth";
import { joinMatch, leaveMatch, cancelMatch, markMatchComplete, submitRating } from "./actions";
import { notFound } from "next/navigation";
import { eq, sql, and } from "drizzle-orm";
import Link from "next/link";
import MatchChat from "@/components/MatchChat";
import { SPORT_COLORS } from "@/lib/constants";
import { getUnratedParticipants, getUserAverageRating } from "@/lib/ratings";

export default async function MatchDetailPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const matchId = parseInt(id);
  if (isNaN(matchId)) notFound();

  const [match] = await db.select().from(matches).where(eq(matches.id, matchId)).limit(1);
  if (!match) notFound();

  const [creatorRow] = await db
    .select({ user: users, profile: profiles })
    .from(users)
    .leftJoin(profiles, eq(profiles.userId, users.id))
    .where(eq(users.id, match.createdById))
    .limit(1);

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
  const isPast = new Date(match.scheduledAt) < new Date();
  const isRatable = (match.status === "completed" || isPast) && isParticipant && currentUser;

  const creatorName = creatorRow?.profile?.displayName ?? creatorRow?.user?.email ?? "Unknown";

  // Load unrated participants if match is ratable
  const unratedParticipants = isRatable
    ? await getUnratedParticipants(matchId, currentUser!.id)
    : [];

  // Load ratings received by each participant for display
  const ratingRows = await db
    .select({
      rateeId: matchRatings.rateeId,
      avg: sql<number>`avg(${matchRatings.stars})`,
      count: sql<number>`count(*)`,
    })
    .from(matchRatings)
    .where(eq(matchRatings.matchId, matchId))
    .groupBy(matchRatings.rateeId);

  const matchRatingMap = new Map(ratingRows.map((r) => [r.rateeId, r]));

  return (
    <div className="max-w-3xl mx-auto space-y-6">
      <Link href="/matches" className="text-sm text-blue-600 hover:underline">← Back to matches</Link>

      {match.status === "cancelled" && (
        <div className="bg-red-50 border border-red-200 rounded-xl p-4 text-red-700 text-sm font-medium">
          This match has been cancelled.
        </div>
      )}
      {match.status === "completed" && (
        <div className="bg-green-50 border border-green-200 rounded-xl p-4 text-green-700 text-sm font-medium">
          This match has been completed.
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
            {match.status === "open" && <p>{spotsLeft} spot{spotsLeft !== 1 ? "s" : ""} left</p>}
          </div>
        </div>

        {match.description && <p className="text-gray-600 mb-4">{match.description}</p>}

        <div className="grid sm:grid-cols-2 gap-3 text-sm text-gray-600 mb-6">
          <div><span className="font-medium">📅 Date:</span> {new Date(match.scheduledAt).toLocaleString()}</div>
          <div><span className="font-medium">📍 Location:</span> {match.location}</div>
          <div><span className="font-medium">🏙️ City:</span> {match.city}</div>
          <div><span className="font-medium">⚡ Skill:</span> {match.skillLevel}</div>
          <div>
            <span className="font-medium">👤 Created by:</span>{" "}
            <Link href={`/profile/${match.createdById}`} className="text-blue-600 hover:underline">
              {creatorName}
            </Link>
          </div>
        </div>

        {match.status === "open" && currentUser && (
          <div className="flex flex-wrap gap-3">
            {isCreator ? (
              <>
                <Link
                  href={`/dashboard/matches/${match.id}/edit`}
                  className="border border-blue-300 text-blue-600 px-4 py-2 rounded-lg text-sm hover:bg-blue-50"
                >
                  Edit Match
                </Link>
                {isPast && (
                  <form action={markMatchComplete.bind(null, match.id)}>
                    <button type="submit" className="bg-green-600 text-white px-4 py-2 rounded-lg text-sm font-semibold hover:bg-green-700">
                      Mark Complete
                    </button>
                  </form>
                )}
                <form action={cancelMatch.bind(null, match.id)}>
                  <button type="submit" className="bg-red-600 text-white px-4 py-2 rounded-lg text-sm font-semibold hover:bg-red-700">
                    Cancel Match
                  </button>
                </form>
              </>
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

      {/* Rate teammates section */}
      {isRatable && unratedParticipants.length > 0 && (
        <div className="bg-yellow-50 border border-yellow-200 rounded-xl p-6">
          <h2 className="font-semibold text-gray-800 mb-1">Rate Your Teammates</h2>
          <p className="text-sm text-gray-500 mb-4">You have {unratedParticipants.length} teammate{unratedParticipants.length !== 1 ? "s" : ""} to rate.</p>
          <div className="space-y-4">
            {unratedParticipants.map((p) => {
              const name = p.profile?.displayName ?? p.user?.email ?? "Player";
              return (
                <form key={p.userId} action={submitRating} className="bg-white rounded-lg p-4 border border-yellow-100 space-y-3">
                  <input type="hidden" name="matchId" value={matchId} />
                  <input type="hidden" name="rateeId" value={p.userId} />
                  <div className="flex items-center gap-2">
                    <span className="w-8 h-8 rounded-full bg-blue-100 text-blue-700 flex items-center justify-center font-semibold text-xs">
                      {name[0].toUpperCase()}
                    </span>
                    <span className="font-medium text-sm text-gray-800">{name}</span>
                  </div>
                  <div className="flex gap-2 items-center">
                    <span className="text-sm text-gray-600">Stars:</span>
                    {[1, 2, 3, 4, 5].map((s) => (
                      <label key={s} className="cursor-pointer">
                        <input type="radio" name="stars" value={s} required className="sr-only" />
                        <span className="text-xl hover:scale-110 transition-transform inline-block">⭐</span>
                      </label>
                    ))}
                  </div>
                  <input
                    name="comment"
                    placeholder="Optional comment (max 200 chars)"
                    maxLength={200}
                    className="w-full border border-gray-200 rounded px-3 py-1.5 text-sm focus:outline-none focus:ring-2 focus:ring-yellow-400"
                  />
                  <button type="submit" className="bg-yellow-500 text-white px-4 py-1.5 rounded-lg text-sm font-semibold hover:bg-yellow-600">
                    Submit Rating
                  </button>
                </form>
              );
            })}
          </div>
        </div>
      )}

      <MatchChat matchId={matchId} currentUserId={currentUser?.id ?? null} />

      <div className="bg-white rounded-xl shadow p-6">
        <h2 className="font-semibold text-gray-800 mb-3">Participants ({participantRows.length})</h2>
        {participantRows.length === 0 ? (
          <p className="text-sm text-gray-500">No participants yet.</p>
        ) : (
          <ul className="space-y-2">
            {participantRows.map((p) => {
              const name = p.profile?.displayName ?? p.user.email;
              const rating = matchRatingMap.get(p.participant.userId);
              return (
                <li key={p.participant.id} className="flex items-center justify-between">
                  <div className="flex items-center gap-2 text-sm text-gray-700">
                    <span className="w-7 h-7 rounded-full bg-blue-100 text-blue-700 flex items-center justify-center font-semibold text-xs">
                      {name[0].toUpperCase()}
                    </span>
                    <Link href={`/profile/${p.participant.userId}`} className="hover:text-blue-600 hover:underline">
                      {name}
                    </Link>
                    {p.participant.userId === match.createdById && (
                      <span className="text-xs bg-gray-100 text-gray-500 px-1.5 py-0.5 rounded">creator</span>
                    )}
                  </div>
                  {rating && (
                    <span className="text-xs text-yellow-600 font-medium">
                      ⭐ {(Math.round(Number(rating.avg) * 10) / 10).toFixed(1)} ({rating.count})
                    </span>
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
