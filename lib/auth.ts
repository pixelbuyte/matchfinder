import bcrypt from "bcryptjs";
import { cookies } from "next/headers";
import { db } from "./db";
import { users, profiles } from "@/db/schema";
import { eq } from "drizzle-orm";

const SESSION_COOKIE = "mf_session";

export async function hashPassword(password: string) {
  return bcrypt.hash(password, 10);
}

export async function verifyPassword(password: string, hash: string) {
  return bcrypt.compare(password, hash);
}

export async function createSession(userId: number) {
  const payload = Buffer.from(
    JSON.stringify({ userId, exp: Date.now() + 7 * 24 * 3600 * 1000 })
  ).toString("base64");
  const cookieStore = await cookies();
  cookieStore.set(SESSION_COOKIE, payload, {
    httpOnly: true,
    secure: process.env.NODE_ENV === "production",
    sameSite: "lax",
    maxAge: 7 * 24 * 3600,
    path: "/",
  });
}

export async function getSession(): Promise<{ userId: number } | null> {
  const cookieStore = await cookies();
  const raw = cookieStore.get(SESSION_COOKIE)?.value;
  if (!raw) return null;
  try {
    const parsed = JSON.parse(Buffer.from(raw, "base64").toString("utf8"));
    if (parsed.exp < Date.now()) return null;
    return { userId: parsed.userId };
  } catch {
    return null;
  }
}

export async function destroySession() {
  const cookieStore = await cookies();
  cookieStore.delete(SESSION_COOKIE);
}

export async function requireAuth() {
  const session = await getSession();
  if (!session) return null;
  const [user] = await db
    .select()
    .from(users)
    .where(eq(users.id, session.userId))
    .limit(1);
  if (!user) return null;
  const [profile] = await db
    .select()
    .from(profiles)
    .where(eq(profiles.userId, session.userId))
    .limit(1);
  return { ...user, profile: profile ?? null };
}
