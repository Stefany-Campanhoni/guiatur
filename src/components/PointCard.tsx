import { Image } from 'expo-image'
import { Pressable, Text, View } from 'react-native'

import { CategoryBadge } from '@/components/CategoryBadge'
import { DistanceBadge } from '@/components/DistanceBadge'
import type { MapPoint } from '@/types/place'

type PointCardProps = {
  point: MapPoint
  onPress: () => void
  distanceMeters?: number | null
}

export function PointCard({ point, onPress, distanceMeters = null }: PointCardProps) {
  return (
    <Pressable
      className="mb-3 overflow-hidden rounded-3xl border border-sand bg-white shadow-sm active:opacity-80"
      onPress={onPress}
    >
      {point.imageUrl ? (
        <Image source={{ uri: point.imageUrl }} style={{ width: '100%', height: 140 }} contentFit="cover" transition={200} />
      ) : null}
      <View className="p-4">
        <View className="flex-row gap-2">
          <CategoryBadge category={point.category} customCategory={point.customCategory} />
          {distanceMeters !== null ? <DistanceBadge meters={distanceMeters} /> : null}
        </View>
        <Text className="mt-2 font-bold text-lg text-ink">{point.name}</Text>
      </View>
    </Pressable>
  )
}
