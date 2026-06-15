import { useQuery } from '@tanstack/react-query'
import { useMemo } from 'react'

import type { Coords } from '@/contexts/location'
import { fetchPlaces } from '@/services/jsonServer'
import { fetchNearbyGooglePlaces } from '@/services/placesApi'
import { placeToMapPoint, type MapPoint } from '@/types/place'

const NEARBY_TTL_MS = 5 * 60 * 1000
const FALLBACK_CENTER: Coords = { latitude: -28.6775, longitude: -49.3697 }

export const LOCAL_PLACES_KEY = ['places', 'local'] as const

function nearbyKey(center: Coords) {
  return ['places', 'nearby', center.latitude.toFixed(3), center.longitude.toFixed(3)]
}

export function useMapPoints(center: Coords | null) {
  const resolved = center ?? FALLBACK_CENTER

  const local = useQuery({
    queryKey: LOCAL_PLACES_KEY,
    queryFn: async () => (await fetchPlaces()).map(placeToMapPoint),
  })

  const nearby = useQuery({
    queryKey: nearbyKey(resolved),
    queryFn: () => fetchNearbyGooglePlaces(resolved),
    staleTime: NEARBY_TTL_MS,
    gcTime: NEARBY_TTL_MS,
  })

  const points = useMemo<MapPoint[]>(
    () => [...(local.data ?? []), ...(nearby.data ?? [])],
    [local.data, nearby.data],
  )

  return {
    points,
    isLoading: local.isLoading,
    isError: local.isError,
    refetch: () => {
      void local.refetch()
      void nearby.refetch()
    },
  }
}
