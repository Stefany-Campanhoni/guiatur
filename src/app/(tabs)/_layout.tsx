import AntDesign from '@expo/vector-icons/AntDesign'
import Entypo from '@expo/vector-icons/Entypo'
import { Redirect, Tabs } from 'expo-router'

import { useLocationPermission } from '@/contexts/location-permission'

export default function TabsLayout() {
  const { isGranted } = useLocationPermission()

  if (!isGranted) {
    return <Redirect href="/permissions" />
  }

  return (
    <Tabs
      screenOptions={{
        headerStyle: { backgroundColor: '#FDF0F5' },
        headerTintColor: '#C47A97',
        headerTitleStyle: { fontFamily: 'Nunito_700Bold' },
        tabBarActiveTintColor: '#C47A97',
        tabBarInactiveTintColor: '#A890A0',
        tabBarLabelStyle: { fontFamily: 'Nunito_600SemiBold' },
        tabBarStyle: { backgroundColor: '#FAF4EC', borderTopColor: '#E8D8C4' },
      }}
    >
      <Tabs.Screen
        name="index"
        options={{
          title: 'Mapa',
          tabBarIcon: ({ color, size }) => <Entypo name="map" size={size} color={color} />,
        }}
      />
      <Tabs.Screen
        name="explore"
        options={{
          title: 'Explorar',
          tabBarIcon: ({ color, size }) => <Entypo name="compass" size={size} color={color} />,
        }}
      />
      <Tabs.Screen
        name="add"
        options={{
          title: 'Adicionar',
          tabBarIcon: ({ color, size }) => <AntDesign name="plus-circle" size={size} color={color} />,
        }}
      />
    </Tabs>
  )
}
