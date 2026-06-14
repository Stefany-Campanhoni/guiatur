import { useFocusEffect, useRouter } from 'expo-router'
import { useCallback, useRef, useState } from 'react'
import { FlatList, Pressable, Text, View } from 'react-native'

import { ErrorMessage } from '@/components/ErrorMessage'
import { LoadingOverlay } from '@/components/LoadingOverlay'
import { PointCard } from '@/components/PointCard'
import { useLiveLocation } from '@/contexts/location'
import { fetchPlaces } from '@/services/jsonServer'
import { fetchNearbyGooglePlaces } from '@/services/placesApi'
import { placeToMapPoint, PlaceSource, type MapPoint } from '@/types/place'
import { haversineDistance } from '@/utils/haversine'

const INITIAL_CENTER = { latitude: -28.6775, longitude: -49.3697 }

type Filter = 'all' | PlaceSource

const FILTERS: { key: Filter; label: string }[] = [
  { key: 'all', label: 'Todos' },
  { key: PlaceSource.Local, label: 'Meus pontos' },
  { key: PlaceSource.Google, label: 'Google' },
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
