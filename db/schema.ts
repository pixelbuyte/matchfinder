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
  avatarUrl:   text("avatar_url"),
  createdAt:   text("created_at").notNull().default(sql`(strftime('%Y-%m-%dT%H:%M:%fZ', 'now'))`),
});

export const matches = sqliteTable("matches", {
  id:          integer("id").primaryKey({ autoIncrement: true }),
  title:       text("title").notNull(),
  sport:       text("sport").notNull(),
  description: text("description"),
  city:        text("city").notNull(),
  location:    text("location").notNull(),
  lat:         text("lat"),
  lng:         text("lng"),
  scheduledAt: text("scheduled_at").notNull(),  // ISO string
  maxPlayers:  integer("max_players").notNull(),
  skillLevel:  text("skill_level").notNull(),
  status:      text("status").notNull().default("open"), // open | cancelled | completed
  createdById: integer("created_by_id").notNull().references(() => users.id),
  createdAt:   text("created_at").notNull().default(sql`(strftime('%Y-%m-%dT%H:%M:%fZ', 'now'))`),
});

export const matchParticipants = sqliteTable("match_participants", {
  id:       integer("id").primaryKey({ autoIncrement: true }),
  matchId:  integer("match_id").notNull().references(() => matches.id, { onDelete: "cascade" }),
  userId:   integer("user_id").notNull().references(() => users.id, { onDelete: "cascade" }),
  joinedAt: text("joined_at").notNull().default(sql`(strftime('%Y-%m-%dT%H:%M:%fZ', 'now'))`),
}, (t) => [unique().on(t.matchId, t.userId)]);

export const matchMessages = sqliteTable("match_messages", {
  id:        integer("id").primaryKey({ autoIncrement: true }),
  matchId:   integer("match_id").notNull().references(() => matches.id, { onDelete: "cascade" }),
  userId:    integer("user_id").notNull().references(() => users.id, { onDelete: "cascade" }),
  message:   text("message").notNull(),
  createdAt: text("created_at").notNull().default(sql`(strftime('%Y-%m-%dT%H:%M:%fZ', 'now'))`),
});

export const matchRatings = sqliteTable("match_ratings", {
  id:        integer("id").primaryKey({ autoIncrement: true }),
  matchId:   integer("match_id").notNull().references(() => matches.id, { onDelete: "cascade" }),
  raterId:   integer("rater_id").notNull().references(() => users.id, { onDelete: "cascade" }),
  rateeId:   integer("ratee_id").notNull().references(() => users.id, { onDelete: "cascade" }),
  stars:     integer("stars").notNull(), // 1-5
  comment:   text("comment"),
  createdAt: text("created_at").notNull().default(sql`(strftime('%Y-%m-%dT%H:%M:%fZ', 'now'))`),
}, (t) => [unique().on(t.matchId, t.raterId, t.rateeId)]);

export const follows = sqliteTable("follows", {
  id:          integer("id").primaryKey({ autoIncrement: true }),
  followerId:  integer("follower_id").notNull().references(() => users.id, { onDelete: "cascade" }),
  followeeId:  integer("followee_id").notNull().references(() => users.id, { onDelete: "cascade" }),
  createdAt:   text("created_at").notNull().default(sql`(strftime('%Y-%m-%dT%H:%M:%fZ', 'now'))`),
}, (t) => [unique().on(t.followerId, t.followeeId)]);

// TypeScript types inferred from schema
export type User = typeof users.$inferSelect;
export type Profile = typeof profiles.$inferSelect;
export type Match = typeof matches.$inferSelect;
export type MatchParticipant = typeof matchParticipants.$inferSelect;
export type MatchMessage = typeof matchMessages.$inferSelect;
export type MatchRating = typeof matchRatings.$inferSelect;
export type Follow = typeof follows.$inferSelect;
