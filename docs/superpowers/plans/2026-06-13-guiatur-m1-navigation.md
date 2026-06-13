# GuiaTur M1 — Navigation Skeleton Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Restructure the current 2-tab app into the spec's navigation: a permission gate, a 3-tab bottom navigator (Mapa · Explorar · Adicionar), and a stack-pushed Details screen — all rendering themed placeholders.

**Architecture:** expo-router file-based routing. Root layout becomes a `Stack` wrapping the `(tabs)` group, the `permissions` gate, and `place/[id]`. The `(tabs)` layout redirects to `/permissions` until foreground location permission is granted; the `permissions` screen redirects back to `/(tabs)` once granted. Details is reached from Explorar via a stack push carrying `id` + `source` params.

**Tech Stack:** Expo 55, expo-router (typed routes), react-native, NativeWind (existing pink theme), @expo/vector-icons.

**Testing note:** This milestone is structural/UI only and the repo has no test runner. It is verified by `expo lint`, `tsc --noEmit`, and a manual navigation smoke test. Automated unit tests begin in M3 (Haversine) once `jest-expo` is set up. M1 runs in Expo Go (no native map module is imported yet).

**Git note:** Run all git commands in the terminal (PowerShell). Commit messages must NOT include any Co-Authored-By / Claude attribution.

---

## File Structure (end state)

```
src/app/
  _layout.tsx          # MODIFY: Tabs -> Stack; provider + 3 stack screens
  permissions.tsx      # CREATE: permission gate (redirects to /(tabs) when granted)
  (tabs)/
    _layout.tsx        # CREATE: bottom Tabs; redirects to /permissions when not granted
    index.tsx          # CREATE: Mapa placeholder
    explore.tsx        # CREATE: Explorar placeholder + push to details
    add.tsx            # CREATE: Adicionar placeholder
  place/[id].tsx       # CREATE: Detalhes placeholder, reads id + source params
  index.tsx            # DELETE (welcome content moves into permissions.tsx)
  content.tsx          # DELETE (map placeholder moves into (tabs)/index.tsx)
src/components/
  Fallback.tsx         # DELETE (gate redirect replaces it)
```

Because the old `index.tsx` and new `(tabs)/index.tsx` both resolve to `/`, the restructure is atomic: it lands as a single commit (Task 1). Steps inside are bite-sized; verification + commit happen at the end.

---

## Task 1: Restructure navigation into tabs + gate + details

**Files:**
- Create: `src/app/permissions.tsx`
- Create: `src/app/(tabs)/_layout.tsx`
- Create: `src/app/(tabs)/index.tsx`
- Create: `src/app/(tabs)/explore.tsx`
- Create: `src/app/(tabs)/add.tsx`
- Create: `src/app/place/[id].tsx`
- Modify: `src/app/_layout.tsx`
- Delete: `src/app/index.tsx`, `src/app/content.tsx`, `src/components/Fallback.tsx`

- [ ] **Step 1: Create the permission gate screen**

Create `src/app/permissions.tsx`:

```tsx
import { Redirect } from 'expo-router'
import { Pressable, Text, View } from 'react-native'

import { useLocationPermission } from '@/contexts/location-permission'

export default function PermissionsScreen() {
  const { isGranted, permission, requestPermission } = useLocationPermission()

  if (isGranted) {
    return <Redirect href="/(tabs)" />
  }

  const permissionWasDenied = permission?.status === 'denied'

  return (
    <View className="flex-1 justify-center bg-rose-subtle px-6">
      <View className="rounded-3xl border border-sand bg-white p-6 shadow-sm">
        <Text className="font-bold text-3xl text-rose-dark">GuiaTur</Text>
        <Text className="mt-2 font-sans text-base leading-6 text-ink-muted">
          Para mostrar pontos turísticos perto de você, o app precisa acessar sua localização.
        </Text>

        <View className="mt-6 rounded-2xl bg-sage-light p-4">
          <Text className="font-medium text-base text-ink">Libere o acesso à localização para começar.</Text>
          <Text className="mt-1 font-sans text-sm leading-5 text-ink-muted">
            Usamos sua posição apenas enquanto o app está aberto, para avisar quando você chegar perto de um ponto.
          </Text>
        </View>

        {permissionWasDenied ? (
          <Text className="mt-4 font-medium text-sm text-error">
            Permissão negada. Habilite nas configurações do dispositivo e tente novamente.
          </Text>
        ) : null}

        <Pressable
          className="mt-6 items-center rounded-2xl bg-rose px-5 py-4 active:bg-rose-dark"
          onPress={requestPermission}
        >
          <Text className="font-bold text-base text-white">
            {permissionWasDenied ? 'Tentar novamente' : 'Permitir localização'}
          </Text>
        </Pressable>
      </View>
    </View>
  )
}
```

