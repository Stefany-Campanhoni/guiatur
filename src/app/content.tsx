import { Fallback } from '@/components/Fallback'

import { View } from 'react-native'
import MapView from 'react-native-maps'
import { useLocationPermission } from '../contexts/location-permission'

export default function ContentScreen() {
  const { isGranted } = useLocationPermission()

  if (!isGranted) {
    return <Fallback />
  }

  return (
    <View className="flex-1 items-center justify-center bg-rose-subtle px-6">
      <MapView style={{ flex: 1 }} />
    </View>
  )
}
