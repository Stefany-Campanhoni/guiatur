# GuiaTur M3 — Geofencing + Details Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Add live foreground geolocation and Haversine-based geofencing — an automatic proximity modal when the user enters a point's radius, live distances on the map and list, and a full Detalhes screen (with a mini-map of the pin and a "Como chegar" action).

**Architecture:** A `LiveLocationProvider` context wraps the granted app and streams the user's coordinates via `watchPositionAsync`. Pure, unit-tested helpers (`utils/haversine.ts`, `utils/geofence.ts`) compute distances and "newly entered" points. A `useGeofencing` hook tracks which points already fired this session (a `Set<id>`) and surfaces the next one for the `ProximityModal`. Screens read the live coords to show distances; Detalhes fetches the full point and renders a non-interactive mini-map.

**Tech Stack:** Expo 55, expo-location (`watchPositionAsync`), react-native-maps, expo-router, jest-expo (new — for the Haversine/geofence unit tests), NativeWind.

**Scope note:** Google Places (second source) and the source filter are M5; the Cadastro form is M4. This milestone covers Requirement 5 (hardware/geofencing) plus the Detalhes screen. Detalhes handles `source: 'local'` points (the only kind that exist until M5); a `google` branch is added in M5.

**Testing note:** This milestone introduces the first automated tests. `utils/haversine.ts` and `utils/geofence.ts` are pure functions built test-first with `jest-expo`. The location context, hook wiring, and screens are verified by `tsc`/`lint` and a manual on-device smoke test (geolocation needs a real device).

**Geofencing test caveat:** The seeded points are in Criciúma. To see the ProximityModal fire without traveling there, use the **M4** Cadastro form (next milestone) to register a point at your current location with a small radius, then step outside and back into it. The geofence *logic* itself is fully covered by the `utils/geofence.ts` unit tests in this milestone, so its correctness doesn't depend on physical proximity.

**Git note:** Run all git commands in the terminal (PowerShell). Commit messages must NOT include any Co-Authored-By / Claude attribution.

---

## File Structure (end state of M3)

```
jest.config.js                       # CREATE: jest-expo preset + @/ alias mapping
package.json                         # MODIFY: add jest-expo/jest deps + "test" script
src/
  utils/
    haversine.ts                     # CREATE: distance in meters (pure)
    haversine.test.ts                # CREATE
    geofence.ts                      # CREATE: in-range / newly-entered helpers (pure)
    geofence.test.ts                 # CREATE
  contexts/
    location.tsx                     # CREATE: LiveLocationProvider streaming coords
  hooks/
    useGeofencing.ts                 # CREATE: session Set + nearby point to surface
  components/
    DistanceBadge.tsx                # CREATE
    ProximityModal.tsx               # CREATE
    PointCard.tsx                    # MODIFY: optional distance badge
  app/
    _layout.tsx                      # MODIFY: mount LiveLocationProvider
    (tabs)/index.tsx                 # MODIFY: user location + geofencing + modal
    (tabs)/explore.tsx               # MODIFY: pass live distance to cards
    place/[id].tsx                   # MODIFY: full details + mini-map + "Como chegar"
```

---

## Task 1: Set up jest-expo

**Files:**
- Modify: `package.json`
- Create: `jest.config.js`

- [ ] **Step 1: Install test deps**

In the terminal: `npx expo install -- --save-dev jest-expo jest @types/jest`

(If that flag form is rejected by your npm version, run `npx expo install jest-expo jest @types/jest` — they will land in dependencies; that is acceptable for this project.)

- [ ] **Step 2: Add the test script**

In `package.json` `scripts`, add:

```json
"test": "jest"
```

- [ ] **Step 3: Create jest.config.js**

Create `jest.config.js` at the worktree root:

```js
module.exports = {
  preset: 'jest-expo',
  moduleNameMapper: {
    '^@/(.*)$': '<rootDir>/src/$1',
  },
}
```

