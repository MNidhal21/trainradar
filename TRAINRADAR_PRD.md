# TrainRadar — Product Requirements Document (PRD)

**Repo:** github.com/MNidhal21/trainradar (public)
**Status:** Locked for v1 implementation
**This document is the single source of truth.** An implementing agent must not deviate from it without flagging the conflict first.

---

## 1. Overview

TrainRadar is a live map of India showing the real-time positions of currently running trains as small "train head" markers. Clicking a train selects it, draws its route on the map, and opens a left-side panel with its details — inspired by the color and card language of the reference screenshot (dark, night-sky map; amber traveled route; light-blue projected route; glassy stat cards; pill status badge), adapted for a multi-train live map instead of a single-journey comparison view.

## 2. Goals (v1 scope)

- Show every currently active train in India as a marker on a dark-styled map of India.
- Markers update live (no manual refresh needed) via Supabase Realtime.
- Clicking a marker selects that train: draws its full route (traveled vs. remaining), opens a details panel.
- Runs 24/7 at $0 cost.
- Fully static frontend (GitHub Pages) + serverless backend (Supabase). No servers to babysit.

## 3. Non-Goals (explicitly out of scope for v1)

- PNR status lookup, fare calculator, seat availability — even though the data source supports these.
- User accounts, saved trains, notifications/alerts.
- Native mobile app.
- Historical playback of past journeys.

Do not build any of the above unless this PRD is explicitly updated.

## 4. Tech Stack (locked — do not substitute)

| Layer | Choice |
|---|---|
| Frontend framework | React + Vite + TypeScript |
| Map rendering | MapLibre GL JS (free, open-source; no Mapbox key) |
| Map tiles | Free vector tiles (e.g. OpenFreeMap) styled dark via a custom MapLibre style JSON — do not depend on a paid tile provider |
| Frontend hosting | GitHub Pages, deployed via a GitHub Actions build-on-push workflow |
| Backend / database | Supabase (Postgres + Row Level Security + Realtime + Edge Functions + pg_cron) |
| Scheduled data polling | Supabase `pg_cron` calling a Supabase Edge Function (NOT GitHub Actions `schedule:` — it is documented as best-effort and has had reliability incidents; fine only for the CI build/deploy trigger, never for the data poller) |
| Live train data source | RailRadar API (railradar.in) — unofficial third-party Indian Railways data API |

**Explicitly excluded:** AWS (any service), Vercel, Netlify, Firebase, MongoDB, or any other backend/hosting provider. If a future phase needs to change this, it must be a deliberate PRD update, not an implementation-time decision.

## 5. Data Source: RailRadar API

- Base: `https://railradar.in` developer API. Unofficial/unaffiliated with Indian Railways — this must be disclosed in the app's footer/about text.
- Key endpoints used:
  - Live snapshot of all running trains (bulk: number, current lat/lng, next station, next lat/lng, distance covered/total, bearing) — powers the map markers.
  - Per-train route geometry (GeoJSON LineString) — powers the drawn route on selection.
  - Per-train live status (delay minutes, current halt, ETA) — powers the details panel.
- **Free tier = 1,000 requests/month.** This is the binding constraint on polling frequency:
  - Bulk snapshot polled **once per hour** by default (`0 * * * *`) = ~720 requests/month, leaving ~280/month headroom for on-demand route/detail lookups.
  - Route GeoJSON per train is fetched once and **cached in Supabase** (see schema) for 24h, so repeat clicks on the same train cost zero additional RailRadar requests.
  - Cadence is a constant (`POLL_CRON_SCHEDULE`) in the Edge Function, not hardcoded logic — easy to tighten if a paid tier is added later.
- RailRadar API key is obtained by signing up at railradar.in and is stored **only** as a Supabase Edge Function secret (`RAILRADAR_API_KEY`), never in source code or `.env` files that get committed.

## 6. Supabase Project

- Project URL: `https://zfhgicixkggjdbuevjlu.supabase.co`
- Anon key (safe for client-side use, enforced by RLS below):
  `eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InpmaGdpY2l4a2dnamRidWV2amx1Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3OTA2NTY2MDcsImV4cCI6MjEwNjIzMjYwN30.Eqwlv9GQ5eCtTbM1-hYFjq34MZrHIhbOz6Y4_qneagM`
- **Service role key: DO NOT put it in this file, `.env`, or any committed code.** Set it only via:
  ```
  supabase secrets set SUPABASE_SERVICE_ROLE_KEY=<value> --project-ref zfhgicixkggjdbuevjlu
  supabase secrets set RAILRADAR_API_KEY=<value> --project-ref zfhgicixkggjdbuevjlu
  ```
  It is only ever read inside Edge Functions running on Supabase's infrastructure, never shipped to the browser.

