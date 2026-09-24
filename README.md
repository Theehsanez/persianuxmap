# Persian UX Map

**Persian designers around the world.** · نقشه طراحان فارسی‌زبان در سراسر جهان

A map-first, working front-end demo for discovering Persian-speaking UI, UX and Product designers by where they live. The map is the product. It is not a feed or a grid of profile cards.

```bash
npm install
npm run dev      # http://localhost:5173  — app + API, SQLite at ./data/persianuxmap.db
npm run build    # type-check + production build
npm start        # production Node server (http://localhost:3000)
```

On first start the database is created, migrated and seeded with ~236 demo designers. No API keys are needed.

## Stack

| Layer | |
|---|---|
| Framework | **TanStack Start** (React 19, file routes in `src/routes`) |
| API | **oRPC**, contract-first: `src/api/contract.ts` (zod) |
| Server | `src/server/router.ts` implements the contract, served at `/api/rpc/*` (`src/routes/api/rpc.$.ts`) |
| Database | **Drizzle ORM + SQLite** (better-sqlite3). Schema `src/server/db/schema.ts`, migrations in `drizzle/` |
| UI | Tailwind CSS v4, MapLibre GL, Lucide, Zustand |

**Data model:** `users`, `profiles` (location is only a city id + country code), `sessions` (bearer tokens), `email_codes` (6-digit, 10 min, 5 attempts), `reports`.

**Schema changes:** edit `schema.ts`, then run `npm run db:generate`. Migrations run automatically on server start. Use `npm run db:studio` to browse the data.

**Environment variables:**

| Variable | Default | |
|---|---|---|
| `DATABASE_URL` | `./data/persianuxmap.db` | SQLite file path |
| `MIGRATIONS_DIR` | `./drizzle` | |
| `EXPOSE_EMAIL_CODES` | `true` | No mail provider is wired up yet, so the API returns the code and the "demo inbox" shows it. Set this to `false` once real email is sending. |
| `PORT` | `3000` | used by `npm start` |

**Not real yet:** "Continue with Google" is simulated (real OAuth needs client credentials), and email codes are not actually emailed yet (see `EXPOSE_EMAIL_CODES`).

### Static demo (GitHub Pages)

GitHub Pages can't run a server. `npm run build:pages` (`VITE_STATIC_DEMO=1`) builds a static SPA in which `src/api/local.ts` implements **the same oRPC contract in the browser**: demo designers are generated locally and your account lives in `localStorage`. The UI only talks to the contract, so it works the same in both modes. `.github/workflows/pages.yml` deploys this on every push.

For the real backend, deploy the Node server (`npm run build && npm start`) to any host with a persistent disk for the SQLite file, such as a VPS, Fly.io or Railway.

## Things to try

| | |
|---|---|
| **Explore the map** | Drag to pan and scroll or pinch to zoom. At world zoom, designers are grouped into city clusters. Nearby cities merge (for example "Berlin +10"). |
| **Open a city** | Click a cluster. The map flies to the city, and the cluster opens into individual avatars that spread out around the city centre. |
| **Open a profile** | Click an avatar. On desktop the profile opens in a drawer on the right (on the left in RTL). On mobile it opens in a bottom sheet you can drag. |
| **Search** | Search by name, city, country, skill or role. Press ⌘K or `/` to focus it. Use the arrow keys and Enter to pick a result, or choose "Filter map by …" to filter the map by that text. |
| **Filter** | Filter by Role, Skills, Country and City, all at once. Skills are combined with AND. Example: Product Designer + Figma + Design Systems + Germany. The map updates live and the matching countries are highlighted. |
| **Explore panel** | Stats, trending cities, popular skills, recently joined designers and top countries. |
| **Add yourself** | 6 steps: account (Google or email) → basics, with a city autocomplete and map preview → 3–8 skills → links (LinkedIn or Portfolio is required) → email code (the code appears in the "demo inbox") → exact profile preview → **Join the map**. |
| **My profile** | Edit every field, change city (you move on the map), hide yourself from the map, request community verification, or delete your profile. |
| **Report profile** | Every public profile has a "Report profile" option. |
| **English / فارسی** | Persian is the default. The language switch turns the whole UI into native RTL: mirrored layout and drawers, Vazirmatn type, Persian numerals and Solar Hijri dates. |

Resize the window below 768px, or open the site on a phone, to get the mobile layout. It has a search bar at the top, a filter bottom sheet, a bottom dock with **Add yourself** always visible, and touch-sized avatars and clusters.

## Privacy model

- Only **city, country and the approximate city centre** are stored. The app never asks for a street address or GPS position.
- On the map, people appear at *decorative* positions around the city centre: a jittered sunflower pattern that is deterministic per person and never reflects where they actually live (`src/map/layout.ts`).
- A profile stays **hidden until the email is confirmed**. Users can hide their profile at any time.

## How it's built

- `src/map/MapView.tsx`: MapLibre over bundled Natural Earth country shapes, plus street-level detail (water, roads, place names in English or Persian) from OpenFreeMap / OpenStreetMap. The map repeats endlessly to the left and right.
- `src/map/NeuralLayer.tsx`: a canvas under the markers that connects people inside each city (nearest neighbours) and connects cities to each other, with small signals travelling along the lines.
- `src/map/MarkerLayer.tsx`: an HTML overlay layer that does its own clustering:
  - **Screen-space merge** of nearby city clusters, so bubbles never overlap.
  - **Per-city split progress** based on how many pixels the city's display area covers at the current zoom. Small cities open earlier than dense ones, and avatars flow out from the centre as you zoom in. The per-frame positions are written straight to the DOM, so React only re-renders when the cluster structure changes.
- `src/data/`: role and skill taxonomies (skills come from a fixed list, never free text), about 230 world cities with Persian names for the autocomplete, and a seeded generator for about 236 realistic demo designers across 45 cities.
- `src/lib/i18n.ts`: complete English and Persian dictionaries.
- Accounts, profiles and reports are stored in SQLite. The browser only keeps the session token.

## Design notes

- Dark and minimal: a near-black canvas, subtle borders and white as the only accent colour, with no glows.
- Temporary brand mark: an eight-pointed *khatam* star that doubles as a compass or map pin, with a location dot in the centre.
- The floating UI sits in layers over the map. Map controls move aside when a drawer opens, so they never cover it.
