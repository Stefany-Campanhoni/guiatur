import { Text, View } from 'react-native'

export default function HomeScreen() {
  return (
    <View className="flex-1 items-center justify-center bg-rose-subtle">
      <View className="bg-white rounded-3xl p-6 shadow-sm">
        <Text className="font-bold text-rose text-2xl">GuiaTur 🌸</Text>
        <Text className="font-sans text-ink-muted mt-1">NativeWind funcionando!</Text>
      </View>
    </View>
  )
}