- [ ] **Step 4: Verify jest runs (no tests yet)**

Run: `npx jest --passWithNoTests`
Expected: exits 0 with "No tests found, exiting with code 0" (or similar).

- [ ] **Step 5: Commit**

```powershell
git add package.json package-lock.json jest.config.js
git commit -m "Set up jest-expo for unit tests"
```

---

## Task 2: Haversine distance (TDD)

**Files:**
- Create: `src/utils/haversine.test.ts`
- Create: `src/utils/haversine.ts`

- [ ] **Step 1: Write the failing test**

Create `src/utils/haversine.test.ts`:

```ts
import { haversineDistance } from './haversine'

describe('haversineDistance', () => {
  it('returns 0 for identical points', () => {
    const p = { latitude: -28.6775, longitude: -49.3697 }
    expect(haversineDistance(p, p)).toBe(0)
  })

  it('approximates ~111 m for 0.001° of latitude', () => {
    const a = { latitude: -28.6775, longitude: -49.3697 }
    const b = { latitude: -28.6765, longitude: -49.3697 }
    const d = haversineDistance(a, b)
    expect(d).toBeGreaterThan(108)
    expect(d).toBeLessThan(114)
  })

  it('is symmetric', () => {
    const a = { latitude: -28.6775, longitude: -49.3697 }
    const b = { latitude: -28.68, longitude: -49.37 }
    expect(haversineDistance(a, b)).toBeCloseTo(haversineDistance(b, a), 6)
  })
})
```

- [ ] **Step 2: Run it to verify failure**

Run: `npx jest src/utils/haversine.test.ts`
Expected: FAIL — cannot find module `./haversine`.

- [ ] **Step 3: Implement**

Create `src/utils/haversine.ts`:

```ts
type LatLng = { latitude: number; longitude: number }

const EARTH_RADIUS_METERS = 6_371_000

function toRadians(degrees: number): number {
  return (degrees * Math.PI) / 180
}

/** Great-circle distance between two coordinates, in meters. */
export function haversineDistance(from: LatLng, to: LatLng): number {
  const dLat = toRadians(to.latitude - from.latitude)
  const dLng = toRadians(to.longitude - from.longitude)
  const lat1 = toRadians(from.latitude)
  const lat2 = toRadians(to.latitude)

  const a = Math.sin(dLat / 2) ** 2 + Math.cos(lat1) * Math.cos(lat2) * Math.sin(dLng / 2) ** 2
  const c = 2 * Math.asin(Math.sqrt(a))

  return EARTH_RADIUS_METERS * c
}
```

- [ ] **Step 4: Run it to verify it passes**

Run: `npx jest src/utils/haversine.test.ts`
Expected: PASS (3 tests).

- [ ] **Step 5: Commit**

```powershell
git add src/utils/haversine.ts src/utils/haversine.test.ts
git commit -m "Add Haversine distance helper with tests"
```

---

## Task 3: Geofence helpers (TDD)

**Files:**
- Create: `src/utils/geofence.test.ts`
- Create: `src/utils/geofence.ts`

- [ ] **Step 1: Write the failing test**

Create `src/utils/geofence.test.ts`:

