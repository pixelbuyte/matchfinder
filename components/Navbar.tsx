import Link from "next/link";
import { getSession } from "@/lib/auth";
import { db } from "@/lib/db";
import { profiles } from "@/db/schema";
import { eq } from "drizzle-orm";
import { logout } from "@/app/auth/actions";

export default async function Navbar() {
  const session = await getSession();
  let displayName: string | null = null;
  let userId: number | null = null;

  if (session) {
    userId = session.userId;
    const [profile] = await db
      .select({ displayName: profiles.displayName })
      .from(profiles)
      .where(eq(profiles.userId, session.userId))
      .limit(1);
    displayName = profile?.displayName ?? null;
  }

  return (
    <nav className="bg-white border-b border-gray-200">
      <div className="max-w-4xl mx-auto px-4 py-3 flex items-center justify-between">
        <Link href="/" className="text-xl font-bold text-blue-600">MatchFinder</Link>
        <div className="flex gap-4 text-sm font-medium items-center">
          <Link href="/matches" className="text-gray-600 hover:text-blue-600">Matches</Link>
          {session ? (
            <>
              <Link href="/dashboard/my-matches" className="text-gray-600 hover:text-blue-600">My Matches</Link>
              <Link href="/dashboard" className="text-gray-600 hover:text-blue-600">Dashboard</Link>
              {userId && (
                <Link
                  href={`/profile/${userId}`}
                  className="flex items-center gap-1.5 text-gray-700 hover:text-blue-600"
                >
                  <span className="w-6 h-6 rounded-full bg-blue-100 text-blue-700 flex items-center justify-center text-xs font-bold">
                    {(displayName ?? "?")[0].toUpperCase()}
                  </span>
                  <span>{displayName ?? "Profile"}</span>
                </Link>
              )}
              <form action={logout}>
                <button type="submit" className="text-gray-500 hover:text-red-500 transition-colors">
                  Log out
                </button>
              </form>
            </>
          ) : (
            <>
              <Link href="/auth/login" className="text-gray-600 hover:text-blue-600">Login</Link>
              <Link
                href="/auth/register"
                className="bg-blue-600 text-white px-3 py-1.5 rounded-lg hover:bg-blue-700 transition-colors"
              >
                Sign Up
              </Link>
            </>
          )}
        </div>
      </div>
    </nav>
  );
}
