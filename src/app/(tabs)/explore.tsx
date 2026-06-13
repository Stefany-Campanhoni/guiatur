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