```ts
import type { MapPoint } from '@/types/place'

import { findNewlyEnteredPoint, findPointsInRange } from './geofence'

function makePoint(overrides: Partial<MapPoint>): MapPoint {
  return {
    id: 'p1',
    source: 'local',
    name: 'Ponto',
    category: 'museum',
    imageUrl: null,
    latitude: -28.6775,
    longitude: -49.3697,
    radiusMeters: 100,
    isActive: true,
    ...overrides,
  }
}

const userAtPoint = { latitude: -28.6775, longitude: -49.3697 }
const userFarAway = { latitude: -28.7, longitude: -49.4 }

describe('findPointsInRange', () => {
  it('includes an active point the user is standing on', () => {
    const points = [makePoint({})]
    expect(findPointsInRange(points, userAtPoint)).toHaveLength(1)
  })

  it('excludes points outside their radius', () => {
    const points = [makePoint({})]
    expect(findPointsInRange(points, userFarAway)).toHaveLength(0)
  })

  it('excludes inactive points even when in range', () => {
    const points = [makePoint({ isActive: false })]
    expect(findPointsInRange(points, userAtPoint)).toHaveLength(0)
  })
})

describe('findNewlyEnteredPoint', () => {
  it('returns an in-range point not yet triggered', () => {
    const points = [makePoint({ id: 'a' })]
    const result = findNewlyEnteredPoint(points, userAtPoint, new Set())
    expect(result?.id).toBe('a')
  })

  it('returns null when the only in-range point is already triggered', () => {
    const points = [makePoint({ id: 'a' })]
    const result = findNewlyEnteredPoint(points, userAtPoint, new Set(['a']))
    expect(result).toBeNull()
  })

  it('returns null when nothing is in range', () => {
    const points = [makePoint({ id: 'a' })]
    expect(findNewlyEnteredPoint(points, userFarAway, new Set())).toBeNull()
  })
})
```

- [ ] **Step 2: Run it to verify failure**

Run: `npx jest src/utils/geofence.test.ts`
Expected: FAIL — cannot find module `./geofence`.

- [ ] **Step 3: Implement**

Create `src/utils/geofence.ts`:

```ts
import type { MapPoint } from '@/types/place'
import { haversineDistance } from '@/utils/haversine'

type LatLng = { latitude: number; longitude: number }

/** Active points whose geofence currently contains the user. */
export function findPointsInRange(points: MapPoint[], coords: LatLng): MapPoint[] {
  return points.filter(
    (point) => point.isActive && haversineDistance(coords, point) <= point.radiusMeters,
  )
}

/** The first in-range point not present in `triggeredIds`, or null. */
export function findNewlyEnteredPoint(
  points: MapPoint[],
  coords: LatLng,
  triggeredIds: ReadonlySet<string>,
): MapPoint | null {
  return findPointsInRange(points, coords).find((point) => !triggeredIds.has(point.id)) ?? null
}
```

- [ ] **Step 4: Run it to verify it passes**

Run: `npx jest src/utils/geofence.test.ts`
Expected: PASS (6 tests).

- [ ] **Step 5: Commit**

```powershell
git add src/utils/geofence.ts src/utils/geofence.test.ts
git commit -m "Add geofence range helpers with tests"
```

---

## Task 4: Live location context

**Files:**
- Create: `src/contexts/location.tsx`
- Modify: `src/app/_layout.tsx`

- [ ] **Step 1: Create the provider**

Create `src/contexts/location.tsx`:

```tsx
import * as Location from 'expo-location'
import { createContext, type PropsWithChildren, useContext, useEffect, useRef, useState } from 'react'

import { useLocationPermission } from '@/contexts/location-permission'

export type Coords = { latitude: number; longitude: number }

type LiveLocationContextValue = {
  coords: Coords | null
}

const LiveLocationContext = createContext<LiveLocationContextValue | null>(null)

export function LiveLocationProvider({ children }: PropsWithChildren) {
  const { isGranted } = useLocationPermission()
  const [coords, setCoords] = useState<Coords | null>(null)
  const subscriptionRef = useRef<Location.LocationSubscription | null>(null)

  useEffect(() => {
    if (!isGranted) {
      return
    }

    let cancelled = false
    Location.watchPositionAsync(
      { accuracy: Location.Accuracy.High, distanceInterval: 10 },
      (location) => {
        if (!cancelled) {
          setCoords({ latitude: location.coords.latitude, longitude: location.coords.longitude })
        }
      },
    ).then((subscription) => {
      if (cancelled) {
        subscription.remove()
      } else {
        subscriptionRef.current = subscription
      }
    })

    return () => {
      cancelled = true
      subscriptionRef.current?.remove()
      subscriptionRef.current = null
    }
  }, [isGranted])

  return <LiveLocationContext.Provider value={{ coords }}>{children}</LiveLocationContext.Provider>
}

export function useLiveLocation() {
  const context = useContext(LiveLocationContext)
  if (!context) {
    throw new Error('useLiveLocation must be used inside LiveLocationProvider')
  }
  return context
}
```