## 7. Database Schema

```sql
-- Current snapshot of every running train (overwritten each poll cycle)
create table trains_live (
  train_number text primary key,
  train_name text,
  train_type text,              -- Rajdhani | Shatabdi | Superfast | Express | Passenger | Other
  current_lat double precision,
  current_lng double precision,
  next_station_code text,
  next_station_name text,
  next_lat double precision,
  next_lng double precision,
  distance_covered_km numeric,
  total_distance_km numeric,
  delay_minutes integer,
  bearing_degrees numeric,
  status text,                  -- RUNNING | DELAYED | ARRIVED
  last_updated_at timestamptz not null default now()
);

-- Cached route geometry per train (refresh if fetched_at > 24h old)
create table train_routes (
  train_number text primary key references trains_live(train_number) on delete cascade,
  route_geojson jsonb not null,
  fetched_at timestamptz not null default now()
);

-- Optional station lookup, populated once, refreshed rarely
create table stations (
  station_code text primary key,
  station_name text,
  lat double precision,
  lng double precision,
  zone text
);

-- Row Level Security: public gets read-only access; writes are service-role only
alter table trains_live enable row level security;
alter table train_routes enable row level security;
alter table stations enable row level security;

create policy "public read trains_live" on trains_live for select using (true);
create policy "public read train_routes" on train_routes for select using (true);
create policy "public read stations" on stations for select using (true);
-- Intentionally no insert/update/delete policy for anon/authenticated —
-- only the service role (used inside Edge Functions, bypasses RLS by design) can write.
```

Enable Realtime on `trains_live` (Supabase dashboard → Database → Replication) so the frontend can subscribe to row changes.

## 8. Backend: Supabase Edge Functions

**`poll-trains`** (scheduled)
- Triggered by `pg_cron` on `POLL_CRON_SCHEDULE` (default hourly).
- Calls RailRadar's live-snapshot endpoint using `RAILRADAR_API_KEY`.
- Upserts each train into `trains_live`; removes/marks-stale any train no longer present in the latest snapshot.

```sql
select cron.schedule(
  'poll-trains-hourly',
  '0 * * * *',
  $$ select net.http_post(
       url := 'https://zfhgicixkggjdbuevjlu.supabase.co/functions/v1/poll-trains',
       headers := jsonb_build_object('Authorization', 'Bearer ' || current_setting('app.service_role_key'))
     ); $$
);
```

**`get-train-route`** (on demand, called by frontend on click)
- Checks `train_routes` for a fresh (<24h) cached entry for the requested `train_number`.
- If missing/stale, fetches from RailRadar, caches it, returns the GeoJSON.
- This function is what keeps route-lookups cheap against the RailRadar budget.

## 9. Frontend Architecture

- `Vite + React + TypeScript`, `maplibre-gl`, `@supabase/supabase-js`.
- `.env.example` (committed) / `.env` (gitignored, never committed):
  ```
  VITE_SUPABASE_URL=https://zfhgicixkggjdbuevjlu.supabase.co
  VITE_SUPABASE_ANON_KEY=<the anon key above>
  ```
- On load: fetch current `trains_live` rows once, then open a Supabase Realtime channel subscribed to `trains_live` for live updates; interpolate marker movement client-side between updates (requestAnimationFrame) so motion looks smooth rather than jumping once an hour.
- On marker click: call `get-train-route` Edge Function, draw the route (see design system), fetch/display the train's current row for stats, open the left panel.

## 10. Design System (from reference screenshot)

**Colors**
| Token | Value | Use |
|---|---|---|
| `--bg-primary` | `#0A0F1E` | App/map background, near-black navy |
| `--map-landmass` | `#16233A` | India landmass fill |
| `--map-region-highlight` | `#2F5C55` (≈60% opacity) | States/regions the selected route passes through |
| `--route-traveled` | `#F2A64A` | Traveled portion of selected route (amber, dashed with waypoint dots) |
| `--route-remaining` | `#7FC7F0` | Remaining/projected portion of selected route (solid light blue) |
| `--marker-live` | `#FFFFFF` core, `#5AA9E6` glow | Default train head marker |
| `--accent-premium` | `#E8B84B` | Marker/badge color for Rajdhani/Shatabdi-class trains |
| `--text-primary` | `#F5F7FA` | Headings, primary text |
| `--text-muted` | `#8B96A8` | Small uppercase labels above stat numbers |
| `--card-bg` | `rgba(255,255,255,0.04)` + blur | Stat cards, panel background |
| `--card-border` | `rgba(255,255,255,0.08)` | Card/panel borders |

