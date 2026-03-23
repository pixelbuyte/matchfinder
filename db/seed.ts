import { drizzle } from "drizzle-orm/better-sqlite3";
import Database from "better-sqlite3";
import bcrypt from "bcryptjs";
import { users, profiles, matches, matchParticipants } from "./schema";
import path from "path";

const sqlite = new Database(path.resolve(__dirname, "../dev.db"));
sqlite.pragma("journal_mode = WAL");
const db = drizzle(sqlite);

async function main() {
  const hash = await bcrypt.hash("password123", 10);

  const [alice] = await db.insert(users).values({ email: "alice@example.com", passwordHash: hash }).returning();
  const [bob]   = await db.insert(users).values({ email: "bob@example.com",   passwordHash: hash }).returning();

  await db.insert(profiles).values([
    { userId: alice.id, displayName: "Alice", city: "London", mainSport: "soccer",     skillLevel: "intermediate" },
    { userId: bob.id,   displayName: "Bob",   city: "London", mainSport: "basketball", skillLevel: "beginner" },
  ]);

  const future1 = new Date(Date.now() + 2 * 24 * 3600 * 1000).toISOString();
  const future2 = new Date(Date.now() + 3 * 24 * 3600 * 1000).toISOString();

  const [match1] = await db.insert(matches).values({
    title: "Sunday 5-a-side", sport: "soccer", city: "London",
    location: "Hyde Park, Pitch 2", scheduledAt: future1,
    maxPlayers: 10, skillLevel: "intermediate", createdById: alice.id,
  }).returning();

  const [match2] = await db.insert(matches).values({
    title: "Evening Hoops", sport: "basketball", city: "London",
    location: "Shoreditch Park Court", scheduledAt: future2,
    maxPlayers: 8, skillLevel: "beginner", createdById: bob.id,
  }).returning();

  await db.insert(matchParticipants).values([
    { matchId: match1.id, userId: alice.id },
    { matchId: match1.id, userId: bob.id },
    { matchId: match2.id, userId: bob.id },
  ]);

  console.log("Seeded successfully!");
  console.log("  alice@example.com / password123");
  console.log("  bob@example.com   / password123");
  sqlite.close();
}

main().catch((e) => { console.error(e); sqlite.close(); process.exit(1); });
