import { Text, View } from 'react-native'

import { CATEGORY_LABELS, type PlaceCategory } from '@/types/place'

export function CategoryBadge({ category }: { category: PlaceCategory | null }) {
  if (!category) {
    return null
  }

  return (
    <View className="self-start rounded-full bg-sage-light px-3 py-1">
      <Text className="font-medium text-xs text-rose-dark">{CATEGORY_LABELS[category]}</Text>
    </View>
  )
}
