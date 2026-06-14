import { Redirect } from 'expo-router'
import { Pressable, Text, View } from 'react-native'

import { useLocationPermission } from '@/contexts/location-permission'

export default function PermissionsScreen() {
  const { isGranted, permission, requestPermission } = useLocationPermission()

  if (isGranted) {
    return <Redirect href="/" />
  }

  const permissionWasDenied = permission?.status === 'denied'

  return (
    <View className="flex-1 justify-center bg-rose-subtle px-6">
      <View className="rounded-3xl border border-sand bg-white p-6 shadow-sm">
        <Text className="font-bold text-3xl text-rose-dark">GuiaTur</Text>
        <Text className="mt-2 font-sans text-base leading-6 text-ink-muted">
          Para mostrar pontos turísticos perto de você, o app precisa acessar sua localização.
        </Text>

        <View className="mt-6 rounded-2xl bg-sage-light p-4">
          <Text className="font-medium text-base text-ink">Libere o acesso à localização para começar.</Text>
          <Text className="mt-1 font-sans text-sm leading-5 text-ink-muted">
            Usamos sua posição apenas enquanto o app está aberto, para avisar quando você chegar perto de um ponto.
          </Text>
        </View>

        {permissionWasDenied ? (
          <Text className="mt-4 font-medium text-sm text-error">
            Permissão negada. Habilite nas configurações do dispositivo e tente novamente.
          </Text>
        ) : null}

        <Pressable
          className="mt-6 items-center rounded-2xl bg-rose px-5 py-4 active:bg-rose-dark"
          onPress={requestPermission}
        >
          <Text className="font-bold text-base text-white">
            {permissionWasDenied ? 'Tentar novamente' : 'Permitir localização'}
          </Text>
        </Pressable>
      </View>
    </View>
  )
}
