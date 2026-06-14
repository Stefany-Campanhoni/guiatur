import { Pressable, Text, View } from 'react-native'
import MapView, { Circle, Marker, PROVIDER_GOOGLE } from 'react-native-maps'

import { COLORS } from '@/constants/theme'
import type { Coords } from '@/contexts/location'
import { haversineDistance } from '@/utils/haversine'

const MAX_DISTANCE_METERS = 30

function clampToRadius(origin: Coords, target: Coords): Coords {
  const distance = haversineDistance(origin, target)
  if (distance <= MAX_DISTANCE_METERS) {
    return target
  }
  const ratio = MAX_DISTANCE_METERS / distance
  return {
    latitude: origin.latitude + (target.latitude - origin.latitude) * ratio,
    longitude: origin.longitude + (target.longitude - origin.longitude) * ratio,
  }
}

type LocationPickerProps = {
  label: string
  origin: Coords | null
  value: Coords | null
  onChange: (coords: Coords) => void
  onInteractStart?: () => void
  onInteractEnd?: () => void
}

export function LocationPicker({ label, origin, value, onChange, onInteractStart, onInteractEnd }: LocationPickerProps) {
  if (!origin || !value) {
    return (
      <View className="mb-4">
        <Text className="mb-1 font-medium text-sm text-ink">{label}</Text>
        <View className="rounded-2xl border border-sand bg-white px-4 py-6">
          <Text className="text-center font-sans text-sm text-ink-muted">Aguardando sua localização...</Text>
        </View>
      </View>
    )
  }

  return (
    <View className="mb-4">
      <Text className="mb-1 font-medium text-sm text-ink">{label}</Text>
      <Text className="mb-2 font-sans text-xs text-ink-muted">
        Dê zoom, toque ou arraste o pino (até {MAX_DISTANCE_METERS} m da sua localização).
      </Text>
      <View
        style={{ height: 240, borderRadius: 16, overflow: 'hidden', borderWidth: 1, borderColor: COLORS.sand }}
        onTouchStart={onInteractStart}
        onTouchEnd={onInteractEnd}
        onTouchCancel={onInteractEnd}
      >
        <MapView
          provider={PROVIDER_GOOGLE}
          style={{ flex: 1 }}
          initialRegion={{ latitude: origin.latitude, longitude: origin.longitude, latitudeDelta: 0.001, longitudeDelta: 0.001 }}
          rotateEnabled={false}
          pitchEnabled={false}
          onPress={(event) => onChange(clampToRadius(origin, event.nativeEvent.coordinate))}
        >
          <Circle center={origin} radius={MAX_DISTANCE_METERS} strokeColor="rgba(196,122,151,0.6)" fillColor="rgba(232,160,180,0.2)" />
          <Marker
            coordinate={value}
            draggable
            pinColor={COLORS.rose}
            onDragEnd={(event) => onChange(clampToRadius(origin, event.nativeEvent.coordinate))}
          />
        </MapView>
      </View>
      <View className="mt-2 flex-row items-center justify-between">
        <Text className="font-sans text-xs text-ink-muted">{Math.round(haversineDistance(origin, value))} m do ponto atual</Text>
        <Pressable className="rounded-full bg-sage-light px-3 py-2 active:opacity-70" onPress={() => onChange(origin)}>
          <Text className="font-medium text-xs text-rose-dark">Usar localização atual</Text>
        </Pressable>
      </View>
    </View>
  )
}
