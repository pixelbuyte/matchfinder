import { requireAuth } from "@/lib/auth";
import { getUserMatches } from "@/lib/matches";
import { redirect } from "next/navigation";
import Link from "next/link";
import { SPORT_COLORS } from "@/lib/constants";

function statusBadge(status: string) {
  const map: Record<string, string> = {
    open: "bg-blue-100 text-blue-700",
    completed: "bg-green-100 text-green-700",
    cancelled: "bg-red-100 text-red-600",
  };
  return map[status] ?? "bg-gray-100 text-gray-600";
}

export default async function MyMatchesPage() {
  const user = await requireAuth();
  if (!user) redirect("/auth/login");

  const { created, joined } = await getUserMatches(user.id);

  return (
    <div className="max-w-2xl mx-auto space-y-8">
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-bold text-gray-900">My Matches</h1>
        <Link
          href="/dashboard/matches/create"
          className="bg-blue-600 text-white px-4 py-2 rounded-lg text-sm font-semibold hover:bg-blue-700"
        >
          + Create Match
        </Link>
      </div>

      {/* Matches I created */}
      <section>
        <h2 className="text-lg font-semibold text-gray-800 mb-3">
          Created ({created.length})
        </h2>
        {created.length === 0 ? (
          <p className="text-sm text-gray-500">You haven't created any matches yet.</p>
        ) : (
          <ul className="space-y-2">
            {created.map((m) => (
              <li key={m.id}>
                <Link
                  href={`/matches/${m.id}`}
                  className="flex items-center justify-between bg-white rounded-xl shadow-sm border border-gray-100 p-4 hover:shadow transition-shadow"
                >
                  <div className="flex items-center gap-3 min-w-0">
                    <span className={`text-xs font-semibold px-2 py-0.5 rounded-full shrink-0 ${SPORT_COLORS[m.sport] ?? "bg-gray-100 text-gray-800"}`}>
                      {m.sport}
                    </span>
                    <span className="font-medium text-gray-900 truncate">{m.title}</span>
                  </div>
                  <div className="flex items-center gap-2 shrink-0 ml-3 text-xs text-gray-400">
                    <span>{new Date(m.scheduledAt).toLocaleDateString()}</span>
                    <span className={`px-2 py-0.5 rounded-full font-medium ${statusBadge(m.status)}`}>
                      {m.status}
                    </span>
                    {m.status === "open" && (
                      <Link
                        href={`/dashboard/matches/${m.id}/edit`}
                        className="text-blue-500 hover:text-blue-700 hover:underline"
                        onClick={(e) => e.stopPropagation()}
                      >
                        Edit
                      </Link>
                    )}
                  </div>
                </Link>
              </li>
            ))}
          </ul>
        )}
      </section>

      {/* Matches I joined */}
      <section>
        <h2 className="text-lg font-semibold text-gray-800 mb-3">
          Joined ({joined.length})
        </h2>
        {joined.length === 0 ? (
          <p className="text-sm text-gray-500">You haven't joined any matches yet.{" "}
            <Link href="/matches" className="text-blue-600 hover:underline">Browse matches →</Link>
          </p>
        ) : (
          <ul className="space-y-2">
            {joined.map((m) => (
              <li key={m.id}>
                <Link
                  href={`/matches/${m.id}`}
                  className="flex items-center justify-between bg-white rounded-xl shadow-sm border border-gray-100 p-4 hover:shadow transition-shadow"
                >
                  <div className="flex items-center gap-3 min-w-0">
                    <span className={`text-xs font-semibold px-2 py-0.5 rounded-full shrink-0 ${SPORT_COLORS[m.sport] ?? "bg-gray-100 text-gray-800"}`}>
                      {m.sport}
                    </span>
                    <span className="font-medium text-gray-900 truncate">{m.title}</span>
                  </div>
                  <div className="flex items-center gap-2 shrink-0 ml-3 text-xs text-gray-400">
                    <span>{new Date(m.scheduledAt).toLocaleDateString()}</span>
                    <span className={`px-2 py-0.5 rounded-full font-medium ${statusBadge(m.status)}`}>
                      {m.status}
                    </span>
                  </div>
                </Link>
              </li>
            ))}
          </ul>
        )}
      </section>
    </div>
  );
}
