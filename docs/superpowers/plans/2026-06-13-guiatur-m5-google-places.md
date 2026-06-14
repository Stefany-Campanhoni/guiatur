# GuiaTur M5 — Google Places Source + Filter Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development or superpowers:executing-plans. Steps use checkbox (`- [ ]`) syntax.

**Goal:** Add the Google Places API as a second live source — nearby tourist attractions merged onto the map and list alongside the user's json-server points — plus a source filter on Explorar and a Google branch on the Detalhes screen.

**Architecture:** A `placesApi.ts` Axios service calls the New Places API (`places:searchNearby` POST + `places/{id}` GET) and maps results into the shared `MapPoint` shape with `source: 'google'`. The Mapa and Explorar screens load json-server + Google in parallel (`Promise.all`) and merge. Google points get no geofence circle and never trigger the proximity modal (radius 0). Detalhes branches on `source`: local → json-server, google → Google details. The Places service degrades gracefully (returns `[]` on any error / missing key) so the app keeps working without Google.

**Tech Stack:** Expo 55, react-native-maps, axios, Google Places API (New), expo-router, NativeWind.

**Code style:** No useless/obvious comments.

**Verified:** The configured key works for both New and legacy Places HTTP calls (not Android-restricted). This plan uses the New API.

**Testing note:** The Places service is IO/external (not unit-tested, like `jsonServer`). The 17 existing unit tests stay green. Screens verified by `tsc`/`lint` + on-device smoke test.

**Git note:** terminal-only git; commit messages must NOT include Co-Authored-By / Claude attribution.

---

## File Structure

```
src/constants/api.ts          # MODIFY: export GOOGLE_MAPS_API_KEY (EXPO_PUBLIC_)
.env.example                  # MODIFY: document EXPO_PUBLIC_GOOGLE_MAPS_API_KEY
src/services/placesApi.ts     # CREATE: New Places API service
src/app/(tabs)/index.tsx      # MODIFY: merge local + google on the map
src/app/(tabs)/explore.tsx    # MODIFY: merge + source filter chips
src/app/place/[id].tsx        # MODIFY: google details branch
```

`.env` (gitignored) already has `EXPO_PUBLIC_GOOGLE_MAPS_API_KEY` set locally.

---

## Task 1: Expose the Maps key to JS

**Files:** Modify `src/constants/api.ts`, `.env.example`

- [ ] **Step 1:** Append to `src/constants/api.ts`:

```ts
export const GOOGLE_MAPS_API_KEY = process.env.EXPO_PUBLIC_GOOGLE_MAPS_API_KEY ?? ''
```

- [ ] **Step 2:** In `.env.example`, add under the existing Maps key line:

```
# Same Google key, exposed to JS (Places API calls). Requires the EXPO_PUBLIC_ prefix.
EXPO_PUBLIC_GOOGLE_MAPS_API_KEY=your-google-maps-api-key
```

- [ ] **Step 3:** Verify + commit:

```powershell
npx tsc --noEmit
git add src/constants/api.ts .env.example
git commit -m "Expose Google Maps key to JS for Places API"
```

---

## Task 2: Google Places service

**Files:** Create `src/services/placesApi.ts`

- [ ] **Step 1:** Create `src/services/placesApi.ts`:

```ts
import axios from 'axios'

import { GOOGLE_MAPS_API_KEY } from '@/constants/api'
import type { MapPoint } from '@/types/place'

type LatLng = { latitude: number; longitude: number }

type GooglePlace = {
  id: string
  displayName?: { text?: string }
  location: LatLng
  photos?: { name: string }[]
  rating?: number
  formattedAddress?: string
  editorialSummary?: { text?: string }
}

const api = axios.create({ baseURL: 'https://places.googleapis.com/v1', timeout: 8000 })

export function googlePhotoUrl(photoName: string): string {
  return `https://places.googleapis.com/v1/${photoName}/media?maxWidthPx=600&key=${GOOGLE_MAPS_API_KEY}`
}

function toMapPoint(place: GooglePlace): MapPoint {
  return {
    id: place.id,
    source: 'google',
    name: place.displayName?.text ?? 'Ponto turístico',
    category: null,
    imageUrl: place.photos?.[0] ? googlePhotoUrl(place.photos[0].name) : null,
    latitude: place.location.latitude,
    longitude: place.location.longitude,
    radiusMeters: 0,
    isActive: true,
  }
}

