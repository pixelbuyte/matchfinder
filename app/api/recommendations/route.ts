import { NextResponse } from "next/server";
import { requireAuth } from "@/lib/auth";
import { getRecommendations } from "@/lib/recommendations";

export async function GET() {
  const user = await requireAuth();
  if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const recs = await getRecommendations(user.id);
  return NextResponse.json(recs);
}
