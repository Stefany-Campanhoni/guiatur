import './global.css'

import { Nunito_400Regular, Nunito_600SemiBold, Nunito_700Bold, useFonts } from '@expo-google-fonts/nunito'
import AntDesign from '@expo/vector-icons/AntDesign'
import Entypo from '@expo/vector-icons/Entypo'
import { Tabs } from 'expo-router'
import { StatusBar } from 'expo-status-bar'
import { ActivityIndicator, View } from 'react-native'

import { COLORS } from '@/constants/theme'
import { LiveLocationProvider } from '@/contexts/location'
import { LocationPermissionProvider, useLocationPermission } from '@/contexts/location-permission'

function RootTabs() {
  const { isGranted } = useLocationPermission()

  return (
    <Tabs
      screenOptions={{
        headerShown: false,
        tabBarActiveTintColor: COLORS.roseDark,
        tabBarInactiveTintColor: COLORS.inkMuted,
        tabBarLabelStyle: { fontFamily: 'Nunito_600SemiBold' },
        tabBarStyle: { backgroundColor: COLORS.sandLight, borderTopColor: COLORS.sand },
      }}
    >
      <Tabs.Screen name="permissions" options={{ href: null, tabBarStyle: { display: 'none' } }} />
      <Tabs.Protected guard={isGranted}>
        <Tabs.Screen
          name="index"
          options={{ title: 'Mapa', tabBarIcon: ({ color, size }) => <Entypo name="map" size={size} color={color} /> }}
        />
        <Tabs.Screen
          name="explore"
          options={{ title: 'Explorar', tabBarIcon: ({ color, size }) => <Entypo name="compass" size={size} color={color} /> }}
        />
        <Tabs.Screen
          name="add"
          options={{ title: 'Adicionar', tabBarIcon: ({ color, size }) => <AntDesign name="plus-circle" size={size} color={color} /> }}
        />
        <Tabs.Screen name="place/[id]" options={{ href: null, tabBarStyle: { display: 'none' } }} />
      </Tabs.Protected>
    </Tabs>
  )
}

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
          <RootTabs />
        </LiveLocationProvider>
      </LocationPermissionProvider>
    </>
  )
}
