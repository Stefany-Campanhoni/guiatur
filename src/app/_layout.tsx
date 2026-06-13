import './global.css'

import { Nunito_400Regular, Nunito_600SemiBold, Nunito_700Bold, useFonts } from '@expo-google-fonts/nunito'
import { Stack } from 'expo-router'
import { StatusBar } from 'expo-status-bar'
import { ActivityIndicator, View } from 'react-native'

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
        <ActivityIndicator color="#C47A97" />
      </View>
    )
  }

  return (
    <>
      <StatusBar style="dark" />
      <LocationPermissionProvider>
        <Stack
          screenOptions={{
            headerStyle: { backgroundColor: '#FDF0F5' },
            headerTintColor: '#C47A97',
            headerTitleStyle: { fontFamily: 'Nunito_700Bold' },
            contentStyle: { backgroundColor: '#FDF0F5' },
          }}
        >
          <Stack.Screen name="(tabs)" options={{ headerShown: false }} />
          <Stack.Screen name="permissions" options={{ headerShown: false }} />
          <Stack.Screen name="place/[id]" options={{ title: 'Detalhes' }} />
        </Stack>
      </LocationPermissionProvider>
    </>
  )
}
