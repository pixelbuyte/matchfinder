export const SPORTS = [
  "soccer",
  "basketball",
  "padel",
  "tennis",
  "running",
  "cycling",
  "volleyball",
  "badminton",
  "squash",
  "table tennis",
  "other",
] as const;

export type Sport = (typeof SPORTS)[number];

export const SKILLS = ["beginner", "intermediate", "advanced"] as const;

export type SkillLevel = (typeof SKILLS)[number];

export const SPORT_COLORS: Record<string, string> = {
  soccer: "bg-green-100 text-green-800",
  basketball: "bg-orange-100 text-orange-800",
  padel: "bg-blue-100 text-blue-800",
  tennis: "bg-yellow-100 text-yellow-800",
  running: "bg-purple-100 text-purple-800",
  cycling: "bg-teal-100 text-teal-800",
  volleyball: "bg-pink-100 text-pink-800",
  badminton: "bg-lime-100 text-lime-800",
  squash: "bg-amber-100 text-amber-800",
  "table tennis": "bg-cyan-100 text-cyan-800",
  other: "bg-gray-100 text-gray-800",
};

export const MATCH_STATUSES = ["open", "completed", "cancelled"] as const;
export type MatchStatus = (typeof MATCH_STATUSES)[number];
