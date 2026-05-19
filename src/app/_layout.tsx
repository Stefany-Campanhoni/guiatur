import './global.css'

import { Nunito_400Regular, Nunito_600SemiBold, Nunito_700Bold, useFonts } from '@expo-google-fonts/nunito'
import { Stack } from 'expo-router'
import { StatusBar } from 'expo-status-bar'
import { ActivityIndicator, View } from 'react-native'

export default function RootLayout() {
  const [fontsLoaded] = useFonts({
    Nunito_400Regular,
    Nunito_600SemiBold,
    Nunito_700Bold,
  })

  if (!fontsLoaded) {
    return (
      <View className="flex-1 items-center justify-center bg-rose-subtle">
        <ActivityIndicator color="#F43F8E" />
      </View>
    )
  }

  return (
    <>
      <StatusBar style="dark" />
      <Stack>
        <Stack.Screen
          name="index"
          options={{
            title: 'Detalhes',
            headerTintColor: '#F43F8E',
            headerStyle: { backgroundColor: '#FFF0F6' },
            headerBackTitle: 'Voltar',
          }}
        />
      </Stack>
    </>
  )
}
