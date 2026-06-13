# GuiaTur — Design Spec

**Date:** 2026-06-13
**Stack:** React Native + Expo 55 · expo-router · react-native-maps (Google) · Google Places API · json-server · Zod · react-hook-form · NativeWind

## Goal

A tourism guide mobile app for a university mobile-development class. The user opens a Google map of tourist points; while walking, the app monitors location in the foreground and automatically shows a modal with historical info when entering the radius of any point. Points come from two sources: the Google Places API (real data) and a local json-server (user-created points).

This spec covers the full app and the 5 graded requirements. It is built in 4 reviewable milestones.

## Decisions (locked)

- **Maps library:** `react-native-maps` (not `expo-maps`). Already wired in `app.json` + `src/app/content.tsx`; supports `PROVIDER_GOOGLE`, `<Marker>`, and `<Circle>` (needed to draw geofence radii).
- **Language:** UI strings in **pt-BR**; code identifiers and data fields in **English**.
- **Data model:** `db.json` keeps existing English field names (`name`, `description`, `category`, `radiusMeters`, `imageUrl`, `isActive`, `latitude`, `longitude`, `createdAt`).
- **Theme:** Keep the existing cute pinkish theme — the `rose`/`sand`/`sage`/`ink` palette and Nunito fonts in `tailwind.config.js`. All new screens/components reuse it; no restyling.
- **Build approach:** Incremental milestones with a review checkpoint after each.

## Architecture

### Navigation (expo-router) — Requirement 2

Restructure the current 2 tabs into:

```
src/app/
  _layout.tsx          # Root Stack + LocationPermissionProvider; redirect to /permissions when not granted
  permissions.tsx      # Screen 1 — permission gate, handles denial + retry
  (tabs)/
    _layout.tsx        # Bottom Tabs: Mapa · Explorar · Adicionar
    index.tsx          # Screen 2 — Mapa
    explore.tsx        # Screen 3 — Lista
    add.tsx            # Screen 5 — Cadastro
  place/[id].tsx       # Screen 4 — Detalhes (pushed over tabs, params: id + source)
```

- **Bottom Tab Navigator** (root of the granted experience): Mapa, Explorar, Adicionar.
- **Stack push** for Explorar → Detalhes, passing `id` and `source` (`google | local`) as params.
- **Permission gate:** root layout redirects to `/permissions` while foreground permission is not granted; once granted, the tabs render. Denial shows a retry path.

### The 5 screens

1. **Permissões** (`permissions.tsx`) — welcome + `requestForegroundPermissionsAsync()`. Blocks access on denial, offers retry.
2. **Mapa** (`(tabs)/index.tsx`) — Google map with markers (local vs google), translucent geofence circles, automatic `ProximityModal` on entry.
3. **Lista/Explorar** (`(tabs)/explore.tsx`) — `PointCard`s with photo, name, category, live distance, rating. Filter by source (Google / Meus pontos). Navigates to Detalhes.
4. **Detalhes** (`place/[id].tsx`) — photo, historical description, rating, hours, real-time distance, "Como chegar" (opens native Google Maps).
5. **Cadastro** (`(tabs)/add.tsx`) — 6-field form validated by Zod, POST to json-server, success/error feedback.

### Data layer — Requirement 4 (Axios, GET/POST/PUT)

- `constants/api.ts` — base URLs + Google key from `EXPO_PUBLIC_GOOGLE_MAPS_API_KEY`. json-server base URL configurable via env (defaults to localhost / emulator host).
- `services/jsonServer.ts` — Axios instance → `/places`: `GET` list, `GET /:id`, `POST`, `PUT /:id`.
- `services/placesApi.ts` — Axios instance → Google Places: `nearbysearch`, `details`, `photo`.
- `types/place.ts` — `Place` (local), `GooglePlace`, unified `MapPoint { source: 'local' | 'google'; ... }`.
- Map and List load both sources in parallel with `Promise.all`, then merge into one `MapPoint[]`.
- Loading via `ActivityIndicator`; network/error handled with a friendly `Alert` and `ErrorMessage`.

### json-server data model

| field | type | notes |
|---|---|---|
| id | string | UUID |
| name | string | min 3 |
| description | string | min 20 (historical text) |
| category | enum | museum \| monument \| park \| religious \| cultural |
| radiusMeters | number | 50–1000 geofence radius |
| imageUrl | string | valid URL |
| isActive | boolean | toggles the geofence |
| latitude | number | captured from current location |
| longitude | number | captured from current location |
| createdAt | string | ISO 8601, set client-side |