- [ ] **Step 2: Create the tab group layout**

Create `src/app/(tabs)/_layout.tsx`:

```tsx
import AntDesign from '@expo/vector-icons/AntDesign'
import Entypo from '@expo/vector-icons/Entypo'
import { Redirect, Tabs } from 'expo-router'

import { useLocationPermission } from '@/contexts/location-permission'

export default function TabsLayout() {
  const { isGranted } = useLocationPermission()

  if (!isGranted) {
    return <Redirect href="/permissions" />
  }

  return (
    <Tabs
      screenOptions={{
        headerStyle: { backgroundColor: '#FDF0F5' },
        headerTintColor: '#C47A97',
        headerTitleStyle: { fontFamily: 'Nunito_700Bold' },
        tabBarActiveTintColor: '#C47A97',
        tabBarInactiveTintColor: '#A890A0',
        tabBarLabelStyle: { fontFamily: 'Nunito_600SemiBold' },
        tabBarStyle: { backgroundColor: '#FAF4EC', borderTopColor: '#E8D8C4' },
      }}
    >
      <Tabs.Screen
        name="index"
        options={{
          title: 'Mapa',
          tabBarIcon: ({ color, size }) => <Entypo name="map" size={size} color={color} />,
        }}
      />
      <Tabs.Screen
        name="explore"
        options={{
          title: 'Explorar',
          tabBarIcon: ({ color, size }) => <Entypo name="compass" size={size} color={color} />,
        }}
      />
      <Tabs.Screen
        name="add"
        options={{
          title: 'Adicionar',
          tabBarIcon: ({ color, size }) => <AntDesign name="pluscircleo" size={size} color={color} />,
        }}
      />
    </Tabs>
  )
}
```

- [ ] **Step 3: Create the Mapa tab placeholder**

Create `src/app/(tabs)/index.tsx`:

```tsx
import { Text, View } from 'react-native'

export default function MapScreen() {
  return (
    <View className="flex-1 items-center justify-center bg-rose-subtle px-6">
      <View className="w-full rounded-3xl border border-sand bg-white p-6 shadow-sm">
        <Text className="font-bold text-2xl text-rose-dark">Mapa</Text>
        <Text className="mt-2 font-sans text-base leading-6 text-ink-muted">
          Aqui vai o mapa com os pontos turísticos e os círculos de geofence. (em construção)
        </Text>
      </View>
    </View>
  )
}
```

- [ ] **Step 4: Create the Explorar tab placeholder (pushes to details)**

Create `src/app/(tabs)/explore.tsx`:

```tsx
import { useRouter } from 'expo-router'
import { Pressable, Text, View } from 'react-native'

export default function ExploreScreen() {
  const router = useRouter()

  return (
    <View className="flex-1 bg-rose-subtle px-6 pt-6">
      <Text className="font-bold text-2xl text-rose-dark">Explorar</Text>
      <Text className="mt-2 font-sans text-base leading-6 text-ink-muted">
        Lista de pontos turísticos. (em construção)
      </Text>

      <Pressable
        className="mt-6 items-center rounded-2xl bg-rose px-5 py-4 active:bg-rose-dark"
        onPress={() => router.push({ pathname: '/place/[id]', params: { id: '1', source: 'local' } })}
      >
        <Text className="font-bold text-base text-white">Ver detalhes de exemplo</Text>
      </Pressable>
    </View>
  )
}
```

- [ ] **Step 5: Create the Adicionar tab placeholder**

Create `src/app/(tabs)/add.tsx`:

```tsx
import { Text, View } from 'react-native'

export default function AddScreen() {
  return (
    <View className="flex-1 items-center justify-center bg-rose-subtle px-6">
      <View className="w-full rounded-3xl border border-sand bg-white p-6 shadow-sm">
        <Text className="font-bold text-2xl text-rose-dark">Adicionar ponto</Text>
        <Text className="mt-2 font-sans text-base leading-6 text-ink-muted">
          Formulário de cadastro com validação. (em construção)
        </Text>
      </View>
    </View>
  )
}
```

- [ ] **Step 6: Create the Details stack screen**

Create `src/app/place/[id].tsx`:

```tsx
import { useLocalSearchParams } from 'expo-router'
import { Text, View } from 'react-native'

export default function PlaceDetailsScreen() {
  const { id, source } = useLocalSearchParams<{ id: string; source: string }>()

  return (
    <View className="flex-1 items-center justify-center bg-rose-subtle px-6">
      <View className="w-full rounded-3xl border border-sand bg-white p-6 shadow-sm">
        <Text className="font-bold text-2xl text-rose-dark">Detalhes do ponto</Text>
        <Text className="mt-3 font-medium text-base text-ink">id: {id}</Text>
        <Text className="mt-1 font-medium text-base text-ink">source: {source}</Text>
        <Text className="mt-3 font-sans text-sm leading-5 text-ink-muted">
          Foto, descrição histórica, distância em tempo real e &quot;Como chegar&quot;. (em construção)
        </Text>
      </View>
    </View>
  )
}
```

