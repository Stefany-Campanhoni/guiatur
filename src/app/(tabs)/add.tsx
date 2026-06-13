import { Text, View } from 'react-native'

export default function AddScreen() {
  return (
    <View className="flex-1 items-center justify-center bg-rose-subtle px-6">
      <View className="w-full rounded-3xl border border-sand bg-white p-6 shadow-sm">
        <Text className="font-bold text-2xl text-rose-dark">Adicionar ponto</Text>
        <Text className="mt-2 font-sans text-base leading-6 text-ink-muted">
          Formulário de cadastro com validação. (em construção)
        </Text>
      </View>
    </View>
  )
}