- [ ] **Step 2: Mount it in the root layout**

In `src/app/_layout.tsx`, add the import:

```tsx
import { LiveLocationProvider } from '@/contexts/location'
```

Then wrap the `<Stack>` with `<LiveLocationProvider>` INSIDE the existing `<LocationPermissionProvider>`. The provider tree becomes:

```tsx
      <LocationPermissionProvider>
        <LiveLocationProvider>
          <Stack
            screenOptions={{
              headerStyle: { backgroundColor: COLORS.roseSubtle },
              headerTintColor: COLORS.roseDark,
              headerTitleStyle: { fontFamily: 'Nunito_700Bold' },
              contentStyle: { backgroundColor: COLORS.roseSubtle },
            }}
          >
            <Stack.Screen name="(tabs)" options={{ headerShown: false }} />
            <Stack.Screen name="permissions" options={{ headerShown: false }} />
            <Stack.Screen name="place/[id]" options={{ title: 'Detalhes' }} />
          </Stack>
        </LiveLocationProvider>
      </LocationPermissionProvider>
```

- [ ] **Step 3: Verify**

```powershell
npx tsc --noEmit
npm run lint
```

Expected: both pass.

- [ ] **Step 4: Commit**

```powershell
git add src/contexts/location.tsx src/app/_layout.tsx
git commit -m "Stream live foreground location via context"
```

---

## Task 5: useGeofencing hook

**Files:**
- Create: `src/hooks/useGeofencing.ts`

- [ ] **Step 1: Implement the hook**

Create `src/hooks/useGeofencing.ts`:

```ts
import { useCallback, useEffect, useRef, useState } from 'react'

import type { Coords } from '@/contexts/location'
import type { MapPoint } from '@/types/place'
import { findNewlyEnteredPoint } from '@/utils/geofence'

/**
 * Watches the user's coords against a set of points and surfaces the next
 * point whose geofence they enter, firing once per point per session.
 */
export function useGeofencing(points: MapPoint[], coords: Coords | null) {
  const [nearbyPoint, setNearbyPoint] = useState<MapPoint | null>(null)
  const triggeredIds = useRef<Set<string>>(new Set())

  useEffect(() => {
    if (!coords) {
      return
    }
    const entered = findNewlyEnteredPoint(points, coords, triggeredIds.current)
    if (entered) {
      triggeredIds.current.add(entered.id)
      setNearbyPoint(entered)
    }
  }, [points, coords])

  const dismiss = useCallback(() => setNearbyPoint(null), [])

  return { nearbyPoint, dismiss }
}
```

- [ ] **Step 2: Verify**

```powershell
npx tsc --noEmit
npm run lint
```

Expected: both pass.

- [ ] **Step 3: Commit**

```powershell
git add src/hooks/useGeofencing.ts
git commit -m "Add useGeofencing hook with per-session trigger tracking"
```

---

## Task 6: DistanceBadge and ProximityModal components

**Files:**
- Create: `src/components/DistanceBadge.tsx`
- Create: `src/components/ProximityModal.tsx`

- [ ] **Step 1: DistanceBadge**

Create `src/components/DistanceBadge.tsx`:

```tsx
import { Text, View } from 'react-native'

export function formatDistance(meters: number): string {
  if (meters < 1000) {
    return `${Math.round(meters)} m`
  }
  return `${(meters / 1000).toFixed(1)} km`
}

export function DistanceBadge({ meters }: { meters: number }) {
  return (
    <View className="self-start rounded-full bg-rose-light px-3 py-1">
      <Text className="font-medium text-xs text-rose-dark">{formatDistance(meters)}</Text>
    </View>
  )
}
```

