# GuiaTur M4 — Cadastro Form Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Build the Cadastro screen — a 6-field form validated with Zod + react-hook-form that captures the user's current GPS and POSTs a new point to json-server, and make the Mapa/Explorar screens refresh on focus so the new point appears (and can trigger the geofence).

**Architecture:** A `placeSchema` (Zod) defines the six fields and their messages; `react-hook-form` with `zodResolver` drives the form via `Controller` over a reusable `FormInput`, a native `Picker` (category), and a `Switch` (active). On submit, the screen reads live coords (falling back to a one-shot `getCurrentPositionAsync`), assembles the record with `createdAt`, and calls the existing `createPlace` POST. Mapa and Explorar move from a one-shot mount fetch to `useFocusEffect` so they re-read json-server when shown.

**Tech Stack:** Expo 55, react-hook-form, zod, @hookform/resolvers, @react-native-picker/picker (Included in Expo Go), expo-location, json-server, NativeWind.

**Code style:** No useless/obvious comments — clear names only.

**Scope note:** Google Places (second source) + source filter remain M5. This milestone covers Requirement 3 (form) and the focus-refresh glue.

**Testing note:** `placeSchema` is pure and built test-first under jest-expo (the validation rules are the graded part). The screen + refetch wiring are verified by `tsc`/`lint` and an on-device smoke test.

**Git note:** Run all git commands in the terminal (PowerShell). Commit messages must NOT include any Co-Authored-By / Claude attribution.

---

## File Structure (end state of M4)

```
package.json                  # MODIFY: add zod, react-hook-form, @hookform/resolvers, @react-native-picker/picker
src/
  schemas/
    placeSchema.ts            # CREATE: Zod schema for the 6 form fields
    placeSchema.test.ts       # CREATE
  components/
    FormInput.tsx             # CREATE: labeled TextInput + error text
  app/
    (tabs)/add.tsx            # MODIFY: the full form (replace placeholder)
    (tabs)/index.tsx          # MODIFY: refetch on focus
    (tabs)/explore.tsx        # MODIFY: refetch on focus
```

---

## Task 1: Install form dependencies

**Files:**
- Modify: `package.json`

- [ ] **Step 1: Install**

In the terminal: `npx expo install zod react-hook-form @hookform/resolvers @react-native-picker/picker`

- [ ] **Step 2: Verify they resolve**

Run: `npx tsc --noEmit`
Expected: still clean (no usages yet).

- [ ] **Step 3: Commit**

```powershell
git add package.json package-lock.json
git commit -m "Add zod, react-hook-form, resolvers, and picker"
```

---

## Task 2: placeSchema (TDD)

**Files:**
- Create: `src/schemas/placeSchema.test.ts`
- Create: `src/schemas/placeSchema.ts`

- [ ] **Step 1: Write the failing test**

Create `src/schemas/placeSchema.test.ts`:

```ts
import { placeSchema } from './placeSchema'

const valid = {
  name: 'Praça Central',
  description: 'Uma descrição histórica com mais de vinte caracteres.',
  category: 'park',
  radiusMeters: '200',
  imageUrl: 'https://example.com/img.jpg',
  isActive: true,
}

describe('placeSchema', () => {
  it('accepts a valid form', () => {
    expect(placeSchema.safeParse(valid).success).toBe(true)
  })

  it('rejects a name shorter than 3 chars', () => {
    expect(placeSchema.safeParse({ ...valid, name: 'ab' }).success).toBe(false)
  })

  it('rejects a description shorter than 20 chars', () => {
    expect(placeSchema.safeParse({ ...valid, description: 'curto' }).success).toBe(false)
  })

  it('rejects a radius below 50', () => {
    expect(placeSchema.safeParse({ ...valid, radiusMeters: '10' }).success).toBe(false)
  })

  it('rejects a radius above 1000', () => {
    expect(placeSchema.safeParse({ ...valid, radiusMeters: '5000' }).success).toBe(false)
  })

  it('rejects a non-numeric radius', () => {
    expect(placeSchema.safeParse({ ...valid, radiusMeters: 'abc' }).success).toBe(false)
  })

  it('rejects an invalid image url', () => {
    expect(placeSchema.safeParse({ ...valid, imageUrl: 'not-a-url' }).success).toBe(false)
  })

  it('rejects an unknown category', () => {
    expect(placeSchema.safeParse({ ...valid, category: 'food' }).success).toBe(false)
  })
})
```

