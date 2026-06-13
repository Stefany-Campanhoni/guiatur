import { useCallback, useEffect, useRef, useState } from 'react'

import type { Coords } from '@/contexts/location'
import type { MapPoint } from '@/types/place'
import { findNewlyEnteredPoint } from '@/utils/geofence'

/**
 * Watches the user's coords against a set of points and surfaces the next
 * point whose geofence they enter, firing once per point per session.
 */
export function useGeofencing(points: MapPoint[], coords: Coords | null) {
  const [nearbyPoint, setNearbyPoint] = useState<MapPoint | null>(null)
  const triggeredIds = useRef<Set<string>>(new Set())

  useEffect(() => {
    // Don't replace a modal that's still showing; surface the next point only
    // after the current one is dismissed.
    if (!coords || nearbyPoint) {
      return
    }
    const entered = findNewlyEnteredPoint(points, coords, triggeredIds.current)
    if (entered) {
      triggeredIds.current.add(entered.id)
      setNearbyPoint(entered)
    }
  }, [points, coords, nearbyPoint])

  const dismiss = useCallback(() => setNearbyPoint(null), [])

  return { nearbyPoint, dismiss }
}