export async function fetchNearbyGooglePlaces(center: LatLng): Promise<MapPoint[]> {
  if (!GOOGLE_MAPS_API_KEY) {
    return []
  }
  try {
    const { data } = await api.post<{ places?: GooglePlace[] }>(
      '/places:searchNearby',
      {
        includedTypes: ['tourist_attraction'],
        maxResultCount: 15,
        locationRestriction: { circle: { center, radius: 5000 } },
      },
      {
        headers: {
          'X-Goog-Api-Key': GOOGLE_MAPS_API_KEY,
          'X-Goog-FieldMask': 'places.id,places.displayName,places.location,places.photos,places.rating',
        },
      },
    )
    return (data.places ?? []).map(toMapPoint)
  } catch {
    return []
  }
}

export type GooglePlaceDetails = {
  id: string
  name: string
  description: string
  imageUrl: string | null
  rating: number | null
  latitude: number
  longitude: number
}

export async function fetchGooglePlaceDetails(placeId: string): Promise<GooglePlaceDetails> {
  const { data } = await api.get<GooglePlace>(`/places/${placeId}`, {
    headers: {
      'X-Goog-Api-Key': GOOGLE_MAPS_API_KEY,
      'X-Goog-FieldMask': 'id,displayName,location,photos,rating,formattedAddress,editorialSummary',
    },
  })
  return {
    id: data.id,
    name: data.displayName?.text ?? 'Ponto turístico',
    description: data.editorialSummary?.text ?? data.formattedAddress ?? 'Sem descrição disponível.',
    imageUrl: data.photos?.[0] ? googlePhotoUrl(data.photos[0].name) : null,
    rating: data.rating ?? null,
    latitude: data.location.latitude,
    longitude: data.location.longitude,
  }
}
```

- [ ] **Step 2:** Verify + commit:

```powershell
npx tsc --noEmit
npm run lint
git add src/services/placesApi.ts
git commit -m "Add Google Places API service"
```

---

## Task 3: Merge Google points on the Mapa screen

**Files:** Modify `src/app/(tabs)/index.tsx` (replace entire file)

- [ ] **Step 1:** Replace `src/app/(tabs)/index.tsx` with:

```tsx
import { useFocusEffect, useRouter } from 'expo-router'
import { useCallback, useRef, useState } from 'react'
import { StyleSheet, View } from 'react-native'
import MapView, { Circle, Marker, PROVIDER_GOOGLE } from 'react-native-maps'