- [ ] **Step 2: ProximityModal**

Create `src/components/ProximityModal.tsx`:

```tsx
import { Image } from 'expo-image'
import { Modal, Pressable, Text, View } from 'react-native'

import { CategoryBadge } from '@/components/CategoryBadge'
import { DistanceBadge } from '@/components/DistanceBadge'
import type { MapPoint } from '@/types/place'

type ProximityModalProps = {
  point: MapPoint | null
  distanceMeters: number | null
  onDismiss: () => void
  onSeeDetails: (point: MapPoint) => void
}

export function ProximityModal({ point, distanceMeters, onDismiss, onSeeDetails }: ProximityModalProps) {
  return (
    <Modal visible={point !== null} transparent animationType="slide" onRequestClose={onDismiss}>
      <Pressable className="flex-1 justify-end bg-black/30" onPress={onDismiss}>
        <Pressable className="rounded-t-3xl border border-sand bg-white p-6" onPress={() => {}}>
          {point ? (
            <>
              <Text className="font-medium text-xs uppercase text-ink-muted">Você está perto de</Text>
              {point.imageUrl ? (
                <Image
                  source={{ uri: point.imageUrl }}
                  style={{ width: '100%', height: 140, borderRadius: 16, marginTop: 8 }}
                  contentFit="cover"
                  transition={200}
                />
              ) : null}
              <Text className="mt-3 font-bold text-xl text-ink">{point.name}</Text>
              <View className="mt-2 flex-row gap-2">
                <CategoryBadge category={point.category} />
                {distanceMeters !== null ? <DistanceBadge meters={distanceMeters} /> : null}
              </View>
              <Pressable
                className="mt-5 items-center rounded-2xl bg-rose px-5 py-4 active:bg-rose-dark"
                onPress={() => onSeeDetails(point)}
              >
                <Text className="font-bold text-base text-white">Ver detalhes</Text>
              </Pressable>
              <Pressable className="mt-2 items-center px-5 py-3" onPress={onDismiss}>
                <Text className="font-medium text-sm text-ink-muted">Agora não</Text>
              </Pressable>
            </>
          ) : null}
        </Pressable>
      </Pressable>
    </Modal>
  )
}
```

- [ ] **Step 3: Verify**

```powershell
npx tsc --noEmit
npm run lint
```

Expected: both pass.

- [ ] **Step 4: Commit**

```powershell
git add src/components/DistanceBadge.tsx src/components/ProximityModal.tsx
git commit -m "Add DistanceBadge and ProximityModal components"
```

---

## Task 7: Wire geofencing into the Mapa screen

**Files:**
- Modify: `src/app/(tabs)/index.tsx` (replace entire file)

- [ ] **Step 1: Replace the Mapa screen**

Replace the entire contents of `src/app/(tabs)/index.tsx` with:

```tsx
import { useRouter } from 'expo-router'
import { useCallback, useEffect, useState } from 'react'
import { StyleSheet, View } from 'react-native'
import MapView, { Circle, Marker, PROVIDER_GOOGLE } from 'react-native-maps'

import { ErrorMessage } from '@/components/ErrorMessage'
import { LoadingOverlay } from '@/components/LoadingOverlay'
import { ProximityModal } from '@/components/ProximityModal'
import { COLORS } from '@/constants/theme'
import { useLiveLocation } from '@/contexts/location'
import { useGeofencing } from '@/hooks/useGeofencing'
import { fetchPlaces } from '@/services/jsonServer'
import { CATEGORY_LABELS, placeToMapPoint, type MapPoint } from '@/types/place'
import { haversineDistance } from '@/utils/haversine'

const INITIAL_REGION = {
  latitude: -28.6775,
  longitude: -49.3697,
  latitudeDelta: 0.02,
  longitudeDelta: 0.02,
}

export default function MapScreen() {
  const router = useRouter()
  const { coords } = useLiveLocation()
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
      setError('Não foi possível carregar os pontos.')
    } finally {
      setIsLoading(false)
    }
  }, [])

  useEffect(() => {
    loadPlaces()
  }, [loadPlaces])

  const { nearbyPoint, dismiss } = useGeofencing(points, coords)

  if (isLoading) {
    return <LoadingOverlay message="Carregando mapa..." />
  }

  if (error) {
    return <ErrorMessage message={error} onRetry={loadPlaces} />
  }

  const activePoints = points.filter((point) => point.isActive)
  const nearbyDistance =
    nearbyPoint && coords ? haversineDistance(coords, nearbyPoint) : null

  return (
    <View style={styles.container}>
      <MapView provider={PROVIDER_GOOGLE} style={styles.map} initialRegion={INITIAL_REGION} showsUserLocation>
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

      <ProximityModal
        point={nearbyPoint}
        distanceMeters={nearbyDistance}
        onDismiss={dismiss}
        onSeeDetails={(point) => {
          dismiss()
          router.push({ pathname: '/place/[id]', params: { id: point.id, source: point.source } })
        }}
      />
    </View>
  )
}

const styles = StyleSheet.create({
  container: { flex: 1 },
  map: { flex: 1 },
})
```

- [ ] **Step 2: Verify**

```powershell
npx tsc --noEmit
npm run lint
```

Expected: both pass.

- [ ] **Step 3: Commit**

```powershell
git add "src/app/(tabs)/index.tsx"
git commit -m "Show user location and fire proximity modal on the map"
```

---

## Task 8: Live distance on the Explorar list

**Files:**
- Modify: `src/components/PointCard.tsx`
- Modify: `src/app/(tabs)/explore.tsx` (replace entire file)

- [ ] **Step 1: Add an optional distance to PointCard**

Replace the entire contents of `src/components/PointCard.tsx` with:

```tsx
import { Image } from 'expo-image'
import { Pressable, Text, View } from 'react-native'

import { CategoryBadge } from '@/components/CategoryBadge'
import { DistanceBadge } from '@/components/DistanceBadge'
import type { MapPoint } from '@/types/place'

type PointCardProps = {
  point: MapPoint
  onPress: () => void
  distanceMeters?: number | null
}

export function PointCard({ point, onPress, distanceMeters = null }: PointCardProps) {
  return (
    <Pressable
      className="mb-3 overflow-hidden rounded-3xl border border-sand bg-white shadow-sm active:opacity-80"
      onPress={onPress}
    >
      {point.imageUrl ? (
        <Image source={{ uri: point.imageUrl }} style={{ width: '100%', height: 140 }} contentFit="cover" transition={200} />
      ) : null}
      <View className="p-4">
        <View className="flex-row gap-2">
          <CategoryBadge category={point.category} />
          {distanceMeters !== null ? <DistanceBadge meters={distanceMeters} /> : null}
        </View>
        <Text className="mt-2 font-bold text-lg text-ink">{point.name}</Text>
      </View>
    </Pressable>
  )
}
```

- [ ] **Step 2: Pass live distance from the Explorar screen**

Replace the entire contents of `src/app/(tabs)/explore.tsx` with:

```tsx
import { useRouter } from 'expo-router'
import { useCallback, useEffect, useState } from 'react'
import { FlatList, Text, View } from 'react-native'

import { ErrorMessage } from '@/components/ErrorMessage'
import { LoadingOverlay } from '@/components/LoadingOverlay'
import { PointCard } from '@/components/PointCard'
import { useLiveLocation } from '@/contexts/location'
import { fetchPlaces } from '@/services/jsonServer'
import { placeToMapPoint, type MapPoint } from '@/types/place'
import { haversineDistance } from '@/utils/haversine'

export default function ExploreScreen() {
  const router = useRouter()
  const { coords } = useLiveLocation()
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
            distanceMeters={coords ? haversineDistance(coords, item) : null}
            onPress={() => router.push({ pathname: '/place/[id]', params: { id: item.id, source: item.source } })}
          />
        )}
      />
    </View>
  )
}
```

