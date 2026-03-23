import { PrismaClient } from "@prisma/client";
import { PrismaLibSql } from "@prisma/adapter-libsql";
import { createClient } from "@libsql/client";
import bcrypt from "bcryptjs";

const libsql = createClient({ url: process.env.DATABASE_URL ?? "file:dev.db" });
const adapter = new PrismaLibSql(libsql);
const prisma = new PrismaClient({ adapter } as ConstructorParameters<typeof PrismaClient>[0]);

async function main() {
  const hash = await bcrypt.hash("password123", 10);

  const alice = await prisma.user.upsert({
    where: { email: "alice@example.com" },
    update: {},
    create: {
      email: "alice@example.com",
      passwordHash: hash,
      profile: {
        create: { displayName: "Alice", city: "London", mainSport: "soccer", skillLevel: "intermediate" },
      },
    },
  });

  const bob = await prisma.user.upsert({
    where: { email: "bob@example.com" },
    update: {},
    create: {
      email: "bob@example.com",
      passwordHash: hash,
      profile: {
        create: { displayName: "Bob", city: "London", mainSport: "basketball", skillLevel: "beginner" },
      },
    },
  });

  const match1 = await prisma.match.create({
    data: {
      title: "Sunday 5-a-side",
      sport: "soccer",
      city: "London",
      location: "Hyde Park, Pitch 2",
      scheduledAt: new Date(Date.now() + 2 * 24 * 3600 * 1000),
      maxPlayers: 10,
      skillLevel: "intermediate",
      createdById: alice.id,
      participants: { create: { userId: alice.id } },
    },
  });

  await prisma.match.create({
    data: {
      title: "Evening Hoops",
      sport: "basketball",
      city: "London",
      location: "Shoreditch Park Court",
      scheduledAt: new Date(Date.now() + 3 * 24 * 3600 * 1000),
      maxPlayers: 8,
      skillLevel: "beginner",
      createdById: bob.id,
      participants: { create: { userId: bob.id } },
    },
  });

  // Bob joins Alice's match
  await prisma.matchParticipant.upsert({
    where: { matchId_userId: { matchId: match1.id, userId: bob.id } },
    update: {},
    create: { matchId: match1.id, userId: bob.id },
  });

  console.log("Seeded: alice@example.com and bob@example.com (password: password123)");
}

main().catch(console.error).finally(() => prisma.$disconnect());
