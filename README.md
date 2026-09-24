# Persian UX Map

**Persian designers around the world.** · نقشه طراحان فارسی‌زبان در سراسر جهان

A map-first, working front-end demo for discovering Persian-speaking UI, UX and Product designers by where they live. The map is the product. It is not a feed or a grid of profile cards.

```bash
npm install
npm run dev      # http://localhost:5173
npm run build    # type-check + production build (dist/)
```

The demo needs no API keys and no network access. The world map comes from bundled Natural Earth data (`world-atlas`), and all designers are local mock data.

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
| **فارسی** | The language switch turns the whole UI into native RTL: mirrored layout and drawers, Vazirmatn type, Persian numerals and Solar Hijri dates. |

Resize the window below 768px, or open the site on a phone, to get the mobile layout. It has a search bar at the top, a filter bottom sheet, a bottom dock with **Add yourself** always visible, and touch-sized avatars and clusters.

## Privacy model

- Only **city, country and the approximate city centre** are stored. The app never asks for a street address or GPS position.
- On the map, people appear at *decorative* positions around the city centre: a jittered sunflower pattern that is deterministic per person and never reflects where they actually live (`src/map/layout.ts`).
- A profile stays **hidden until the email is confirmed**. Users can hide their profile at any time.

## How it's built

- **React 19 + TypeScript + Vite**, **Tailwind CSS v4**, **MapLibre GL**, **Lucide** icons, **Zustand** for state.
- `src/map/MapView.tsx`: MapLibre with a local style (country fills and borders only). Countries that have designers are slightly lighter, and filtered countries get a teal tint.
- `src/map/MarkerLayer.tsx`: an HTML overlay layer that does its own clustering:
  - **Screen-space merge** of nearby city clusters, so pills never overlap.
  - **Per-city split progress** based on how many pixels the city's display area covers at the current zoom. Small cities open earlier than dense ones, and avatars flow out from the centre as you zoom in. The per-frame positions are written straight to the DOM, so React only re-renders when the cluster structure changes.
- `src/data/`: role and skill taxonomies (skills come from a fixed list, never free text), about 230 world cities with Persian names for the autocomplete, and a seeded generator for about 236 realistic demo designers across 45 cities.
- `src/lib/i18n.ts`: complete English and Persian dictionaries.
- Your own account, visibility and reports are saved in `localStorage`. Use "Delete profile" or "Sign out" in My profile to reset.

## Design notes

- Dark by default: a near-black canvas, subtle borders and one restrained accent colour (Persian turquoise, فیروزه‌ای) with a faint glow on avatars and clusters.
- Temporary brand mark: an eight-pointed *khatam* star that doubles as a compass or map pin, with a location dot in the centre.
- The floating UI sits in layers over the map. Map controls move aside when a drawer opens, so they never cover it.