Endpoints: `GET /places`, `GET /places/:id`, `POST /places`, `PUT /places/:id`.

### Geofencing — Requirement 5 (core)

Flow per the scope:
1. Request foreground permission on the Permissões screen.
2. On map start, load points from json-server + Places API in parallel (`Promise.all`), merge.
3. `watchPositionAsync({ accuracy: High, distanceInterval: 10 })` for continuous monitoring.
4. On each update, `haversineDistance(user, point)` for every active point → meters.
5. If `distance <= point.radiusMeters` and `id` not already in a session `Set<id>`, mark triggered.
6. Show `ProximityModal` (bottom-sheet card: photo, name, distance, "Ver detalhes").

Units:
- `utils/haversine.ts` — pure function, no deps, returns meters.
- `hooks/useLocation.ts` — wraps `watchPositionAsync`, exposes current coords + status.
- `hooks/useGeofencing.ts` — takes points + user coords, computes distances, owns the triggered `Set`, returns the nearby point to surface.

### Form — Requirement 3 (6 fields + Zod)

- `schemas/placeSchema.ts` — exported Zod schema:
  - `name` `z.string().min(3)`
  - `description` `z.string().min(20)`
  - `category` `z.enum([...])`
  - `radiusMeters` `z.number().min(50).max(1000)`
  - `imageUrl` `z.string().url()`
  - `isActive` `z.boolean().default(true)`
- `react-hook-form` `useForm` + `zodResolver`; per-field error messages below each input (pinkish error color).
- Captures current GPS lat/lng at submit, sets `createdAt`, `POST`s to json-server.
- New deps: `zod`, `react-hook-form`, `@hookform/resolvers`, `@react-native-picker/picker`.

### Reusable components (build as screens need them — YAGNI)

`PointCard`, `CategoryBadge`, `ProximityModal`, `MapMarker`, `FormInput`, `LoadingOverlay`, `ErrorMessage`, `DistanceBadge`, `RatingStars`. All styled with the existing pinkish theme.

## Config fixes (done in M2)

- Convert `app.json` → `app.config.ts` so `androidGoogleMapsApiKey` actually reads `process.env.GOOGLE_MAPS_API_KEY` (today it's a literal string and never interpolates).
- Add `EXPO_PUBLIC_GOOGLE_MAPS_API_KEY` so JS-side Places Axios calls can read the key (only `EXPO_PUBLIC_`-prefixed vars reach the bundle).
- Copy `.env` into this worktree (it lives in the main repo and is gitignored, so it's absent here).
- Deduplicate the doubled Android location permissions in config.

## Milestones (checkpoint after each)

1. **M1 — Navigation skeleton.** Restructure to tabs (Mapa/Explorar/Adicionar) + `place/[id]` stack + `permissions` gate. All 5 screens render themed placeholders. Permission redirect works. *Verify: navigate end-to-end.*
2. **M2 — Data layer + config.** Env/config fixes, `constants/api`, `services/*`, `types/place`, seed `db.json`. Explore lists real points; Map shows markers + geofence circles. *Verify: list + map render live data.*
3. **M3 — Geofencing.** `haversine`, `useLocation`, `useGeofencing`, `ProximityModal`, live distances, Details screen + "Como chegar". *Verify: modal fires on radius entry; distances update.*
4. **M4 — Form.** Zod schema + RHF Add screen, POST, validation feedback, GPS capture. PUT edit if time allows. *Verify: invalid input blocks; valid input creates a point visible on map/list.*

## Requirement coverage

- **R1 UI/structure:** Expo managed + TS, componentization, themed `StyleSheet`/NativeWind. ✓
- **R2 Navigation:** 5 screens, Bottom Tabs + Stack, params (`id`, `source`). ✓
- **R3 Form:** 6 fields, RHF + Zod, per-field validation feedback. ✓
- **R4 API:** Axios for json-server (GET/POST/PUT) + Google Places (GET); loading + error handling. ✓
- **R5 Hardware:** expo-location, runtime permission flow with denial handling, `watchPositionAsync` + Haversine geofencing, session de-dup. ✓
