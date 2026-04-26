# MatchFinder

A Next.js web app for finding and creating local sports matches. Browse open games near you, join up, chat with teammates, and rate each other after the match.

## Tech Stack

| Layer | Technology |
|---|---|
| Framework | Next.js 14 (App Router) |
| Language | TypeScript |
| Database | SQLite via Drizzle ORM (local) / Turso (production) |
| Auth | Custom cookie sessions (`iron-session` / bcrypt) |
| Styling | Tailwind CSS |
| Email | Resend |

## Features

- **Browse & filter matches** by city, sport, skill level, and date (paginated)
- **Create matches** with venue finder powered by OpenStreetMap
- **Join / leave** matches with email confirmations
- **Match chat** — real-time polling chat on every match page
- **Mark complete** — creator can close a match after it finishes
- **Cancel with notifications** — cancelling emails all participants
- **Rate teammates** — 1–5 star ratings with optional comments after a match ends
- **Player profiles** — public profile page with stats, rating average, match history
- **Follow players** — follow/unfollow other members
- **My Matches** — see all matches you've created or joined
- **Edit match** — update details before the match starts
- **Smart recommendations** — dashboard shows matches scored by city, sport, and skill level

## Getting Started

### Prerequisites

- Node.js 18+
- npm

### Local Setup

```bash
git clone https://github.com/pixelbuyte/matchfinder
cd matchfinder
npm install
```

Create a `.env.local` file:

```env
# Required for email (optional in dev — emails are skipped when absent)
RESEND_API_KEY=re_...

# Required for production Turso DB (omit to use local SQLite in dev)
TURSO_DATABASE_URL=libsql://...
TURSO_AUTH_TOKEN=...

# Used in email links
NEXT_PUBLIC_URL=http://localhost:3000
```

### Database

Push the schema and optionally seed test data:

```bash
npm run db:push   # creates/migrates the SQLite database
npm run db:seed   # seeds Alice + Bob with sample matches
```

### Run

```bash
npm run dev
```

Open [http://localhost:3000](http://localhost:3000).

## Project Structure

```
matchfinder/
├── app/
│   ├── api/
│   │   ├── chat/[matchId]/         # GET/POST chat messages
│   │   └── recommendations/        # GET recommended matches
│   ├── auth/
│   │   ├── login/                  # Login page + action
│   │   ├── register/               # Register page + action
│   │   └── onboarding/             # Profile setup
│   ├── dashboard/
│   │   ├── page.tsx                # Dashboard with stats + recommendations
│   │   ├── my-matches/             # All matches created/joined
│   │   └── matches/
│   │       ├── create/             # Create match form
│   │       └── [id]/edit/          # Edit match form
│   ├── matches/
│   │   ├── page.tsx                # Browse + filter matches (paginated)
│   │   └── [id]/
│   │       ├── page.tsx            # Match detail, chat, ratings, join/leave
│   │       └── actions.ts          # join, leave, cancel, markComplete, submitRating
│   └── profile/
│       └── [userId]/               # Public player profile + follow
├── components/
│   ├── Navbar.tsx                  # Auth-aware navigation
│   ├── MatchCard.tsx               # Match summary card
│   ├── MatchChat.tsx               # Polling chat component
│   ├── NearMeButton.tsx            # Geolocation → city name
│   └── VenueFinder.tsx             # OpenStreetMap venue search
├── db/
│   ├── schema.ts                   # Drizzle schema (users, profiles, matches, …)
│   └── seed.ts                     # Dev seed data
└── lib/
    ├── auth.ts                     # Session helpers, requireAuth
    ├── constants.ts                # SPORTS, SKILLS, SPORT_COLORS
    ├── db.ts                       # DB connection (SQLite or Turso)
    ├── email.ts                    # Resend email templates
    ├── follows.ts                  # Follow/unfollow logic
    ├── matches.ts                  # Match queries + pagination
    ├── ratings.ts                  # Rating queries
    └── recommendations.ts          # Scoring algorithm
```

## Database Schema

```
users             id, email, passwordHash, createdAt
profiles          id, userId, displayName, city, mainSport, skillLevel, bio, avatarUrl
matches           id, title, sport, description, city, location, lat, lng,
                  scheduledAt, maxPlayers, skillLevel, status, createdById
matchParticipants id, matchId, userId, joinedAt
matchMessages     id, matchId, userId, message, createdAt
matchRatings      id, matchId, raterId, rateeId, stars (1-5), comment, createdAt
follows           id, followerId, followeeId, createdAt
```

## Deployment

### Turso (Production DB)

1. Create a Turso database: `turso db create matchfinder`
2. Get the URL and token: `turso db show matchfinder` / `turso db tokens create matchfinder`
3. Set `TURSO_DATABASE_URL` and `TURSO_AUTH_TOKEN` in your hosting environment
4. Run `npm run db:push` against the Turso URL

### Vercel

```bash
vercel --prod
```

Set all env vars in the Vercel dashboard.

## Scripts

| Script | Description |
|---|---|
| `npm run dev` | Start development server |
| `npm run build` | Production build |
| `npm run start` | Start production server |
| `npm run db:push` | Push schema changes to database |
| `npm run db:seed` | Seed database with test data |
