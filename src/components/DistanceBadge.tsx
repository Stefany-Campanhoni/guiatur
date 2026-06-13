import { Text, View } from 'react-native'

export function formatDistance(meters: number): string {
  if (meters < 1000) {
    return `${Math.round(meters)} m`
  }
  return `${(meters / 1000).toFixed(1)} km`
}

export function DistanceBadge({ meters }: { meters: number }) {
  return (
    <View className="self-start rounded-full bg-rose-light px-3 py-1">
      <Text className="font-medium text-xs text-rose-dark">{formatDistance(meters)}</Text>
    </View>
  )
}
