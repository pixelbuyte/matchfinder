import { sqliteTable, text, integer, unique } from "drizzle-orm/sqlite-core";
import { sql } from "drizzle-orm";

export const users = sqliteTable("users", {
  id:           integer("id").primaryKey({ autoIncrement: true }),
  email:        text("email").notNull().unique(),
  passwordHash: text("password_hash").notNull(),
  createdAt:    text("created_at").notNull().default(sql`(strftime('%Y-%m-%dT%H:%M:%fZ', 'now'))`),
});

export const profiles = sqliteTable("profiles", {
  id:          integer("id").primaryKey({ autoIncrement: true }),
  userId:      integer("user_id").notNull().unique().references(() => users.id, { onDelete: "cascade" }),
  displayName: text("display_name").notNull(),
  city:        text("city").notNull(),
  mainSport:   text("main_sport").notNull(),
  skillLevel:  text("skill_level").notNull(),
  bio:         text("bio"),
  createdAt:   text("created_at").notNull().default(sql`(strftime('%Y-%m-%dT%H:%M:%fZ', 'now'))`),
});

export const matches = sqliteTable("matches", {
  id:          integer("id").primaryKey({ autoIncrement: true }),
  title:       text("title").notNull(),
  sport:       text("sport").notNull(),
  description: text("description"),
  city:        text("city").notNull(),
  location:    text("location").notNull(),
  scheduledAt: text("scheduled_at").notNull(),  // ISO string
  maxPlayers:  integer("max_players").notNull(),
  skillLevel:  text("skill_level").notNull(),
  status:      text("status").notNull().default("open"),
  createdById: integer("created_by_id").notNull().references(() => users.id),
  createdAt:   text("created_at").notNull().default(sql`(strftime('%Y-%m-%dT%H:%M:%fZ', 'now'))`),
});

export const matchParticipants = sqliteTable("match_participants", {
  id:       integer("id").primaryKey({ autoIncrement: true }),
  matchId:  integer("match_id").notNull().references(() => matches.id, { onDelete: "cascade" }),
  userId:   integer("user_id").notNull().references(() => users.id, { onDelete: "cascade" }),
  joinedAt: text("joined_at").notNull().default(sql`(strftime('%Y-%m-%dT%H:%M:%fZ', 'now'))`),
}, (t) => [unique().on(t.matchId, t.userId)]);

// TypeScript types inferred from schema
export type User = typeof users.$inferSelect;
export type Profile = typeof profiles.$inferSelect;
export type Match = typeof matches.$inferSelect;
export type MatchParticipant = typeof matchParticipants.$inferSelect;