- [ ] **Step 2: Run it to verify failure**

Run: `npx jest src/schemas/placeSchema.test.ts`
Expected: FAIL — cannot find module `./placeSchema`.

- [ ] **Step 3: Implement**

Create `src/schemas/placeSchema.ts`:

```ts
import { z } from 'zod'

import { PLACE_CATEGORIES } from '@/types/place'

export const placeSchema = z.object({
  name: z.string().min(3, 'Mínimo de 3 caracteres'),
  description: z.string().min(20, 'Mínimo de 20 caracteres'),
  category: z.enum(PLACE_CATEGORIES),
  radiusMeters: z
    .string()
    .regex(/^\d+$/, 'Informe um número')
    .refine((value) => Number(value) >= 50 && Number(value) <= 1000, 'Entre 50 e 1000 metros'),
  imageUrl: z.string().url('URL inválida'),
  isActive: z.boolean(),
})

export type PlaceFormValues = z.infer<typeof placeSchema>
```

- [ ] **Step 4: Run it to verify it passes**

Run: `npx jest src/schemas/placeSchema.test.ts`
Expected: PASS (8 tests).

- [ ] **Step 5: Commit**

```powershell
git add src/schemas/placeSchema.ts src/schemas/placeSchema.test.ts
git commit -m "Add Zod schema for the place form with tests"
```

---

## Task 3: FormInput component

**Files:**
- Create: `src/components/FormInput.tsx`

- [ ] **Step 1: Implement**

Create `src/components/FormInput.tsx`:

```tsx
import { Text, TextInput, View, type TextInputProps } from 'react-native'

import { COLORS } from '@/constants/theme'

type FormInputProps = TextInputProps & {
  label: string
  error?: string
}

export function FormInput({ label, error, ...inputProps }: FormInputProps) {
  return (
    <View className="mb-4">
      <Text className="mb-1 font-medium text-sm text-ink">{label}</Text>
      <TextInput
        className="rounded-2xl border border-sand bg-white px-4 py-3 font-sans text-base text-ink"
        placeholderTextColor={COLORS.inkMuted}
        {...inputProps}
      />
      {error ? <Text className="mt-1 font-medium text-xs text-error">{error}</Text> : null}
    </View>
  )
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
git add src/components/FormInput.tsx
git commit -m "Add reusable FormInput component"
```

---

## Task 4: Cadastro form screen

**Files:**
- Modify: `src/app/(tabs)/add.tsx` (replace entire file)

- [ ] **Step 1: Replace the Adicionar screen**

Replace the entire contents of `src/app/(tabs)/add.tsx` with:

