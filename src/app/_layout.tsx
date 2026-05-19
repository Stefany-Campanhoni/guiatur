import './global.css'

import { Nunito_400Regular, Nunito_600SemiBold, Nunito_700Bold, useFonts } from '@expo-google-fonts/nunito'
import AntDesign from '@expo/vector-icons/AntDesign'
import Entypo from '@expo/vector-icons/Entypo'
import { Tabs } from 'expo-router'
import { StatusBar } from 'expo-status-bar'
import { ActivityIndicator, View } from 'react-native'
import { LocationPermissionProvider } from '../contexts/location-permission'

const tabIcons = {
  welcome: require('../../assets/images/tabIcons/home.png'),
  content: require('../../assets/images/tabIcons/explore.png'),
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
        <ActivityIndicator color="#C47A97" />
      </View>
    )
  }

  return (
    <>
      <StatusBar style="dark" />
      <LocationPermissionProvider>
        <Tabs
          screenOptions={{
            headerStyle: { backgroundColor: '#FDF0F5' },
            headerTintColor: '#C47A97',
            headerTitleStyle: { fontFamily: 'Nunito_700Bold' },
            tabBarActiveTintColor: '#C47A97',
            tabBarInactiveTintColor: '#A890A0',
            tabBarLabelStyle: { fontFamily: 'Nunito_600SemiBold' },
            tabBarStyle: {
              backgroundColor: '#FAF4EC',
              borderTopColor: '#E8D8C4',
            },
          }}
        >
          <Tabs.Screen
            name="index"
            options={{
              title: 'Welcome',
              tabBarLabel: 'Home',
              tabBarIcon: ({ color, size }) => <AntDesign name="home" size={size} color={color} />,
            }}
          />
          <Tabs.Screen
            name="content"
            options={{
              title: 'GuiaTur',
              tabBarLabel: 'Content',
              tabBarIcon: ({ color, size }) => <Entypo name="map" size={size} color={color} />,
            }}
          />
        </Tabs>
      </LocationPermissionProvider>
    </>
  )
}
