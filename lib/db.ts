import * as schema from "@/db/schema";

// Use Turso in production, local SQLite in development
function createDb() {
  if (process.env.TURSO_DATABASE_URL && process.env.TURSO_AUTH_TOKEN) {
    // Production: Turso (HTTP-based, no native binary needed)
    const { drizzle } = require("drizzle-orm/libsql");
    const { createClient } = require("@libsql/client");
    const client = createClient({
      url: process.env.TURSO_DATABASE_URL,
      authToken: process.env.TURSO_AUTH_TOKEN,
    });
    return drizzle(client, { schema });
  } else {
    // Local dev: better-sqlite3
    const { drizzle } = require("drizzle-orm/better-sqlite3");
    const Database = require("better-sqlite3");
    const path = require("path");
    const dbPath = path.resolve(process.cwd(), "dev.db");
    const sqlite = new Database(dbPath);
    sqlite.pragma("journal_mode = WAL");
    return drizzle(sqlite, { schema });
  }
}

const globalForDb = globalThis as unknown as { db: ReturnType<typeof createDb> };
export const db = globalForDb.db ?? createDb();
if (process.env.NODE_ENV !== "production") globalForDb.db = db;