- [ ] **Step 3: Verify**

```powershell
npx tsc --noEmit
npm run lint
```

Expected: both pass.

- [ ] **Step 4: Commit**

```powershell
git add src/components/PointCard.tsx "src/app/(tabs)/explore.tsx"
git commit -m "Show live distance to each point on the Explorar list"
```

---

## Task 9: Detalhes screen with mini-map and "Como chegar"

**Files:**
- Modify: `src/app/place/[id].tsx` (replace entire file)

- [ ] **Step 1: Replace the Detalhes screen**

Replace the entire contents of `src/app/place/[id].tsx` with the following. It fetches the local point by id, shows the full info, a live distance, a non-interactive mini-map centered on the pin, and a "Como chegar" button that opens the device's maps app with directions:

```tsx
import { Image } from 'expo-image'
import { useLocalSearchParams } from 'expo-router'
import { useCallback, useEffect, useState } from 'react'
import { Linking, Pressable, ScrollView, StyleSheet, Text, View } from 'react-native'
import MapView, { Marker, PROVIDER_GOOGLE } from 'react-native-maps'

import { CategoryBadge } from '@/components/CategoryBadge'
import { DistanceBadge } from '@/components/DistanceBadge'
import { ErrorMessage } from '@/components/ErrorMessage'
import { LoadingOverlay } from '@/components/LoadingOverlay'
import { useLiveLocation } from '@/contexts/location'
import { fetchPlace } from '@/services/jsonServer'
import { type Place } from '@/types/place'
import { haversineDistance } from '@/utils/haversine'

export default function PlaceDetailsScreen() {
  const { id } = useLocalSearchParams<{ id: string; source: string }>()
  const { coords } = useLiveLocation()
  const [place, setPlace] = useState<Place | null>(null)
  const [isLoading, setIsLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  const loadPlace = useCallback(async () => {
    setIsLoading(true)
    setError(null)
    try {
      setPlace(await fetchPlace(id))
    } catch {
      setError('Não foi possível carregar este ponto.')
    } finally {
      setIsLoading(false)
    }
  }, [id])

  useEffect(() => {
    loadPlace()
  }, [loadPlace])

  if (isLoading) {
    return <LoadingOverlay message="Carregando ponto..." />
  }

  if (error || !place) {
    return <ErrorMessage message={error ?? 'Ponto não encontrado.'} onRetry={loadPlace} />
  }

  const distanceMeters = coords ? haversineDistance(coords, place) : null

  const openDirections = () => {
    const url = `https://www.google.com/maps/dir/?api=1&destination=${place.latitude},${place.longitude}`
    Linking.openURL(url)
  }

  return (
    <ScrollView className="flex-1 bg-rose-subtle" contentContainerStyle={{ padding: 20 }}>
      <Image source={{ uri: place.imageUrl }} style={styles.hero} contentFit="cover" transition={200} />

      <View className="mt-4 flex-row gap-2">
        <CategoryBadge category={place.category} />
        {distanceMeters !== null ? <DistanceBadge meters={distanceMeters} /> : null}
      </View>

      <Text className="mt-3 font-bold text-2xl text-ink">{place.name}</Text>
      <Text className="mt-2 font-sans text-base leading-6 text-ink-muted">{place.description}</Text>

      <Text className="mb-2 mt-6 font-medium text-xs uppercase text-ink-muted">Localização</Text>
      <View style={styles.mapWrapper}>
        <MapView
          provider={PROVIDER_GOOGLE}
          style={styles.map}
          pointerEvents="none"
          initialRegion={{
            latitude: place.latitude,
            longitude: place.longitude,
            latitudeDelta: 0.005,
            longitudeDelta: 0.005,
          }}
        >
          <Marker coordinate={{ latitude: place.latitude, longitude: place.longitude }} title={place.name} />
        </MapView>
      </View>

      <Pressable className="mt-5 items-center rounded-2xl bg-rose px-5 py-4 active:bg-rose-dark" onPress={openDirections}>
        <Text className="font-bold text-base text-white">Como chegar</Text>
      </Pressable>
    </ScrollView>
  )
}

