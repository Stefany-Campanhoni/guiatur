import { Text, View } from 'react-native'

import { categoryLabel, type PlaceCategory } from '@/types/place'

type CategoryBadgeProps = {
  category: PlaceCategory | null
  customCategory?: string | null
}

export function CategoryBadge({ category, customCategory }: CategoryBadgeProps) {
  const label = categoryLabel(category, customCategory)
  if (!label) {
    return null
  }

  return (
    <View className="self-start rounded-full bg-sage-light px-3 py-1">
      <Text className="font-medium text-xs text-rose-dark">{label}</Text>
    </View>
  )
}