- [ ] **Step 7: Rewire the root layout from Tabs to Stack**

Replace the entire contents of `src/app/_layout.tsx` with:

```tsx
import './global.css'

import { Nunito_400Regular, Nunito_600SemiBold, Nunito_700Bold, useFonts } from '@expo-google-fonts/nunito'
import { Stack } from 'expo-router'
import { StatusBar } from 'expo-status-bar'
import { ActivityIndicator, View } from 'react-native'

import { LocationPermissionProvider } from '@/contexts/location-permission'

export default function RootLayout() {
  const [fontsLoaded] = useFonts({
    Nunito_400Regular,
    Nunito_600SemiBold,
    Nunito_700Bold,
  })

  if (!fontsLoaded) {
    return (
      <View className="flex-1 items-center justify-center bg-rose-subtle">
        <ActivityIndicator color="#C47A97" />
      </View>
    )
  }

  return (
    <>
      <StatusBar style="dark" />
      <LocationPermissionProvider>
        <Stack
          screenOptions={{
            headerStyle: { backgroundColor: '#FDF0F5' },
            headerTintColor: '#C47A97',
            headerTitleStyle: { fontFamily: 'Nunito_700Bold' },
            contentStyle: { backgroundColor: '#FDF0F5' },
          }}
        >
          <Stack.Screen name="(tabs)" options={{ headerShown: false }} />
          <Stack.Screen name="permissions" options={{ headerShown: false }} />
          <Stack.Screen name="place/[id]" options={{ title: 'Detalhes' }} />
        </Stack>
      </LocationPermissionProvider>
    </>
  )
}
```

- [ ] **Step 8: Delete the obsolete screens and component**

In the terminal (PowerShell), from the worktree root:

```powershell
Remove-Item src\app\index.tsx, src\app\content.tsx, src\components\Fallback.tsx
```

- [ ] **Step 9: Generate route types, then typecheck and lint**

In the terminal (PowerShell), from the worktree root:

```powershell
npx expo export --platform web --output-dir .expo-export-check
```

Expected: export succeeds (this also generates the typed-route definitions under `.expo/types/`). Then:

```powershell
Remove-Item -Recurse -Force .expo-export-check
npx tsc --noEmit
npm run lint
```

Expected: `tsc` prints nothing (exit 0) and `lint` reports no errors. If `tsc` complains that hrefs like `/permissions` are not valid routes, it means route types were not generated — re-run the `expo export` line above, then re-run `tsc`.

- [ ] **Step 10: Manual navigation smoke test**

In the terminal (PowerShell): `npx expo start`. In Expo Go (or a dev build) confirm:
1. App opens on the **Permissões** screen (location not yet granted) showing the GuiaTur card and "Permitir localização".
2. Tapping it triggers the OS permission prompt; granting it reveals the **bottom tabs** (Mapa · Explorar · Adicionar).
3. **Mapa** and **Adicionar** show their themed placeholders.
4. From **Explorar**, "Ver detalhes de exemplo" pushes the **Detalhes** screen showing `id: 1` and `source: local`, with a working back button.
5. The whole UI uses the existing pink theme (rose header, cream tab bar).

- [ ] **Step 11: Commit**

In the terminal (PowerShell), from the worktree root:

```powershell
git add -A
git commit -m "Restructure navigation into tabs, permission gate, and details stack"
```

---

## Self-Review

- **Spec coverage (Requirement 2):** 5 screens present — Permissões (`permissions.tsx`), Mapa (`(tabs)/index.tsx`), Explorar (`(tabs)/explore.tsx`), Detalhes (`place/[id].tsx`), Adicionar (`(tabs)/add.tsx`). Bottom Tabs + Stack push with `id` + `source` params. Permission gate redirects both directions. ✓
- **Theme:** Every screen reuses the existing `rose`/`sand`/`sage`/`ink` classes and Nunito fonts. ✓
- **Deferred to later milestones (correctly out of M1 scope):** real map + markers + circles (M2), data/services (M2), geofencing + ProximityModal + live distance (M3), the Zod form (M4), `.env`/`app.config.ts` fixes (M2).
- **Type consistency:** `useLocationPermission()` returns `{ isGranted, permission, requestPermission }` — matches the existing context in `src/contexts/location-permission.tsx`. Route hrefs (`/permissions`, `/(tabs)`, `/place/[id]`) match the created files. ✓
- **Placeholder scan:** "(em construção)" strings are intentional visible UI copy for skeleton screens, not plan placeholders; every code step contains complete file contents. ✓
