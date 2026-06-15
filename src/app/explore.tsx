import { useRouter } from 'expo-router'
import { useState } from 'react'
import { FlatList, Pressable, Text, View } from 'react-native'
import { useSafeAreaInsets } from 'react-native-safe-area-context'

import { ErrorMessage } from '@/components/ErrorMessage'
import { LoadingOverlay } from '@/components/LoadingOverlay'
import { PointCard } from '@/components/PointCard'
import { useLiveLocation } from '@/contexts/location'
import { useMapPoints } from '@/hooks/usePlaces'
import { PlaceSource } from '@/types/place'
import { haversineDistance } from '@/utils/haversine'

type Filter = 'all' | PlaceSource

const FILTERS: { key: Filter; label: string }[] = [
  { key: 'all', label: 'Todos' },
  { key: PlaceSource.Local, label: 'Meus pontos' },
  { key: PlaceSource.Google, label: 'Google' },
]

export default function ExploreScreen() {
  const router = useRouter()
  const insets = useSafeAreaInsets()
  const { coords } = useLiveLocation()
  const { points, isLoading, isError, refetch } = useMapPoints(coords)
  const [filter, setFilter] = useState<Filter>('all')

  if (isLoading) {
    return <LoadingOverlay message="Carregando pontos..." />
  }

  if (isError) {
    return <ErrorMessage message="Não foi possível carregar os pontos. Verifique se o servidor está rodando." onRetry={refetch} />
  }

  const visiblePoints = filter === 'all' ? points : points.filter((point) => point.source === filter)

  return (
    <View className="flex-1 bg-rose-subtle">
      <FlatList
        data={visiblePoints}
        keyExtractor={(item) => `${item.source}-${item.id}`}
        contentContainerStyle={{ padding: 24, paddingTop: insets.top + 16 }}
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
