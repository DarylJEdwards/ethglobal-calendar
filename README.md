# World Cup 2026 — Live Group Stage

A fully live, auto-updating, country-branded view of all **12 groups (A–L)** of the
2026 FIFA World Cup — standings, the full FIFA 2026 tiebreaker chain, the
best-third-placed race, and Round-of-32 progression.

Built with **Next.js (App Router) + TypeScript + Tailwind CSS + Framer Motion**.

## Highlights

- **All 12 groups on one screen**, with rows that animate into their new order as
  results change (Framer Motion layout animations).
- **Correct standings computed in-app** from fixtures — the full FIFA 2026
  tiebreaker order (points → head-to-head → overall GD/goals → fair play → FIFA
  rank), the cross-group ranking of the 8 best third-placed teams, and a projected
  R32 bracket.
- **Live & auto-updating**: the browser polls a cached API route (fast during live
  windows, slower otherwise) and pauses while the tab is hidden.
- **Country branding**: SVG flags (`flag-icons`) and per-nation colour theming.
- **Always renders**: a pluggable data adapter falls back to a deterministic
  simulated-live engine when no API key is present or the upstream is rate-limited.

## Data source

Live data comes from **[API-Football](https://www.api-football.com/)** (api-sports.io).
The key is read **server-side only** (`API_FOOTBALL_KEY`) and never reaches the
browser. The free tier allows 100 requests/day; a shared server-side cache with a
**daily-budget governor** widens the upstream refresh interval so we stay under the
cap, while the CDN coalesces client traffic.

Without a key, the app runs entirely on a bundled 48-team dataset (the official
Final Draw) driven by a simulated live engine.

## Running locally

```bash
cp .env.local.example .env.local   # add API_FOOTBALL_KEY to go live (optional)
npm install
npm run dev                        # http://localhost:3000
npm test                           # tiebreaker / thirds / bracket unit tests
```

Set `WC_FORCE_SIMULATED=true` to demo the simulated feed even with a key present.

## Architecture

```
app/page.tsx ──► getPayload() ──► CacheManager (SWR + budget governor)
   │                                   └─► DataAdapter (API-Football | simulated)
app/api/wc/route.ts ◄── browser polls (CDN-cached) ──► useWorldCupData()
lib/standings/*  pure, unit-tested: tiebreakers, thirds, bracket
```

Configuration lives in `.env.local` — see `.env.local.example`.
