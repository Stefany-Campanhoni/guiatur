import { useRouter } from 'expo-router'
import { useRef, useState } from 'react'
import { Pressable, StyleSheet, Text, TextInput, View } from 'react-native'
import MapView, { Circle, Marker, PROVIDER_GOOGLE } from 'react-native-maps'
import { useSafeAreaInsets } from 'react-native-safe-area-context'

import { ErrorMessage } from '@/components/ErrorMessage'
import { LoadingOverlay } from '@/components/LoadingOverlay'
import { ProximityModal } from '@/components/ProximityModal'
import { COLORS } from '@/constants/theme'
import { useLiveLocation } from '@/contexts/location'
import { useGeofencing } from '@/hooks/useGeofencing'
import { useMapPoints } from '@/hooks/usePlaces'
import { searchGooglePlaces } from '@/services/placesApi'
import { categoryLabel, PlaceSource, type MapPoint } from '@/types/place'
import { haversineDistance } from '@/utils/haversine'

const CRICIUMA = { latitude: -28.6775, longitude: -49.3697 }
const INITIAL_REGION = { ...CRICIUMA, latitudeDelta: 0.02, longitudeDelta: 0.02 }

export default function MapScreen() {
  const router = useRouter()
  const insets = useSafeAreaInsets()
  const { coords } = useLiveLocation()
  const mapRef = useRef<MapView>(null)
  const { points, isLoading, isError, refetch } = useMapPoints(coords)
  const [searchResults, setSearchResults] = useState<MapPoint[]>([])
  const [query, setQuery] = useState('')
  const [isSearching, setIsSearching] = useState(false)

  const onSearch = async () => {
    if (!query.trim()) {
      setSearchResults([])
      return
    }
    setIsSearching(true)
    const results = await searchGooglePlaces(query, coords ?? CRICIUMA)
    setSearchResults(results)
    setIsSearching(false)
    const first = results[0]
    if (first) {
      mapRef.current?.animateToRegion(
        { latitude: first.latitude, longitude: first.longitude, latitudeDelta: 0.05, longitudeDelta: 0.05 },
        500,
      )
    }
  }

  const { nearbyPoint, dismiss } = useGeofencing(points, coords)

  if (isLoading) {
    return <LoadingOverlay message="Carregando mapa..." />
  }

  if (isError) {
    return <ErrorMessage message="Não foi possível carregar os pontos." onRetry={refetch} />
  }

  const activePoints = points.filter((point) => point.isActive)
  const localPoints = activePoints.filter((point) => point.source === PlaceSource.Local)
  const nearbyDistance = nearbyPoint && coords ? haversineDistance(coords, nearbyPoint) : null

  return (
    <View style={[styles.container, { paddingTop: insets.top + 8 }]}>
      <View className="px-5 pb-2">
        <Text className="mb-2 font-bold text-2xl text-rose-dark">Mapa</Text>
        <View className="flex-row gap-2">
          <TextInput
            className="flex-1 rounded-2xl border border-sand bg-white px-4 py-2 font-sans text-base text-ink"
            placeholder="Buscar no Google Places..."
            placeholderTextColor={COLORS.inkMuted}
            value={query}
            onChangeText={setQuery}
            onSubmitEditing={onSearch}
            returnKeyType="search"
            autoCapitalize="none"
          />
          <Pressable className="items-center justify-center rounded-2xl bg-rose px-4 active:bg-rose-dark" onPress={onSearch}>
            <Text className="font-bold text-sm text-white">{isSearching ? '...' : 'Buscar'}</Text>
          </Pressable>
        </View>
      </View>

      <View style={styles.mapWrapper}>
        <MapView ref={mapRef} provider={PROVIDER_GOOGLE} style={styles.map} initialRegion={INITIAL_REGION} showsUserLocation>
          {activePoints.map((point) => (
            <Marker
              key={`marker-${point.source}-${point.id}`}
              coordinate={{ latitude: point.latitude, longitude: point.longitude }}
              title={point.name}
              description={categoryLabel(point.category, point.customCategory) ?? 'Google Places'}
              pinColor={point.source === PlaceSource.Local ? (point.pinColor ?? COLORS.rose) : COLORS.periwinkle}
              onCalloutPress={() => router.push({ pathname: '/place/[id]', params: { id: point.id, source: point.source } })}
            />
          ))}
          {searchResults.map((point) => (
            <Marker
              key={`search-${point.id}`}
              coordinate={{ latitude: point.latitude, longitude: point.longitude }}
              title={point.name}
              description="Resultado da busca"
              pinColor={COLORS.roseDark}
              onCalloutPress={() => router.push({ pathname: '/place/[id]', params: { id: point.id, source: point.source } })}
            />
          ))}
          {localPoints.map((point) => (
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
  container: { flex: 1, backgroundColor: COLORS.roseSubtle },
  mapWrapper: { flex: 1, marginHorizontal: 16, marginBottom: 16, borderRadius: 24, overflow: 'hidden', borderWidth: 1, borderColor: COLORS.sand },
  map: { flex: 1 },
})
