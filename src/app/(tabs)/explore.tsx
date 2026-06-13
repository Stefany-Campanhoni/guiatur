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