const styles = StyleSheet.create({
  hero: { width: '100%', height: 200, borderRadius: 20 },
  mapWrapper: { height: 180, borderRadius: 16, overflow: 'hidden' },
  map: { flex: 1 },
})
```

- [ ] **Step 2: Verify**

```powershell
npx tsc --noEmit
npm run lint
```

Expected: both pass.

- [ ] **Step 3: Run the unit tests once more (full suite)**

Run: `npm test`
Expected: the Haversine (3) and geofence (6) tests pass — 9 total.

- [ ] **Step 4: Commit**

```powershell
git add "src/app/place/[id].tsx"
git commit -m "Build Detalhes screen with mini-map and directions"
```

---

## Milestone smoke test (manual, on a physical phone)

1. `npm run server` (Terminal 1) and `npx expo start` (Terminal 2); open in Expo Go on the phone (same Wi-Fi; `.env` already points at the PC's LAN IP).
2. Grant location → the **Mapa** shows the blue "you are here" dot alongside the markers/circles.
3. **Explorar**: each card now shows a distance badge (e.g. "1.2 km") relative to where you are; the number updates as you move.
4. Tap a card → **Detalhes** shows the hero image, description, live distance, a mini-map with the pin, and a **Como chegar** button that opens Google Maps with directions.
5. **Geofence**: when you are within a point's radius, the **ProximityModal** slides up automatically with the point and distance; "Ver detalhes" opens Detalhes; it does not re-fire for the same point this session. (To test without going to Criciúma, wait for the M4 form to register a point at your location.)

---

## Self-Review

- **Spec coverage (Requirement 5):** runtime permission already gates the app (M1); `LiveLocationProvider` uses `watchPositionAsync({ accuracy: High, distanceInterval: 10 })`; `utils/haversine.ts` computes meters; `useGeofencing` + `utils/geofence.ts` track entry with a session `Set<id>` and surface the point; `ProximityModal` shows automatically. ✓ Plus Detalhes screen with mini-map (user request) and "Como chegar". ✓
- **First automated tests:** haversine (3) + geofence (6) built test-first under jest-expo. ✓
- **Deferred (correct):** Google Places source + filter (M5); Cadastro form (M4); Detalhes `source: 'google'` branch (M5).
- **Type consistency:** `Coords = { latitude; longitude }` defined in `contexts/location.tsx`, reused by `useGeofencing`. `findPointsInRange`/`findNewlyEnteredPoint` signatures match between `geofence.ts`, its tests, and the hook. `haversineDistance(LatLng, LatLng)` is called with `coords` and `MapPoint`/`Place` (both have `latitude`/`longitude`, structurally compatible). `PointCard` gains an optional `distanceMeters` (default null) so the M2 call sites stay valid; the Explorar call now passes it. `fetchPlace(id)` returns `Place` (defined in M2). Route params `{ id, source }` unchanged from M1/M2. ✓
- **Placeholder scan:** every code step has complete contents; no TODO/TBD. The Detalhes `source` param is intentionally read but unused until M5 (kept for the typed-route param shape) — destructured as `id` only to avoid an unused-var lint error. ✓
- **react-native-maps:** mini-map overlays use a single `Marker` as a direct `MapView` child; `pointerEvents="none"` makes it static. The main map keeps the Marker/Circle two-list pattern. ✓
