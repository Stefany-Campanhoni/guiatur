import { useCallback, useEffect, useState } from 'react'
import { StyleSheet, View } from 'react-native'
import MapView, { Circle, Marker, PROVIDER_GOOGLE } from 'react-native-maps'

import { ErrorMessage } from '@/components/ErrorMessage'
import { LoadingOverlay } from '@/components/LoadingOverlay'
import { COLORS } from '@/constants/theme'
import { fetchPlaces } from '@/services/jsonServer'
import { CATEGORY_LABELS, placeToMapPoint, type MapPoint } from '@/types/place'

const INITIAL_REGION = {
  latitude: -28.6775,
  longitude: -49.3697,
  latitudeDelta: 0.02,
  longitudeDelta: 0.02,
}

export default function MapScreen() {
  const [points, setPoints] = useState<MapPoint[]>([])
  const [isLoading, setIsLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  const loadPlaces = useCallback(async () => {
    setIsLoading(true)
    setError(null)
    try {
      const places = await fetchPlaces()
      setPoints(places.map(placeToMapPoint))
    } catch {
      setError('Não foi possível carregar os pontos.')
    } finally {
      setIsLoading(false)
    }
  }, [])

  useEffect(() => {
    loadPlaces()
  }, [loadPlaces])

  if (isLoading) {
    return <LoadingOverlay message="Carregando mapa..." />
  }

  if (error) {
    return <ErrorMessage message={error} onRetry={loadPlaces} />
  }

  const activePoints = points.filter((point) => point.isActive)

  return (
    <View style={styles.container}>
      <MapView provider={PROVIDER_GOOGLE} style={styles.map} initialRegion={INITIAL_REGION}>
        {activePoints.map((point) => (
          <Marker
            key={`marker-${point.id}`}
            coordinate={{ latitude: point.latitude, longitude: point.longitude }}
            title={point.name}
            description={point.category ? CATEGORY_LABELS[point.category] : undefined}
            pinColor={point.source === 'local' ? COLORS.rose : COLORS.periwinkle}
          />
        ))}
        {activePoints.map((point) => (
          <Circle
            key={`circle-${point.id}`}
            center={{ latitude: point.latitude, longitude: point.longitude }}
            radius={point.radiusMeters}
            strokeColor="rgba(196,122,151,0.6)"
            fillColor="rgba(232,160,180,0.2)"
          />
        ))}
      </MapView>
    </View>
  )
}

const styles = StyleSheet.create({
  container: { flex: 1 },
  map: { flex: 1 },
})