import { ErrorMessage } from '@/components/ErrorMessage'
import { LoadingOverlay } from '@/components/LoadingOverlay'
import { ProximityModal } from '@/components/ProximityModal'
import { COLORS } from '@/constants/theme'
import { useLiveLocation } from '@/contexts/location'
import { useGeofencing } from '@/hooks/useGeofencing'
import { fetchPlaces } from '@/services/jsonServer'
import { fetchNearbyGooglePlaces } from '@/services/placesApi'
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
  const coordsRef = useRef(coords)
  coordsRef.current = coords
  const [points, setPoints] = useState<MapPoint[]>([])
  const [isLoading, setIsLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const hasLoaded = useRef(false)

  const loadPoints = useCallback(async (withSpinner: boolean) => {
    if (withSpinner) setIsLoading(true)
    setError(null)
    try {
      const center = coordsRef.current ?? INITIAL_REGION
      const [local, google] = await Promise.all([
        fetchPlaces().then((places) => places.map(placeToMapPoint)),
        fetchNearbyGooglePlaces(center),
      ])
      setPoints([...local, ...google])
    } catch {
      setError('Não foi possível carregar os pontos.')
    } finally {
      if (withSpinner) setIsLoading(false)
    }
  }, [])

  useFocusEffect(
    useCallback(() => {
      loadPoints(!hasLoaded.current)
      hasLoaded.current = true
    }, [loadPoints]),
  )

  const { nearbyPoint, dismiss } = useGeofencing(points, coords)

  if (isLoading) {
    return <LoadingOverlay message="Carregando mapa..." />
  }

  if (error) {
    return <ErrorMessage message={error} onRetry={() => loadPoints(true)} />
  }

  const activePoints = points.filter((point) => point.isActive)
  const localPoints = activePoints.filter((point) => point.source === 'local')
  const nearbyDistance = nearbyPoint && coords ? haversineDistance(coords, nearbyPoint) : null

  return (
    <View style={styles.container}>
      <MapView provider={PROVIDER_GOOGLE} style={styles.map} initialRegion={INITIAL_REGION} showsUserLocation>
        {activePoints.map((point) => (
          <Marker
            key={`marker-${point.source}-${point.id}`}
            coordinate={{ latitude: point.latitude, longitude: point.longitude }}
            title={point.name}
            description={point.category ? CATEGORY_LABELS[point.category] : 'Google Places'}
            pinColor={point.source === 'local' ? COLORS.rose : COLORS.periwinkle}
            onCalloutPress={() => router.push({ pathname: '/place/[id]', params: { id: point.id, source: point.source } })}
          />
        ))}
        {localPoints.map((point) => (
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

- [ ] **Step 2:** Verify + commit:

```powershell
npx tsc --noEmit
npm run lint
git add "src/app/(tabs)/index.tsx"
git commit -m "Merge Google Places points onto the map"
```

---

## Task 4: Source filter on Explorar

**Files:** Modify `src/app/(tabs)/explore.tsx` (replace entire file)

- [ ] **Step 1:** Replace `src/app/(tabs)/explore.tsx` with:

```tsx
import { useFocusEffect, useRouter } from 'expo-router'
import { useCallback, useRef, useState } from 'react'
import { FlatList, Pressable, Text, View } from 'react-native'

import { ErrorMessage } from '@/components/ErrorMessage'
import { LoadingOverlay } from '@/components/LoadingOverlay'
import { PointCard } from '@/components/PointCard'
import { useLiveLocation } from '@/contexts/location'
import { fetchPlaces } from '@/services/jsonServer'
import { fetchNearbyGooglePlaces } from '@/services/placesApi'
import { placeToMapPoint, type MapPoint, type PlaceSource } from '@/types/place'
import { haversineDistance } from '@/utils/haversine'

const INITIAL_CENTER = { latitude: -28.6775, longitude: -49.3697 }

type Filter = 'all' | PlaceSource

const FILTERS: { key: Filter; label: string }[] = [
  { key: 'all', label: 'Todos' },
  { key: 'local', label: 'Meus pontos' },
  { key: 'google', label: 'Google' },
]

export default function ExploreScreen() {
  const router = useRouter()
  const { coords } = useLiveLocation()
  const coordsRef = useRef(coords)
  coordsRef.current = coords
  const [points, setPoints] = useState<MapPoint[]>([])
  const [filter, setFilter] = useState<Filter>('all')
  const [isLoading, setIsLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const hasLoaded = useRef(false)

  const loadPoints = useCallback(async (withSpinner: boolean) => {
    if (withSpinner) setIsLoading(true)
    setError(null)
    try {
      const center = coordsRef.current ?? INITIAL_CENTER
      const [local, google] = await Promise.all([
        fetchPlaces().then((places) => places.map(placeToMapPoint)),
        fetchNearbyGooglePlaces(center),
      ])
      setPoints([...local, ...google])
    } catch {
      setError('Não foi possível carregar os pontos. Verifique se o servidor está rodando.')
    } finally {
      if (withSpinner) setIsLoading(false)
    }
  }, [])

  useFocusEffect(
    useCallback(() => {
      loadPoints(!hasLoaded.current)
      hasLoaded.current = true
    }, [loadPoints]),
  )

  if (isLoading) {
    return <LoadingOverlay message="Carregando pontos..." />
  }

  if (error) {
    return <ErrorMessage message={error} onRetry={() => loadPoints(true)} />
  }

  const visiblePoints = filter === 'all' ? points : points.filter((point) => point.source === filter)

  return (
    <View className="flex-1 bg-rose-subtle">
      <FlatList
        data={visiblePoints}
        keyExtractor={(item) => `${item.source}-${item.id}`}
        contentContainerStyle={{ padding: 24 }}
        ListHeaderComponent={
          <View className="mb-4">
            <Text className="font-bold text-2xl text-rose-dark">Explorar</Text>
            <View className="mt-3 flex-row gap-2">
              {FILTERS.map((option) => {
                const active = option.key === filter
                return (
                  <Pressable
                    key={option.key}
                    className={`rounded-full px-4 py-2 ${active ? 'bg-rose' : 'border border-sand bg-white'}`}
                    onPress={() => setFilter(option.key)}
                  >
                    <Text className={`font-medium text-sm ${active ? 'text-white' : 'text-ink-muted'}`}>{option.label}</Text>
                  </Pressable>
                )
              })}
            </View>
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

- [ ] **Step 2:** Verify + commit:

```powershell
npx tsc --noEmit
npm run lint
git add "src/app/(tabs)/explore.tsx"
git commit -m "Merge Google places and add source filter to Explorar"
```

---

## Task 5: Google branch on Detalhes

**Files:** Modify `src/app/place/[id].tsx` (replace entire file)

- [ ] **Step 1:** Replace `src/app/place/[id].tsx` with:

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
import { fetchGooglePlaceDetails } from '@/services/placesApi'
import { type PlaceCategory } from '@/types/place'
import { haversineDistance } from '@/utils/haversine'

type DetailView = {
  name: string
  description: string
  imageUrl: string | null
  category: PlaceCategory | null
  rating: number | null
  latitude: number
  longitude: number
}

export default function PlaceDetailsScreen() {
  const { id, source } = useLocalSearchParams<{ id: string; source: string }>()
  const { coords } = useLiveLocation()
  const [detail, setDetail] = useState<DetailView | null>(null)
  const [isLoading, setIsLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  const loadDetail = useCallback(async () => {
    setIsLoading(true)
    setError(null)
    try {
      if (source === 'google') {
        const place = await fetchGooglePlaceDetails(id)
        setDetail({
          name: place.name,
          description: place.description,
          imageUrl: place.imageUrl,
          category: null,
          rating: place.rating,
          latitude: place.latitude,
          longitude: place.longitude,
        })
      } else {
        const place = await fetchPlace(id)
        setDetail({
          name: place.name,
          description: place.description,
          imageUrl: place.imageUrl,
          category: place.category,
          rating: null,
          latitude: place.latitude,
          longitude: place.longitude,
        })
      }
    } catch {
      setError('Não foi possível carregar este ponto.')
    } finally {
      setIsLoading(false)
    }
  }, [id, source])

  useEffect(() => {
    loadDetail()
  }, [loadDetail])

  if (isLoading) {
    return <LoadingOverlay message="Carregando ponto..." />
  }

  if (error || !detail) {
    return <ErrorMessage message={error ?? 'Ponto não encontrado.'} onRetry={loadDetail} />
  }

  const distanceMeters = coords ? haversineDistance(coords, detail) : null

  const openDirections = () => {
    Linking.openURL(`https://www.google.com/maps/dir/?api=1&destination=${detail.latitude},${detail.longitude}`)
  }

  return (
    <ScrollView className="flex-1 bg-rose-subtle" contentContainerStyle={{ padding: 20 }}>
      {detail.imageUrl ? (
        <Image source={{ uri: detail.imageUrl }} style={styles.hero} contentFit="cover" transition={200} />
      ) : null}

      <View className="mt-4 flex-row items-center gap-2">
        <CategoryBadge category={detail.category} />
        {distanceMeters !== null ? <DistanceBadge meters={distanceMeters} /> : null}
        {detail.rating !== null ? (
          <View className="self-start rounded-full bg-sand-light px-3 py-1">
            <Text className="font-medium text-xs text-rose-dark">⭐ {detail.rating.toFixed(1)}</Text>
          </View>
        ) : null}
      </View>

      <Text className="mt-3 font-bold text-2xl text-ink">{detail.name}</Text>
      <Text className="mt-2 font-sans text-base leading-6 text-ink-muted">{detail.description}</Text>

      <Text className="mb-2 mt-6 font-medium text-xs uppercase text-ink-muted">Localização</Text>
      <View style={styles.mapWrapper}>
        <MapView
          provider={PROVIDER_GOOGLE}
          style={styles.map}
          pointerEvents="none"
          initialRegion={{ latitude: detail.latitude, longitude: detail.longitude, latitudeDelta: 0.005, longitudeDelta: 0.005 }}
        >
          <Marker coordinate={{ latitude: detail.latitude, longitude: detail.longitude }} title={detail.name} />
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

- [ ] **Step 2:** Verify (full suite) + commit:

```powershell
npx tsc --noEmit
npm run lint
npm test
git add "src/app/place/[id].tsx"
git commit -m "Show Google place details on the Detalhes screen"
```

Expected: tsc clean; lint 0 errors (1 known axios warning); `npm test` 17 passing.

---

## Milestone smoke test (physical phone)

1. `npm run server` + `npx expo start`; open in Expo Go.
2. **Mapa**: pink markers (your points, with geofence circles) + periwinkle markers (Google tourist attractions nearby, no circles); tap a Google marker's callout → Detalhes.
3. **Explorar**: filter chips — Todos / Meus pontos / Google; switching filters the list; Google cards show photo + distance.
4. Tap a Google card → Detalhes shows Google photo, description (editorial summary or address), ⭐ rating, mini-map, "Como chegar".
5. If Google is ever unreachable, the app still shows local points (graceful fallback).

---

## Self-Review

- **Requirement 4 (second source):** `placesApi.ts` (Axios, New Places API) merged via `Promise.all` on map + list. ✓
- **Source filter:** Todos / Meus pontos / Google chips on Explorar. ✓
- **Details google branch:** `source === 'google'` fetches Google details; normalized `DetailView` renders both. ✓
- **Geofencing unaffected:** Google points have `radiusMeters: 0` → never in range; circles drawn for local only. ✓
- **Graceful degradation:** `fetchNearbyGooglePlaces` returns `[]` on error/missing key. ✓
- **Type consistency:** `fetchNearbyGooglePlaces(center): Promise<MapPoint[]>`; `MapPoint` is the M2 shape; `PlaceSource` from `@/types/place`; `fetchGooglePlaceDetails` → `GooglePlaceDetails` normalized into `DetailView`. `GOOGLE_MAPS_API_KEY` from `constants/api`. ✓
- **No comments; theme classes valid** (`bg-sand-light`, `bg-rose`, `border-sand`). ✓