```tsx
import { zodResolver } from '@hookform/resolvers/zod'
import { Picker } from '@react-native-picker/picker'
import * as Location from 'expo-location'
import { useRouter } from 'expo-router'
import { Controller, useForm } from 'react-hook-form'
import { Alert, Pressable, ScrollView, Switch, Text, View } from 'react-native'

import { FormInput } from '@/components/FormInput'
import { COLORS } from '@/constants/theme'
import { useLiveLocation } from '@/contexts/location'
import { placeSchema, type PlaceFormValues } from '@/schemas/placeSchema'
import { createPlace } from '@/services/jsonServer'
import { CATEGORY_LABELS, PLACE_CATEGORIES } from '@/types/place'

const DEFAULT_VALUES: PlaceFormValues = {
  name: '',
  description: '',
  category: 'museum',
  radiusMeters: '',
  imageUrl: '',
  isActive: true,
}

export default function AddScreen() {
  const router = useRouter()
  const { coords } = useLiveLocation()
  const {
    control,
    handleSubmit,
    reset,
    formState: { errors, isSubmitting },
  } = useForm<PlaceFormValues>({
    resolver: zodResolver(placeSchema),
    defaultValues: DEFAULT_VALUES,
  })

  const onSubmit = async (values: PlaceFormValues) => {
    let position = coords
    if (!position) {
      const current = await Location.getCurrentPositionAsync({ accuracy: Location.Accuracy.High })
      position = { latitude: current.coords.latitude, longitude: current.coords.longitude }
    }

    try {
      await createPlace({
        name: values.name,
        description: values.description,
        category: values.category,
        radiusMeters: Number(values.radiusMeters),
        imageUrl: values.imageUrl,
        isActive: values.isActive,
        latitude: position.latitude,
        longitude: position.longitude,
        createdAt: new Date().toISOString(),
      })
      reset(DEFAULT_VALUES)
      Alert.alert('Pronto!', 'Ponto cadastrado com sucesso.', [
        { text: 'Ver no mapa', onPress: () => router.push('/(tabs)') },
        { text: 'OK' },
      ])
    } catch {
      Alert.alert('Erro', 'Não foi possível salvar o ponto. Verifique o servidor.')
    }
  }

  return (
    <ScrollView
      className="flex-1 bg-rose-subtle"
      contentContainerStyle={{ padding: 24 }}
      keyboardShouldPersistTaps="handled"
    >
      <Text className="mb-1 font-bold text-2xl text-rose-dark">Adicionar ponto</Text>
      <Text className="mb-5 font-sans text-sm text-ink-muted">O ponto é salvo na sua localização atual.</Text>

      <Controller
        control={control}
        name="name"
        render={({ field: { onChange, onBlur, value } }) => (
          <FormInput
            label="Nome"
            placeholder="Ex: Praça Central"
            value={value}
            onChangeText={onChange}
            onBlur={onBlur}
            error={errors.name?.message}
          />
        )}
      />

      <Controller
        control={control}
        name="description"
        render={({ field: { onChange, onBlur, value } }) => (
          <FormInput
            label="Descrição histórica"
            placeholder="Conte a história deste lugar..."
            value={value}
            onChangeText={onChange}
            onBlur={onBlur}
            error={errors.description?.message}
            multiline
            numberOfLines={4}
            style={{ height: 100, textAlignVertical: 'top' }}
          />
        )}
      />

      <View className="mb-4">
        <Text className="mb-1 font-medium text-sm text-ink">Categoria</Text>
        <View className="overflow-hidden rounded-2xl border border-sand bg-white">
          <Controller
            control={control}
            name="category"
            render={({ field: { onChange, value } }) => (
              <Picker selectedValue={value} onValueChange={onChange}>
                {PLACE_CATEGORIES.map((category) => (
                  <Picker.Item key={category} label={CATEGORY_LABELS[category]} value={category} />
                ))}
              </Picker>
            )}
          />
        </View>
      </View>

      <Controller
        control={control}
        name="radiusMeters"
        render={({ field: { onChange, onBlur, value } }) => (
          <FormInput
            label="Raio do geofence (metros)"
            placeholder="50 a 1000"
            value={value}
            onChangeText={onChange}
            onBlur={onBlur}
            error={errors.radiusMeters?.message}
            keyboardType="numeric"
          />
        )}
      />

      <Controller
        control={control}
        name="imageUrl"
        render={({ field: { onChange, onBlur, value } }) => (
          <FormInput
            label="URL da imagem"
            placeholder="https://..."
            value={value}
            onChangeText={onChange}
            onBlur={onBlur}
            error={errors.imageUrl?.message}
            autoCapitalize="none"
            keyboardType="url"
          />
        )}
      />

      <Controller
        control={control}
        name="isActive"
        render={({ field: { onChange, value } }) => (
          <View className="mb-6 flex-row items-center justify-between">
            <Text className="font-medium text-sm text-ink">Geofence ativo</Text>
            <Switch value={value} onValueChange={onChange} trackColor={{ true: COLORS.rose, false: COLORS.sand }} />
          </View>
        )}
      />

      <Pressable
        className="items-center rounded-2xl bg-rose px-5 py-4 active:bg-rose-dark"
        disabled={isSubmitting}
        onPress={handleSubmit(onSubmit)}
      >
        <Text className="font-bold text-base text-white">{isSubmitting ? 'Salvando...' : 'Salvar ponto'}</Text>
      </Pressable>
    </ScrollView>
  )
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
git add "src/app/(tabs)/add.tsx"
git commit -m "Build Cadastro form with Zod validation and POST"
```

---

## Task 5: Refetch Mapa and Explorar on focus

**Files:**
- Modify: `src/app/(tabs)/index.tsx` (replace entire file)
- Modify: `src/app/(tabs)/explore.tsx` (replace entire file)

- [ ] **Step 1: Replace the Mapa screen**

