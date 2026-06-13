# GuiaTur M2 — Data Layer + Map/List Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Wire the app to real data: an Axios-backed json-server service, shared types, a seeded `db.json`, the Expo config/env fix, and turn the Mapa and Explorar placeholder screens into a live map (markers + geofence circles) and a live list (cards).

**Architecture:** A thin Axios service (`services/jsonServer.ts`) reads `/places` from a local json-server. A shared `types/place.ts` defines the `Place` record and a unified `MapPoint` used by both screens. Screens fetch on mount, show loading/error states, and render. Geofence circles are drawn from each point's `radiusMeters`. The Expo config moves to `app.config.ts` so the Google Maps key comes from the environment.

**Tech Stack:** Expo 55, expo-router, react-native-maps (Google provider — works in Expo Go), expo-image, axios, json-server v1, NativeWind (existing pink theme).

**Scope note:** The live **Google Places API** source is intentionally deferred to **M3**, where it merges with json-server data alongside the geofencing/distance work. M2 delivers a working map + list from json-server (local) data only.

**Testing note:** Like M1, this milestone is integration/UI over a thin data layer and the repo still has no test runner. It is verified by `tsc --noEmit`, `expo lint`, `expo config` (for the config task), and a manual smoke test. Automated unit tests begin in M3 (Haversine pure function), where `jest-expo` gets set up.

**Git note:** Run all git commands in the terminal (PowerShell). Commit messages must NOT include any Co-Authored-By / Claude attribution.

---

## File Structure (end state of M2)

```
app.config.ts              # CREATE: dynamic config; injects GOOGLE_MAPS_API_KEY from env
app.json                   # MODIFY: dedupe android location permissions
db.json                    # MODIFY: seed 5 tourist points
package.json               # MODIFY: add axios dep + "server" script
.env.example               # CREATE: documents env vars (committed)
.env                       # CREATE (gitignored): copied from main repo + notes
src/
  types/place.ts           # CREATE: Place, PlaceCategory, MapPoint, helpers
  constants/api.ts         # CREATE: JSON_SERVER_URL (env-aware)
  constants/theme.ts       # CREATE: shared nav/map color palette
  services/jsonServer.ts   # CREATE: axios CRUD for /places
  components/
    CategoryBadge.tsx      # CREATE
    PointCard.tsx          # CREATE
    LoadingOverlay.tsx     # CREATE
    ErrorMessage.tsx       # CREATE
  app/
    _layout.tsx            # MODIFY: use theme COLORS (DRY the hardcoded hex)
    (tabs)/_layout.tsx     # MODIFY: use theme COLORS
    (tabs)/index.tsx       # MODIFY: live map (markers + circles)
    (tabs)/explore.tsx     # MODIFY: live list
```

---

## Task 1: Dependencies, server script, and seed data

**Files:**
- Modify: `package.json`
- Modify: `db.json`

- [ ] **Step 1: Install axios**

In the terminal (PowerShell), from the worktree root:

```powershell
npx expo install axios
```

Expected: `axios` is added to `dependencies` in `package.json`.

- [ ] **Step 2: Add the json-server script**

In `package.json`, add a `server` script to the `scripts` object (json-server v1 watches by default; there is no `--watch` flag):

```json
"server": "json-server --host 0.0.0.0 --port 3001 db.json"
```

The `scripts` block should end up like:

```json
  "scripts": {
    "start": "expo start",
    "reset-project": "node ./scripts/reset-project.js",
    "android": "expo start --android",
    "ios": "expo start --ios",
    "web": "expo start --web",
    "lint": "expo lint",
    "server": "json-server --host 0.0.0.0 --port 3001 db.json"
  },
```

- [ ] **Step 3: Seed db.json**

Replace the entire contents of `db.json` with 5 tourist points (English field names, around Criciúma/SC). Keep the existing museum as the first entry:

```json
{
  "places": [
    {
      "id": "550e8400-e29b-41d4-a716-446655440000",
      "name": "Museu Histórico Municipal",
      "description": "Museu dedicado à preservação da história local, contendo documentos, fotografias e exposições permanentes sobre a região.",
      "category": "museum",
      "radiusMeters": 200,
      "imageUrl": "https://picsum.photos/seed/guiatur-museu/400/300",
      "isActive": true,
      "latitude": -28.6775,
      "longitude": -49.3697,
      "createdAt": "2026-06-01T10:30:00.000Z"
    },
    {
      "id": "7b2d1f64-2c3a-4e5b-9f10-1a2b3c4d5e6f",
      "name": "Catedral São José",
      "description": "Principal templo católico da cidade, com arquitetura imponente e vitrais que marcam o centro histórico e recebem visitantes durante todo o ano.",
      "category": "religious",
      "radiusMeters": 150,
      "imageUrl": "https://picsum.photos/seed/guiatur-catedral/400/300",
      "isActive": true,
      "latitude": -28.6772,
      "longitude": -49.3705,
      "createdAt": "2026-06-02T09:00:00.000Z"
    },
    {
      "id": "9c3e2a75-3d4b-4f6c-8a21-2b3c4d5e6f70",
      "name": "Praça Nereu Ramos",
      "description": "Praça central arborizada, ponto de encontro tradicional da população, cercada por cafés, bancos e eventos culturais ao ar livre.",
      "category": "park",
      "radiusMeters": 250,
      "imageUrl": "https://picsum.photos/seed/guiatur-praca/400/300",
      "isActive": true,
      "latitude": -28.6759,
      "longitude": -49.3692,
      "createdAt": "2026-06-03T14:20:00.000Z"
    },
    {
      "id": "a1f4b386-4e5c-4071-9b32-3c4d5e6f7081",
      "name": "Monumento ao Imigrante",
      "description": "Monumento que homenageia os imigrantes italianos e poloneses que colonizaram a região, símbolo da identidade cultural local.",
      "category": "monument",
      "radiusMeters": 100,
      "imageUrl": "https://picsum.photos/seed/guiatur-monumento/400/300",
      "isActive": true,
      "latitude": -28.6801,
      "longitude": -49.3720,
      "createdAt": "2026-06-04T11:45:00.000Z"
    },
    {
      "id": "b2059497-5f6d-4182-8c43-4d5e6f708192",
      "name": "Casa da Cultura",
      "description": "Centro cultural que abriga exposições de arte, apresentações teatrais e oficinas, promovendo a produção artística da comunidade local.",
      "category": "cultural",
      "radiusMeters": 180,
      "imageUrl": "https://picsum.photos/seed/guiatur-cultura/400/300",
      "isActive": true,
      "latitude": -28.6745,
      "longitude": -49.3738,
      "createdAt": "2026-06-05T16:10:00.000Z"
    }
  ]
}
```

- [ ] **Step 4: Verify json-server serves the data**

In the terminal, start the server and query it:

```powershell
Start-Process -NoNewWindow powershell -ArgumentList '-Command','npm run server'
Start-Sleep -Seconds 2
(Invoke-RestMethod http://localhost:3001/places).Count
```

Expected: prints `5`. Then stop the background server:

```powershell
Get-Process node -ErrorAction SilentlyContinue | Where-Object { $_.Path } | Stop-Process -Force -ErrorAction SilentlyContinue
```

(If stopping all node processes is undesirable in your environment, instead close the spawned window manually. The query returning `5` is the goal.)

- [ ] **Step 5: Commit**

```powershell
git add package.json package-lock.json db.json
git commit -m "Add axios, json-server script, and seed tourist points"
```

---

## Task 2: Shared types and API constants

**Files:**
- Create: `src/types/place.ts`
- Create: `src/constants/api.ts`

- [ ] **Step 1: Create the types module**

Create `src/types/place.ts`:

```ts
export const PLACE_CATEGORIES = ['museum', 'monument', 'park', 'religious', 'cultural'] as const

export type PlaceCategory = (typeof PLACE_CATEGORIES)[number]

export const CATEGORY_LABELS: Record<PlaceCategory, string> = {
  museum: 'Museu',
  monument: 'Monumento',
  park: 'Parque',
  religious: 'Religioso',
  cultural: 'Cultural',
}

/** A point stored in json-server (created by the user). */
export type Place = {
  id: string
  name: string
  description: string
  category: PlaceCategory
  radiusMeters: number
  imageUrl: string
  isActive: boolean
  latitude: number
  longitude: number
  createdAt: string
}

export type PlaceSource = 'local' | 'google'

/** Unified shape consumed by the map and list, regardless of source. */
export type MapPoint = {
  id: string
  source: PlaceSource
  name: string
  category: PlaceCategory | null
  imageUrl: string | null
  latitude: number
  longitude: number
  radiusMeters: number
  isActive: boolean
}

export function placeToMapPoint(place: Place): MapPoint {
  return {
    id: place.id,
    source: 'local',
    name: place.name,
    category: place.category,
    imageUrl: place.imageUrl,
    latitude: place.latitude,
    longitude: place.longitude,
    radiusMeters: place.radiusMeters,
    isActive: place.isActive,
  }
}
```

- [ ] **Step 2: Create the API constants module**

Create `src/constants/api.ts`:

```ts
import { Platform } from 'react-native'

// Base URL of the local json-server.
// Override with EXPO_PUBLIC_API_URL (e.g. http://192.168.0.10:3001 for a physical device).
// Defaults: the Android emulator reaches the host machine at 10.0.2.2; iOS sim / web use localhost.
const DEFAULT_JSON_SERVER_URL = Platform.select({
  android: 'http://10.0.2.2:3001',
  default: 'http://localhost:3001',
})

export const JSON_SERVER_URL = process.env.EXPO_PUBLIC_API_URL ?? DEFAULT_JSON_SERVER_URL
```

- [ ] **Step 3: Typecheck and lint**

```powershell
npx tsc --noEmit
npm run lint
```

Expected: both pass with no errors.

- [ ] **Step 4: Commit**

```powershell
git add src/types/place.ts src/constants/api.ts
git commit -m "Add Place types and json-server URL constant"
```

---

## Task 3: json-server Axios service

**Files:**
- Create: `src/services/jsonServer.ts`

- [ ] **Step 1: Create the service**

Create `src/services/jsonServer.ts`:

```ts
import axios from 'axios'

import { JSON_SERVER_URL } from '@/constants/api'
import type { Place } from '@/types/place'

const api = axios.create({
  baseURL: JSON_SERVER_URL,
  timeout: 8000,
})

/** Fields the client sends when creating/updating a place (server assigns `id`). */
export type PlaceInput = Omit<Place, 'id'>

export async function fetchPlaces(): Promise<Place[]> {
  const { data } = await api.get<Place[]>('/places')
  return data
}

export async function fetchPlace(id: string): Promise<Place> {
  const { data } = await api.get<Place>(`/places/${id}`)
  return data
}

export async function createPlace(input: PlaceInput): Promise<Place> {
  const { data } = await api.post<Place>('/places', input)
  return data
}

export async function updatePlace(id: string, input: PlaceInput): Promise<Place> {
  const { data } = await api.put<Place>(`/places/${id}`, input)
  return data
}
```

- [ ] **Step 2: Typecheck and lint**

```powershell
npx tsc --noEmit
npm run lint
```

Expected: both pass. (`fetchPlace`, `createPlace`, `updatePlace` are unused until M3/M4 — that's expected; exported functions are not flagged by the linter.)

- [ ] **Step 3: Commit**

```powershell
git add src/services/jsonServer.ts
git commit -m "Add json-server Axios service for places CRUD"
```

---

## Task 4: Expo config fix and environment files

**Files:**
- Create: `app.config.ts`
- Modify: `app.json`
- Create: `.env.example`
- Create: `.env` (gitignored — will not be committed)

- [ ] **Step 1: Dedupe the Android permissions in app.json**

In `app.json`, replace the `android.permissions` array (which currently lists each permission twice) with:

```json
      "permissions": [
        "android.permission.ACCESS_COARSE_LOCATION",
        "android.permission.ACCESS_FINE_LOCATION"
      ]
```

Leave the rest of `app.json` unchanged.

- [ ] **Step 2: Create app.config.ts**

Create `app.config.ts` at the worktree root. It spreads the existing `app.json` config (passed in as `config`) and replaces only the `react-native-maps` plugin entry so the key is read from the environment at build time:

```ts
import type { ConfigContext, ExpoConfig } from 'expo/config'

export default ({ config }: ConfigContext): ExpoConfig => ({
  ...config,
  name: config.name ?? 'guiatur',
  slug: config.slug ?? 'guiatur',
  plugins: (config.plugins ?? []).map((plugin) =>
    Array.isArray(plugin) && plugin[0] === 'react-native-maps'
      ? ['react-native-maps', { androidGoogleMapsApiKey: process.env.GOOGLE_MAPS_API_KEY }]
      : plugin,
  ) as ExpoConfig['plugins'],
})
```

- [ ] **Step 3: Create .env.example (committed)**

Create `.env.example` at the worktree root:

```
# Google Maps API key used by the react-native-maps config plugin for EAS / dev builds.
# Expo Go renders Google maps with Expo's own key, so this is only required for native builds.
GOOGLE_MAPS_API_KEY=your-google-maps-api-key

# Base URL of the local json-server.
# Leave unset to use the platform default (Android emulator: 10.0.2.2; iOS sim/web: localhost).
# Physical device: set to your computer's LAN IP, e.g. http://192.168.0.10:3001
EXPO_PUBLIC_API_URL=http://localhost:3001
```

- [ ] **Step 4: Create the local .env (gitignored)**

The real key lives in the main repo's `.env` (this worktree doesn't have it). Copy it in:

```powershell
Copy-Item ..\..\..\.env .env -Force
Get-Content .env
```

Expected: `.env` now contains `GOOGLE_MAPS_API_KEY=...`. (`.env` is gitignored, so it will NOT be committed — that's intended.) This is optional for Expo Go testing but lets native builds pick up the key.

- [ ] **Step 5: Verify the config resolves**

```powershell
npx expo config --type public
```

Expected: prints the resolved config as JSON without error, and under `plugins` the `react-native-maps` entry shows `androidGoogleMapsApiKey` populated from the env (or an empty/undefined value if `.env` was not copied — either way it must resolve without throwing). Then:

```powershell
npx tsc --noEmit
```

Expected: passes.

- [ ] **Step 6: Commit**

```powershell
git add app.config.ts app.json .env.example
git commit -m "Move Expo config to app.config.ts and inject Maps key from env"
```

---

## Task 5: Shared theme palette and navigator DRY-up

**Files:**
- Create: `src/constants/theme.ts`
- Modify: `src/app/_layout.tsx`
- Modify: `src/app/(tabs)/_layout.tsx`

- [ ] **Step 1: Create the theme palette**

Create `src/constants/theme.ts` (mirrors the hex values already in `tailwind.config.js`, for the React Navigation / map APIs that take raw colors instead of className):

```ts
export const COLORS = {
  roseSubtle: '#FDF0F5',
  rose: '#E8A0B4',
  roseDark: '#C47A97',
  inkMuted: '#A890A0',
  sandLight: '#FAF4EC',
  sand: '#E8D8C4',
  periwinkle: '#C4C8E4',
} as const
```

- [ ] **Step 2: Use COLORS in the root layout**

In `src/app/_layout.tsx`, add the import and replace the inline hex in `screenOptions`. Add near the other imports:

```ts
import { COLORS } from '@/constants/theme'
```

Replace the `<Stack ...>` `screenOptions` object with:

```tsx
          screenOptions={{
            headerStyle: { backgroundColor: COLORS.roseSubtle },
            headerTintColor: COLORS.roseDark,
            headerTitleStyle: { fontFamily: 'Nunito_700Bold' },
            contentStyle: { backgroundColor: COLORS.roseSubtle },
          }}
```

(The `ActivityIndicator color="#C47A97"` in the fonts-loading branch may also use `COLORS.roseDark`; update it for consistency.)

- [ ] **Step 3: Use COLORS in the tabs layout**

In `src/app/(tabs)/_layout.tsx`, add:

```ts
import { COLORS } from '@/constants/theme'
```

Replace the `<Tabs ...>` `screenOptions` object with:

```tsx
      screenOptions={{
        headerStyle: { backgroundColor: COLORS.roseSubtle },
        headerTintColor: COLORS.roseDark,
        headerTitleStyle: { fontFamily: 'Nunito_700Bold' },
        tabBarActiveTintColor: COLORS.roseDark,
        tabBarInactiveTintColor: COLORS.inkMuted,
        tabBarLabelStyle: { fontFamily: 'Nunito_600SemiBold' },
        tabBarStyle: { backgroundColor: COLORS.sandLight, borderTopColor: COLORS.sand },
      }}
```

- [ ] **Step 4: Typecheck and lint**

```powershell
npx tsc --noEmit
npm run lint
```

Expected: both pass.

- [ ] **Step 5: Commit**

```powershell
git add src/constants/theme.ts src/app/_layout.tsx "src/app/(tabs)/_layout.tsx"
git commit -m "Extract shared color palette and use it in navigators"
```

---

## Task 6: Presentational components

**Files:**
- Create: `src/components/CategoryBadge.tsx`
- Create: `src/components/PointCard.tsx`
- Create: `src/components/LoadingOverlay.tsx`
- Create: `src/components/ErrorMessage.tsx`

- [ ] **Step 1: CategoryBadge**

Create `src/components/CategoryBadge.tsx`:

```tsx
import { Text, View } from 'react-native'

import { CATEGORY_LABELS, type PlaceCategory } from '@/types/place'

export function CategoryBadge({ category }: { category: PlaceCategory | null }) {
  if (!category) {
    return null
  }

  return (
    <View className="self-start rounded-full bg-sage-light px-3 py-1">
      <Text className="font-medium text-xs text-rose-dark">{CATEGORY_LABELS[category]}</Text>
    </View>
  )
}
```

- [ ] **Step 2: PointCard**

Create `src/components/PointCard.tsx`:

```tsx
import { Image } from 'expo-image'
import { Pressable, Text, View } from 'react-native'

import { CategoryBadge } from '@/components/CategoryBadge'
import type { MapPoint } from '@/types/place'

type PointCardProps = {
  point: MapPoint
  onPress: () => void
}

export function PointCard({ point, onPress }: PointCardProps) {
  return (
    <Pressable
      className="mb-3 overflow-hidden rounded-3xl border border-sand bg-white shadow-sm active:opacity-80"
      onPress={onPress}
    >
      {point.imageUrl ? (
        <Image source={{ uri: point.imageUrl }} style={{ width: '100%', height: 140 }} contentFit="cover" transition={200} />
      ) : null}
      <View className="p-4">
        <CategoryBadge category={point.category} />
        <Text className="mt-2 font-bold text-lg text-ink">{point.name}</Text>
      </View>
    </Pressable>
  )
}
```

- [ ] **Step 3: LoadingOverlay**

Create `src/components/LoadingOverlay.tsx`:

```tsx
import { ActivityIndicator, Text, View } from 'react-native'

import { COLORS } from '@/constants/theme'

export function LoadingOverlay({ message = 'Carregando...' }: { message?: string }) {
  return (
    <View className="flex-1 items-center justify-center bg-rose-subtle">
      <ActivityIndicator color={COLORS.roseDark} />
      <Text className="mt-3 font-sans text-sm text-ink-muted">{message}</Text>
    </View>
  )
}
```

- [ ] **Step 4: ErrorMessage**

Create `src/components/ErrorMessage.tsx`:

```tsx
import { Pressable, Text, View } from 'react-native'

type ErrorMessageProps = {
  message: string
  onRetry?: () => void
}

export function ErrorMessage({ message, onRetry }: ErrorMessageProps) {
  return (
    <View className="flex-1 items-center justify-center bg-rose-subtle px-6">
      <View className="w-full rounded-3xl border border-sand bg-white p-6 shadow-sm">
        <Text className="font-bold text-lg text-rose-dark">Ops!</Text>
        <Text className="mt-2 font-sans text-base leading-6 text-ink-muted">{message}</Text>
        {onRetry ? (
          <Pressable className="mt-6 items-center rounded-2xl bg-rose px-5 py-4 active:bg-rose-dark" onPress={onRetry}>
            <Text className="font-bold text-base text-white">Tentar novamente</Text>
          </Pressable>
        ) : null}
      </View>
    </View>
  )
}
```

- [ ] **Step 5: Typecheck and lint**

```powershell
npx tsc --noEmit
npm run lint
```

Expected: both pass.

- [ ] **Step 6: Commit**

```powershell
git add src/components/CategoryBadge.tsx src/components/PointCard.tsx src/components/LoadingOverlay.tsx src/components/ErrorMessage.tsx
git commit -m "Add CategoryBadge, PointCard, LoadingOverlay, and ErrorMessage components"
```

---

## Task 7: Live Explorar list

**Files:**
- Modify: `src/app/(tabs)/explore.tsx` (replace entire file)

- [ ] **Step 1: Replace the Explorar screen**

Replace the entire contents of `src/app/(tabs)/explore.tsx` with:

```tsx
import { useRouter } from 'expo-router'
import { useCallback, useEffect, useState } from 'react'
import { FlatList, Text, View } from 'react-native'

import { ErrorMessage } from '@/components/ErrorMessage'
import { LoadingOverlay } from '@/components/LoadingOverlay'
import { PointCard } from '@/components/PointCard'
import { fetchPlaces } from '@/services/jsonServer'
import { placeToMapPoint, type MapPoint } from '@/types/place'

export default function ExploreScreen() {
  const router = useRouter()
  const [points, setPoints] = useState<MapPoint[]>([])
  const [isLoading, setIsLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  const loadPlaces = useCallback(async () => {
    setIsLoading(true)
    setError(null)
    try {
      const places = await fetchPlaces()
      setPoints(places.map(placeToMapPoint))
    } catch {
      setError('Não foi possível carregar os pontos. Verifique se o servidor está rodando.')
    } finally {
      setIsLoading(false)
    }
  }, [])

  useEffect(() => {
    loadPlaces()
  }, [loadPlaces])

  if (isLoading) {
    return <LoadingOverlay message="Carregando pontos..." />
  }

  if (error) {
    return <ErrorMessage message={error} onRetry={loadPlaces} />
  }

  return (
    <View className="flex-1 bg-rose-subtle">
      <FlatList
        data={points}
        keyExtractor={(item) => item.id}
        contentContainerStyle={{ padding: 24 }}
        ListHeaderComponent={
          <View className="mb-4">
            <Text className="font-bold text-2xl text-rose-dark">Explorar</Text>
            <Text className="mt-1 font-sans text-sm text-ink-muted">
              {points.length} {points.length === 1 ? 'ponto turístico' : 'pontos turísticos'}
            </Text>
          </View>
        }
        renderItem={({ item }) => (
          <PointCard
            point={item}
            onPress={() => router.push({ pathname: '/place/[id]', params: { id: item.id, source: item.source } })}
          />
        )}
      />
    </View>
  )
}
```

- [ ] **Step 2: Typecheck and lint**

```powershell
npx tsc --noEmit
npm run lint
```

Expected: both pass.

- [ ] **Step 3: Commit**

```powershell
git add "src/app/(tabs)/explore.tsx"
git commit -m "Render live places list on the Explorar tab"
```

---

## Task 8: Live Mapa screen with markers and geofence circles

**Files:**
- Modify: `src/app/(tabs)/index.tsx` (replace entire file)

- [ ] **Step 1: Replace the Mapa screen**

Replace the entire contents of `src/app/(tabs)/index.tsx` with. Note: `Marker` and `Circle` are rendered as two separate mapped lists (not wrapped in a `View` or `Fragment`) because react-native-maps requires its overlays to be direct children of `MapView`:

```tsx
import { useEffect, useState } from 'react'
import { StyleSheet, View } from 'react-native'
import MapView, { Circle, Marker, PROVIDER_GOOGLE } from 'react-native-maps'

import { ErrorMessage } from '@/components/ErrorMessage'
import { LoadingOverlay } from '@/components/LoadingOverlay'
import { COLORS } from '@/constants/theme'
import { fetchPlaces } from '@/services/jsonServer'
import { CATEGORY_LABELS, placeToMapPoint, type MapPoint } from '@/types/place'

const INITIAL_REGION = {
  latitude: -28.6775,
  longitude: -49.3697,
  latitudeDelta: 0.02,
  longitudeDelta: 0.02,
}

export default function MapScreen() {
  const [points, setPoints] = useState<MapPoint[]>([])
  const [isLoading, setIsLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    let isMounted = true
    fetchPlaces()
      .then((places) => {
        if (isMounted) setPoints(places.map(placeToMapPoint))
      })
      .catch(() => {
        if (isMounted) setError('Não foi possível carregar os pontos.')
      })
      .finally(() => {
        if (isMounted) setIsLoading(false)
      })
    return () => {
      isMounted = false
    }
  }, [])

  if (isLoading) {
    return <LoadingOverlay message="Carregando mapa..." />
  }

  if (error) {
    return <ErrorMessage message={error} />
  }

  const activePoints = points.filter((point) => point.isActive)

  return (
    <View style={styles.container}>
      <MapView provider={PROVIDER_GOOGLE} style={styles.map} initialRegion={INITIAL_REGION}>
        {activePoints.map((point) => (
          <Marker
            key={`marker-${point.id}`}
            coordinate={{ latitude: point.latitude, longitude: point.longitude }}
            title={point.name}
            description={point.category ? CATEGORY_LABELS[point.category] : undefined}
            pinColor={point.source === 'local' ? COLORS.rose : COLORS.periwinkle}
          />
        ))}
        {activePoints.map((point) => (
          <Circle
            key={`circle-${point.id}`}
            center={{ latitude: point.latitude, longitude: point.longitude }}
            radius={point.radiusMeters}
            strokeColor="rgba(196,122,151,0.6)"
            fillColor="rgba(232,160,180,0.2)"
          />
        ))}
      </MapView>
    </View>
  )
}

const styles = StyleSheet.create({
  container: { flex: 1 },
  map: { flex: 1 },
})
```

- [ ] **Step 2: Typecheck and lint**

```powershell
npx tsc --noEmit
npm run lint
```

Expected: both pass.

- [ ] **Step 3: Commit**

```powershell
git add "src/app/(tabs)/index.tsx"
git commit -m "Render live markers and geofence circles on the Mapa tab"
```

---

## Milestone smoke test (manual, at checkpoint)

1. Terminal 1: `npm run server` (json-server on port 3001).
2. Terminal 2: `npx expo start`, open in Expo Go.
3. Grant location permission → tabs appear.
4. **Mapa**: a Google map centered on Criciúma shows ~5 pink markers, each surrounded by a translucent geofence circle; tapping a marker shows its name + category.
5. **Explorar**: a scrollable list of 5 cards (image, category badge, name); tapping one pushes **Detalhes** showing the correct `id` and `source: local`.
6. Stop the server → pull-to-nothing: re-open Explorar/Mapa and confirm the friendly error screen with "Tentar novamente" appears (then restart the server and retry succeeds).

---

## Self-Review

- **Spec coverage:**
  - Requirement 4 (Axios GET): `services/jsonServer.ts` uses Axios; `fetchPlaces`/`fetchPlace` are GET. POST/PUT are present for M4. ✓
  - Map with markers + visible geofence circles (Mapa screen). ✓
  - List with cards + navigation passing `id` + `source` (Explorar → Detalhes). ✓
  - Loading (`LoadingOverlay`/`ActivityIndicator`) and error handling (`ErrorMessage` + retry) on both data screens. ✓
  - Config fix: `app.config.ts` injects the Maps key from env; android permissions deduped. ✓
  - Theme preserved + DRY-ed via `constants/theme.ts`. ✓
- **Deferred (correctly out of M2):** Google Places API source (M3), live user location + distance + geofencing modal (M3), Details screen content (M3), the Zod form (M4), source filter on the list (M3, when a second source exists).
- **Type consistency:** `MapPoint` shape and `placeToMapPoint` are defined once in `types/place.ts` and consumed identically by the service, list, and map. `fetchPlaces(): Promise<Place[]>` → `.map(placeToMapPoint)` → `MapPoint[]`. Route push uses `{ id, source }` matching `place/[id].tsx`'s `useLocalSearchParams<{ id; source }>()` from M1. `COLORS` keys referenced (`rose`, `periwinkle`, `roseDark`, `roseSubtle`, `inkMuted`, `sandLight`, `sand`) all exist in `theme.ts`. ✓
- **Placeholder scan:** Every code step contains complete file contents; no TODO/TBD. ✓
- **Risk note:** react-native-maps overlays are rendered as direct `MapView` children (two separate `.map()` lists), avoiding the known Fragment/View-wrapping pitfall. json-server v1 command verified (`--host`/`--port`, no `--watch`).