**Typography**
- UI text: Inter or Space Grotesk.
- Large numeric stats (distance, time, delay): a monospace face (JetBrains Mono / Space Mono) to match the reference's tech/readout feel.
- Stat labels: small, uppercase, letter-spaced, `--text-muted`.

**Components**
- Stat card: rounded-xl, `--card-bg`/`--card-border`, big mono number + unit, uppercase label above.
- Status pill: full-rounded, dark background, colored dot + bold label (`RUNNING` green, `DELAYED` amber, `ARRIVED` gray) — echoes the reference's "ARRIVED · 74H 45M" pill.
- Background: subtle scattered low-opacity dots (stars) for the night-sky mood from the reference.

## 11. Screens & Components

**Map View (default)**
- Fullscreen dark map of India, glowing train-head markers for every active train.
- Top bar: search by train number/name, filter by train type.
- No route lines shown until a train is selected (per original requirement: train head only by default).

**Selected Train View**
- Left panel (≈380px), slides in over the map, closable (X or click elsewhere).
- Header: train number + name + type badge.
- Map: draws this train's route — traveled segment in `--route-traveled`, remaining in `--route-remaining`.
- Stat cards: distance covered / total distance, delay (minutes), ETA to next station.
- Status pill (RUNNING / DELAYED / ARRIVED).
- Upcoming stops list below the stats.

## 12. Non-Functional Requirements

- $0 running cost within the free tiers described above.
- 24/7 uptime: static frontend never sleeps; data freshness maintained by Supabase `pg_cron`, which keeps the Supabase project active and avoids its 7-day-inactivity auto-pause.
- RLS enabled on every table before any table-writing code is deployed.
- No secret key ever committed to the repository, in any form, at any point.
- Desktop-first responsive layout; mobile-friendly is a stretch goal, not a v1 blocker.

## 13. Build Phases (implement in order)

- **Phase 0 — Scaffold:** Vite+React+TS app skeleton, Supabase project schema migration files, `.env.example`, `.gitignore` (must include `.env`).
- **Phase 1 — Backend core:** Create tables + RLS policies (Section 7), `poll-trains` Edge Function, `pg_cron` schedule. Verify it populates `trains_live` correctly before touching the frontend.
- **Phase 2 — Static map:** Dark MapLibre style, India-focused viewport, one-time REST fetch of `trains_live` rendered as markers (no realtime yet).
- **Phase 3 — Live updates:** Add Supabase Realtime subscription; add client-side marker interpolation between updates.
- **Phase 4 — Selection flow:** `get-train-route` Edge Function, route drawing, left details panel matching Section 10's design tokens exactly.
- **Phase 5 — Search/filter + deploy:** Search/filter bar; GitHub Actions workflow to build and publish to GitHub Pages on push to `main`.
- **Phase 6 (stretch):** Train-type color coding, mobile layout, "refresh now" affordance.

Each phase's checklist must be complete and verified against Section 12 before starting the next.

---

## 14. Agent System Prompt

Paste the following as the operating instructions for the coding agent implementing this project:

```
You are implementing the TrainRadar project. This PRD (TRAINRADAR_PRD.md) is the
single source of truth — follow it exactly.

Rules:
1. Do not deviate from the locked tech stack in Section 4. Do not introduce AWS,
   Vercel, Firebase, Netlify, MongoDB, or any service not named in this document,
   even if it seems like a convenient shortcut.
2. Work through the Build Phases (Section 13) in order. Do not start a later
   phase before the current phase's checklist is complete and verified.
3. Before any code touches a Supabase table, create the schema and RLS policies
   exactly as specified in Section 7. Every table must have RLS enabled with
   read-only public access — no exceptions, no "temporary" open write policies.
4. Never write the Supabase service role key into any file that could be
   committed — no .env files, no source code, no comments, no documentation.
   It exists only as a Supabase secret, referenced by Edge Functions at runtime.
5. Respect the RailRadar free-tier budget (Section 5). The poller must run on
   the cadence defined in this PRD (default: hourly) — do not increase polling
   frequency to "make it feel more live" without flagging the tradeoff first.
6. Match the Design System (Section 10) tokens, typography, and component
   styling exactly. Do not substitute a generic/default UI theme.
7. Do not add anything listed under Non-Goals (Section 3), even if the data
   source makes it easy to add.
8. If any requirement here is ambiguous or technically infeasible, stop and
   flag it rather than silently making a different choice.
9. Phase 0 through Phase 5 constitute a complete v1. Phase 6 is optional.
```
