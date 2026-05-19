import { Pressable, Text, View } from 'react-native'

import { useLocationPermission } from '../contexts/location-permission'

export default function HomeScreen() {
  const { isGranted, permission, requestPermission } = useLocationPermission()
  const permissionWasDenied = permission?.status === 'denied'

  return (
    <View className="flex-1 justify-center bg-rose-subtle px-6">
      <View className="rounded-3xl border border-sand bg-white p-6 shadow-sm">
        <Text className="font-bold text-3xl text-rose-dark">GuiaTur</Text>
        <Text className="mt-2 font-sans text-base leading-6 text-ink-muted">
          To show recommendations near you, the app needs access to your location.
        </Text>

        <View className="mt-6 rounded-2xl bg-sage-light p-4">
          <Text className="font-medium text-base text-ink">
            {isGranted ? 'Location access is enabled.' : 'Allow location access to unlock the content.'}
          </Text>
          <Text className="mt-1 font-sans text-sm leading-5 text-ink-muted">
            {isGranted
              ? 'The Content tab can now render the main experience.'
              : 'You can grant access now and keep using GuiaTur through the tabs.'}
          </Text>
        </View>

        {permissionWasDenied ? (
          <Text className="mt-4 font-medium text-sm text-error">
            Permission was denied. To enable it later, update your device settings.
          </Text>
        ) : null}

        <Pressable
          className="mt-6 items-center rounded-2xl bg-rose px-5 py-4 active:bg-rose-dark"
          onPress={requestPermission}
        >
          <Text className="font-bold text-base text-white">{isGranted ? 'Permission granted' : 'Allow location'}</Text>
        </Pressable>
      </View>
    </View>
  )
}
