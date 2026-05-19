import { Pressable, Text, View } from 'react-native'

import { useLocationPermission } from '../contexts/location-permission'

export default function ContentScreen() {
  const { isGranted, requestPermission } = useLocationPermission()

  if (!isGranted) {
    return (
      <View className="flex-1 justify-center bg-rose-subtle px-6">
        <View className="rounded-3xl border border-sand bg-white p-6 shadow-sm">
          <Text className="font-bold text-2xl text-rose-dark">Content locked</Text>
          <Text className="mt-2 font-sans text-base leading-6 text-ink-muted">
            GuiaTur main content only appears after location access is enabled.
          </Text>

          <Pressable
            className="mt-6 items-center rounded-2xl bg-rose px-5 py-4 active:bg-rose-dark"
            onPress={requestPermission}
          >
            <Text className="font-bold text-base text-white">Allow location</Text>
          </Pressable>
        </View>
      </View>
    )
  }

  return (
    <View className="flex-1 items-center justify-center bg-rose-subtle px-6">
      <View className="w-full rounded-3xl border border-sand bg-white p-6 shadow-sm">
        <Text className="font-bold text-2xl text-rose-dark">GuiaTur</Text>
        <Text className="mt-1 font-sans text-ink-muted">NativeWind is working!</Text>

        <View className="mt-6 rounded-2xl bg-sand-light p-4">
          <Text className="font-medium text-base text-ink">Main content unlocked</Text>
          <Text className="mt-1 font-sans text-sm leading-5 text-ink-muted">
            This tab renders the real experience because location permission is active.
          </Text>
        </View>
      </View>
    </View>
  )
}
