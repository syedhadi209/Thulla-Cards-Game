# Thulla — Multiplayer Card Game

Friends-only real-time Thulla (Getaway) built with Next.js and Supabase (free tier).

## Stack

- Next.js (App Router) + TypeScript + Tailwind CSS
- Supabase Auth (email + password), Postgres, Realtime
- Next.js API routes for shuffle / deal / move validation
- Zod + Vitest

## Setup (free)

1. Create a [Supabase](https://supabase.com) project (free).
2. **Authentication → Providers → Email** → enable (Email provider is usually on by default).
3. For local friends play, turn **off** “Confirm email” under **Authentication → Providers → Email** (otherwise signup waits for a confirmation link).
4. You can disable **Anonymous** under Providers — this app no longer uses it.
5. **Project Settings → API** → copy URL, anon key, and service role key into `.env.local`.
6. **Project Settings → Database** → copy the database password into `.env.local` as `SUPABASE_DB_PASSWORD`.

```bash
cp .env.local.example .env.local
# fill in keys + SUPABASE_DB_PASSWORD
npm install
npm run db:migrate
npm run dev
```

(Alternatively, paste the migration SQL in the Supabase SQL Editor.)

Open [http://localhost:3000](http://localhost:3000). Sign up, then create or join a game.

### Routes

| Path | Access |
| --- | --- |
| `/`, `/login`, `/signup` | Public |
| `/create`, `/join`, `/game/[id]` | Requires signed-in session (enforced in `src/proxy.ts`) |

## Scripts

| Script | Purpose |
| --- | --- |
| `npm run dev` | Next.js dev server |
| `npm run build` | Production build |
| `npm run lint` | ESLint |
| `npm test` | Vitest (deck + engine) |
| `npm run typecheck` | `tsc --noEmit` |

## Rules

See [THULLA_RULES.md](./THULLA_RULES.md).

## Notes

- Game mutations go through `/api/game/*` (service role).
- Clients subscribe to `games`, `players`, and their own `hands` row.
- Hands are owner-only via RLS so friends don’t spoil each other’s cards.
- Auth session cookies are refreshed in Next.js Proxy (`src/proxy.ts`).
- No Firebase / paid Blaze plan required.
