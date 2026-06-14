import { Image } from 'expo-image'
import { useLocalSearchParams, useRouter } from 'expo-router'
import { useCallback, useEffect, useState } from 'react'
import { Linking, Pressable, ScrollView, StyleSheet, Text, View } from 'react-native'
import MapView, { Marker, PROVIDER_GOOGLE } from 'react-native-maps'
import { useSafeAreaInsets } from 'react-native-safe-area-context'

import { CategoryBadge } from '@/components/CategoryBadge'
import { DistanceBadge } from '@/components/DistanceBadge'
import { ErrorMessage } from '@/components/ErrorMessage'
import { LoadingOverlay } from '@/components/LoadingOverlay'
import { useLiveLocation } from '@/contexts/location'
import { fetchPlace } from '@/services/jsonServer'
import { fetchGooglePlaceDetails } from '@/services/placesApi'
import { PlaceSource, type PlaceCategory } from '@/types/place'
import { haversineDistance } from '@/utils/haversine'

type DetailView = {
  name: string
  description: string
  imageUrl: string | null
  category: PlaceCategory | null
  customCategory: string | null
  rating: number | null
  latitude: number
  longitude: number
}

export default function PlaceDetailsScreen() {
  const router = useRouter()
  const insets = useSafeAreaInsets()
  const { id, source } = useLocalSearchParams<{ id: string; source: string }>()
  const { coords } = useLiveLocation()
  const [detail, setDetail] = useState<DetailView | null>(null)
  const [isLoading, setIsLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  const loadDetail = useCallback(async () => {
    setIsLoading(true)
    setError(null)
    try {
      if (source === PlaceSource.Google) {
        const place = await fetchGooglePlaceDetails(id)
        setDetail({
          name: place.name,
          description: place.description,
          imageUrl: place.imageUrl,
          category: null,
          customCategory: null,
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
          customCategory: place.customCategory ?? null,
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
    <ScrollView className="flex-1 bg-rose-subtle" contentContainerStyle={{ padding: 20, paddingTop: insets.top + 12 }}>
      <Pressable className="mb-3 self-start rounded-full px-3 py-2 active:opacity-70" onPress={() => router.back()}>
        <Text className="font-medium text-base text-rose-dark">← Voltar</Text>
      </Pressable>

      {detail.imageUrl ? (
        <Image source={{ uri: detail.imageUrl }} style={styles.hero} contentFit="cover" transition={200} />
      ) : null}

      <View className="mt-4 flex-row items-center gap-2">
        <CategoryBadge category={detail.category} customCategory={detail.customCategory} />
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
