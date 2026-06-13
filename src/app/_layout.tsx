import './global.css'

import { Nunito_400Regular, Nunito_600SemiBold, Nunito_700Bold, useFonts } from '@expo-google-fonts/nunito'
import { Stack } from 'expo-router'
import { StatusBar } from 'expo-status-bar'
import { ActivityIndicator, View } from 'react-native'

import { COLORS } from '@/constants/theme'
import { LiveLocationProvider } from '@/contexts/location'
import { LocationPermissionProvider } from '@/contexts/location-permission'

export default function RootLayout() {
  const [fontsLoaded] = useFonts({
    Nunito_400Regular,
    Nunito_600SemiBold,
    Nunito_700Bold,
  })

  if (!fontsLoaded) {
    return (
      <View className="flex-1 items-center justify-center bg-rose-subtle">
        <ActivityIndicator color={COLORS.roseDark} />
      </View>
    )
  }

  return (
    <>
      <StatusBar style="dark" />
      <LocationPermissionProvider>
        <LiveLocationProvider>
          <Stack
            screenOptions={{
              headerStyle: { backgroundColor: COLORS.roseSubtle },
              headerTintColor: COLORS.roseDark,
              headerTitleStyle: { fontFamily: 'Nunito_700Bold' },
              contentStyle: { backgroundColor: COLORS.roseSubtle },
            }}
          >
            <Stack.Screen name="(tabs)" options={{ headerShown: false }} />
            <Stack.Screen name="permissions" options={{ headerShown: false }} />
            <Stack.Screen name="place/[id]" options={{ title: 'Detalhes' }} />
          </Stack>
        </LiveLocationProvider>
      </LocationPermissionProvider>
    </>
  )
}
