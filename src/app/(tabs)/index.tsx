import { GoogleMaps } from 'expo-maps'
import { useFocusEffect, useRouter } from 'expo-router'
import { useCallback, useRef, useState } from 'react'
import { StyleSheet, View } from 'react-native'

import { ErrorMessage } from '@/components/ErrorMessage'
import { LoadingOverlay } from '@/components/LoadingOverlay'
import { ProximityModal } from '@/components/ProximityModal'
import { useLiveLocation } from '@/contexts/location'
import { useGeofencing } from '@/hooks/useGeofencing'
import { fetchPlaces } from '@/services/jsonServer'
import { CATEGORY_LABELS, placeToMapPoint, type MapPoint } from '@/types/place'
import { haversineDistance } from '@/utils/haversine'

const CRICIUMA = { latitude: -28.6775, longitude: -49.3697 }

export default function MapScreen() {
  const router = useRouter()
  const { coords } = useLiveLocation()
  const [points, setPoints] = useState<MapPoint[]>([])
  const [isLoading, setIsLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const hasLoaded = useRef(false)

  const loadPlaces = useCallback(async (withSpinner: boolean) => {
    if (withSpinner) setIsLoading(true)
    setError(null)
    try {
      const places = await fetchPlaces()
      setPoints(places.map(placeToMapPoint))
    } catch {
      setError('Não foi possível carregar os pontos.')
    } finally {
      if (withSpinner) setIsLoading(false)
    }
  }, [])

  useFocusEffect(
    useCallback(() => {
      loadPlaces(!hasLoaded.current)
      hasLoaded.current = true
    }, [loadPlaces]),
  )

  const { nearbyPoint, dismiss } = useGeofencing(points, coords)

  if (isLoading) {
    return <LoadingOverlay message="Carregando mapa..." />
  }

  if (error) {
    return <ErrorMessage message={error} onRetry={() => loadPlaces(true)} />
  }

  const activePoints = points.filter((point) => point.isActive)
  const nearbyDistance = nearbyPoint && coords ? haversineDistance(coords, nearbyPoint) : null

  const markers = activePoints.map((point) => ({
    id: point.id,
    coordinates: { latitude: point.latitude, longitude: point.longitude },
    title: point.name,
    snippet: point.category ? CATEGORY_LABELS[point.category] : undefined,
  }))

  const circles = activePoints.map((point) => ({
    id: point.id,
    center: { latitude: point.latitude, longitude: point.longitude },
    radius: point.radiusMeters,
    color: 'rgba(232,160,180,0.2)',
    lineColor: 'rgba(196,122,151,0.6)',
    lineWidth: 2,
  }))

  return (
    <View style={styles.container}>
      <GoogleMaps.View
        style={styles.map}
        cameraPosition={{ coordinates: coords ?? CRICIUMA, zoom: 13 }}
        markers={markers}
        circles={circles}
        properties={{ isMyLocationEnabled: true }}
      />

      <ProximityModal
        point={nearbyPoint}
        distanceMeters={nearbyDistance}
        onDismiss={dismiss}
        onSeeDetails={(point) => {
          dismiss()
          router.push({ pathname: '/place/[id]', params: { id: point.id, source: point.source } })
        }}
      />
    </View>
  )
}

const styles = StyleSheet.create({
  container: { flex: 1 },
  map: { flex: 1 },
})
