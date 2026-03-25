import { createClient } from "@libsql/client/http";

const client = createClient({
  url: "libsql://matchfinder-pixelbuyte.aws-us-east-1.turso.io",
  authToken: "eyJhbGciOiJFZERTQSIsInR5cCI6IkpXVCJ9.eyJhIjoicnciLCJpYXQiOjE3NzQyNDY1OTQsImlkIjoiMDE5ZDE5NTUtYjIwMS03Mjc1LWE4MzgtNDNlNzVlZWE0MDA4IiwicmlkIjoiNDcwZDdiOWItZmUxMy00ZTkyLTk0OTUtMGZjZjlkNDIwNTNjIn0.yqoAktJYdaAoPVB-VqASCNqigiQfOqZZIC5ebRow35QfkXSSnzN8iCE1W4SrbckFpg54MlhSqAbwOb2jIPvbAw",
});

const statements = [
  `CREATE TABLE IF NOT EXISTS users (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    email TEXT NOT NULL UNIQUE,
    password_hash TEXT NOT NULL,
    created_at TEXT NOT NULL DEFAULT (strftime('%Y-%m-%dT%H:%M:%fZ', 'now'))
  )`,
  `CREATE TABLE IF NOT EXISTS profiles (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    user_id INTEGER NOT NULL UNIQUE REFERENCES users(id) ON DELETE CASCADE,
    display_name TEXT NOT NULL,
    city TEXT NOT NULL,
    main_sport TEXT NOT NULL,
    skill_level TEXT NOT NULL,
    bio TEXT,
    created_at TEXT NOT NULL DEFAULT (strftime('%Y-%m-%dT%H:%M:%fZ', 'now'))
  )`,
  `CREATE TABLE IF NOT EXISTS matches (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    title TEXT NOT NULL,
    sport TEXT NOT NULL,
    description TEXT,
    city TEXT NOT NULL,
    location TEXT NOT NULL,
    scheduled_at TEXT NOT NULL,
    max_players INTEGER NOT NULL,
    skill_level TEXT NOT NULL,
    status TEXT NOT NULL DEFAULT 'open',
    created_by_id INTEGER NOT NULL REFERENCES users(id),
    created_at TEXT NOT NULL DEFAULT (strftime('%Y-%m-%dT%H:%M:%fZ', 'now'))
  )`,
  `CREATE TABLE IF NOT EXISTS match_participants (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    match_id INTEGER NOT NULL REFERENCES matches(id) ON DELETE CASCADE,
    user_id INTEGER NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    joined_at TEXT NOT NULL DEFAULT (strftime('%Y-%m-%dT%H:%M:%fZ', 'now')),
    UNIQUE(match_id, user_id)
  )`,
  `CREATE TABLE IF NOT EXISTS match_messages (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    match_id INTEGER NOT NULL REFERENCES matches(id) ON DELETE CASCADE,
    user_id INTEGER NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    message TEXT NOT NULL,
    created_at TEXT NOT NULL DEFAULT (strftime('%Y-%m-%dT%H:%M:%fZ', 'now'))
  )`,
];

for (const sql of statements) {
  await client.execute(sql);
  console.log("✓", sql.split("\n")[0].trim());
}

console.log("\nTurso database tables created successfully!");
