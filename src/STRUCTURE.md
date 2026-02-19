# Lexicon League — Project Structure

## Overview

```
src/
├── app/              # Next.js App Router pages
├── components/       # React components
├── context/         # React context providers
├── hooks/           # Custom React hooks
├── lib/             # Business logic & utilities
├── types/           # TypeScript types
└── middleware.ts    # Next.js middleware
```

## Lib Structure (Domain-Driven)

### `lib/game/` — Game mechanics
- **rank.ts** — Trophy tiers, scoring, tier progress
- **questions.ts** — Vocabulary & punctuation question banks
- **matchmaking.ts** — Bot opponents, seeded shuffle, match generation
- **index.ts** — Barrel export

### `lib/user/` — User profile & progress
- **storage.ts** — LocalStorage (profile, match history, personal bests)
- **levels.ts** — XP and level progression
- **profile-sync.ts** — Sync local ↔ Supabase for authenticated users
- **daily-rewards.ts** — Daily Ink Drop rewards and streaks
- **index.ts** — Barrel export

### `lib/supabase/` — Database & auth
- **client.ts** — Browser Supabase client
- **server.ts** — Server Supabase client
- **profile.ts** — Profile CRUD, leaderboard
- **avatar.ts** — Avatar config updates
- **middleware.ts** — Session refresh

### `lib/cosmetics/` — Shop & avatar
- **catalog.ts** — Cosmetic items (bases, colors, eyes, accessories, auras)

## Components

- **icons/** — SVG icon components
- **InkAvatar** — Avatar renderer
- **RankBadge** — Rank tier badge
- **GameScreen** / **ResultsScreen** — Game UI
- **ProgressBar** / **TimerRing** — UI primitives
- **ThemeToggle** — Dark/light mode

## Import Paths

Use `@/` alias for clean imports:
- `@/lib/game` or `@/lib/game/rank`
- `@/lib/user` or `@/lib/user/storage`
- `@/lib/supabase/client`
- `@/components/InkAvatar`
- `@/types`