Replace the entire contents of `src/app/(tabs)/index.tsx` with:

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
  const hasLoaded = useRef(false)

  const loadPlaces = useCallback(async (withSpinner: boolean) => {
    if (withSpinner) setIsLoading(true)
    setError(null)
    try {
      const places = await fetchPlaces()
      setPoints(places.map(placeToMapPoint))
    } catch {
      setError('Não foi possível carregar os pontos.')
    } finally {
      if (withSpinner) setIsLoading(false)
    }
  }, [])

  useFocusEffect(
    useCallback(() => {
      loadPlaces(!hasLoaded.current)
      hasLoaded.current = true
    }, [loadPlaces]),
  )

  const { nearbyPoint, dismiss } = useGeofencing(points, coords)

  if (isLoading) {
    return <LoadingOverlay message="Carregando mapa..." />
  }

  if (error) {
    return <ErrorMessage message={error} onRetry={() => loadPlaces(true)} />
  }

  const activePoints = points.filter((point) => point.isActive)
  const nearbyDistance = nearbyPoint && coords ? haversineDistance(coords, nearbyPoint) : null

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

- [ ] **Step 2: Replace the Explorar screen**

Replace the entire contents of `src/app/(tabs)/explore.tsx` with:

```tsx
import { useFocusEffect, useRouter } from 'expo-router'
import { useCallback, useRef, useState } from 'react'
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
  const hasLoaded = useRef(false)

  const loadPlaces = useCallback(async (withSpinner: boolean) => {
    if (withSpinner) setIsLoading(true)
    setError(null)
    try {
      const places = await fetchPlaces()
      setPoints(places.map(placeToMapPoint))
    } catch {
      setError('Não foi possível carregar os pontos. Verifique se o servidor está rodando.')
    } finally {
      if (withSpinner) setIsLoading(false)
    }
  }, [])

  useFocusEffect(
    useCallback(() => {
      loadPlaces(!hasLoaded.current)
      hasLoaded.current = true
    }, [loadPlaces]),
  )

  if (isLoading) {
    return <LoadingOverlay message="Carregando pontos..." />
  }

  if (error) {
    return <ErrorMessage message={error} onRetry={() => loadPlaces(true)} />
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

- [ ] **Step 3: Verify (full suite)**

```powershell
npx tsc --noEmit
npm run lint
npm test
```

Expected: `tsc` clean; lint 0 errors (the single known `axios.create` warning is allowed); `npm test` shows 17 passing (haversine 3 + geofence 6 + placeSchema 8).

- [ ] **Step 4: Commit**

```powershell
git add "src/app/(tabs)/index.tsx" "src/app/(tabs)/explore.tsx"
git commit -m "Refetch points on focus so new ones appear"
```

---

## Milestone smoke test (manual, on a physical phone)

1. `npm run server` (Terminal 1) + `npx expo start` (Terminal 2); open in Expo Go.
2. **Adicionar** tab: submit with empty/invalid fields → per-field red error messages appear (name ≥3, description ≥20, radius 50–1000, valid URL).
3. Fill valid data (e.g. radius 60) and submit → success alert; tap "Ver no mapa".
4. The new point appears on **Mapa** (marker + circle) and on **Explorar** (card) because they refetch on focus.
5. Because the point is saved at your current location with a small radius, stepping just outside its radius and back in makes the **ProximityModal** pop automatically — the end-to-end geofence demo.

---

## Self-Review

- **Spec coverage (Requirement 3):** 6 fields — `name`, `description`, `category` (Picker), `radiusMeters`, `imageUrl`, `isActive` (Switch); `react-hook-form` + `zodResolver`; per-field error text under each input; POST via `createPlace`; success/error `Alert`; submit disabled while `isSubmitting`. ✓
- **Schema tests:** 8 cases (valid + each rule) built test-first. ✓
- **GPS capture:** uses live `coords`, falls back to `getCurrentPositionAsync`; sets `createdAt`. ✓
- **Focus refresh:** Mapa + Explorar use `useFocusEffect`; first focus shows the spinner (via `hasLoaded` ref), later focuses refresh silently — so a newly added point shows and can trigger the geofence. ✓
- **Type consistency:** `PlaceFormValues = z.infer<typeof placeSchema>` has `radiusMeters: string`; `DEFAULT_VALUES` matches it; the POST body converts `Number(values.radiusMeters)` and the rest map directly onto `PlaceInput = Omit<Place,'id'>` (from M2). `category` is `PlaceCategory`; `PLACE_CATEGORIES`/`CATEGORY_LABELS` come from `@/types/place`. `createPlace` is the existing M2 service. `useFocusEffect` is re-exported by `expo-router`. ✓
- **Placeholder scan:** every code step has complete contents; no TODO/TBD; no narrating comments. ✓
- **Deferred (correct):** Google Places + source filter (M5); `place/[id].tsx` google branch (M5).
