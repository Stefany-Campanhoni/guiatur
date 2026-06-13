import { useLocalSearchParams } from 'expo-router'
import { Text, View } from 'react-native'

export default function PlaceDetailsScreen() {
  const { id, source } = useLocalSearchParams<{ id: string; source: string }>()

  return (
    <View className="flex-1 items-center justify-center bg-rose-subtle px-6">
      <View className="w-full rounded-3xl border border-sand bg-white p-6 shadow-sm">
        <Text className="font-bold text-2xl text-rose-dark">Detalhes do ponto</Text>
        <Text className="mt-3 font-medium text-base text-ink">id: {id}</Text>
        <Text className="mt-1 font-medium text-base text-ink">source: {source}</Text>
        <Text className="mt-3 font-sans text-sm leading-5 text-ink-muted">
          Foto, descrição histórica, distância em tempo real e &quot;Como chegar&quot;. (em construção)
        </Text>
      </View>
    </View>
  )
}
