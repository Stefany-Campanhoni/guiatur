import { useRouter } from 'expo-router'
import { Pressable, Text, View } from 'react-native'

export default function ExploreScreen() {
  const router = useRouter()

  return (
    <View className="flex-1 bg-rose-subtle px-6 pt-6">
      <Text className="font-bold text-2xl text-rose-dark">Explorar</Text>
      <Text className="mt-2 font-sans text-base leading-6 text-ink-muted">
        Lista de pontos turísticos. (em construção)
      </Text>

      <Pressable
        className="mt-6 items-center rounded-2xl bg-rose px-5 py-4 active:bg-rose-dark"
        onPress={() => router.push({ pathname: '/place/[id]', params: { id: '1', source: 'local' } })}
      >
        <Text className="font-bold text-base text-white">Ver detalhes de exemplo</Text>
      </Pressable>
    </View>
  )
}
