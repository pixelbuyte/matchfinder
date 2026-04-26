import { db } from "@/lib/db";
import { matches } from "@/db/schema";
import { requireAuth } from "@/lib/auth";
import { notFound, redirect } from "next/navigation";
import { eq } from "drizzle-orm";
import { updateMatch } from "./actions";
import { SKILLS } from "@/lib/constants";
import Link from "next/link";

function toDatetimeLocal(iso: string) {
  const d = new Date(iso);
  const pad = (n: number) => String(n).padStart(2, "0");
  return `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}T${pad(d.getHours())}:${pad(d.getMinutes())}`;
}

export default async function EditMatchPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const matchId = parseInt(id);
  if (isNaN(matchId)) notFound();

  const user = await requireAuth();
  if (!user) redirect("/auth/login");

  const [match] = await db.select().from(matches).where(eq(matches.id, matchId)).limit(1);
  if (!match) notFound();
  if (match.createdById !== user.id) redirect(`/matches/${matchId}`);
  if (match.status !== "open") redirect(`/matches/${matchId}`);

  const boundAction = updateMatch.bind(null, matchId);

  return (
    <div className="max-w-lg mx-auto mt-8">
      <Link href={`/matches/${matchId}`} className="text-sm text-blue-600 hover:underline mb-4 inline-block">
        ← Back to match
      </Link>
      <h1 className="text-2xl font-bold text-gray-900 mb-6">Edit Match</h1>
      <form action={boundAction} className="bg-white rounded-xl shadow p-6 space-y-4">
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">Title</label>
          <input
            name="title"
            defaultValue={match.title}
            required
            maxLength={80}
            className="w-full border border-gray-300 rounded-lg px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500"
          />
        </div>
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">Description</label>
          <textarea
            name="description"
            defaultValue={match.description ?? ""}
            rows={3}
            maxLength={500}
            className="w-full border border-gray-300 rounded-lg px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500 resize-none"
          />
        </div>
        <div className="grid sm:grid-cols-2 gap-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">City</label>
            <input
              name="city"
              defaultValue={match.city}
              required
              className="w-full border border-gray-300 rounded-lg px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500"
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Location / Venue</label>
            <input
              name="location"
              defaultValue={match.location}
              required
              className="w-full border border-gray-300 rounded-lg px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500"
            />
          </div>
        </div>
        <div className="grid sm:grid-cols-2 gap-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Date & Time</label>
            <input
              name="scheduledAt"
              type="datetime-local"
              defaultValue={toDatetimeLocal(match.scheduledAt)}
              required
              className="w-full border border-gray-300 rounded-lg px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500"
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Max Players</label>
            <input
              name="maxPlayers"
              type="number"
              defaultValue={match.maxPlayers}
              min={2}
              max={100}
              required
              className="w-full border border-gray-300 rounded-lg px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500"
            />
          </div>
        </div>
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">Skill Level</label>
          <select
            name="skillLevel"
            defaultValue={match.skillLevel}
            required
            className="w-full border border-gray-300 rounded-lg px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500"
          >
            {SKILLS.map((s) => (
              <option key={s} value={s}>{s.charAt(0).toUpperCase() + s.slice(1)}</option>
            ))}
          </select>
        </div>
        <div className="flex gap-3 pt-2">
          <button
            type="submit"
            className="flex-1 bg-blue-600 text-white py-2 rounded-lg font-semibold hover:bg-blue-700"
          >
            Save Changes
          </button>
          <Link
            href={`/matches/${matchId}`}
            className="flex-1 text-center border border-gray-300 text-gray-600 py-2 rounded-lg font-semibold hover:bg-gray-50"
          >
            Cancel
          </Link>
        </div>
      </form>
    </div>
  );
}
