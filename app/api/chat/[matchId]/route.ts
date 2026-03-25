import { NextRequest, NextResponse } from "next/server";
import { db } from "@/lib/db";
import { matchMessages, users, profiles } from "@/db/schema";
import { eq, sql } from "drizzle-orm";
import { getSession } from "@/lib/auth";

export async function GET(req: NextRequest, { params }: { params: Promise<{ matchId: string }> }) {
  const { matchId } = await params;
  const id = parseInt(matchId);
  if (isNaN(id)) return NextResponse.json({ error: "Invalid" }, { status: 400 });

  const messages = await db
    .select({
      id: matchMessages.id,
      message: matchMessages.message,
      createdAt: matchMessages.createdAt,
      userId: matchMessages.userId,
      displayName: profiles.displayName,
      email: users.email,
    })
    .from(matchMessages)
    .innerJoin(users, eq(users.id, matchMessages.userId))
    .leftJoin(profiles, eq(profiles.userId, matchMessages.userId))
    .where(eq(matchMessages.matchId, id))
    .orderBy(matchMessages.createdAt);

  return NextResponse.json(messages);
}

export async function POST(req: NextRequest, { params }: { params: Promise<{ matchId: string }> }) {
  const { matchId } = await params;
  const id = parseInt(matchId);
  if (isNaN(id)) return NextResponse.json({ error: "Invalid" }, { status: 400 });

  const session = await getSession();
  if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const { message } = await req.json();
  if (!message?.trim()) return NextResponse.json({ error: "Empty message" }, { status: 400 });
  if (message.length > 500) return NextResponse.json({ error: "Too long" }, { status: 400 });

  await db.insert(matchMessages).values({
    matchId: id,
    userId: session.userId,
    message: message.trim(),
  });

  return NextResponse.json({ ok: true });
}
