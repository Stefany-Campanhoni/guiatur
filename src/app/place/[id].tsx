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
