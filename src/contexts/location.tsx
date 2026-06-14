import * as Location from 'expo-location'
import { createContext, type PropsWithChildren, useContext, useEffect, useRef, useState } from 'react'

import { useLocationPermission } from '@/contexts/location-permission'

export type Coords = { latitude: number; longitude: number }

type LiveLocationContextValue = {
  coords: Coords | null
}

const LiveLocationContext = createContext<LiveLocationContextValue | null>(null)

export function LiveLocationProvider({ children }: PropsWithChildren) {
  const { isGranted } = useLocationPermission()
  const [coords, setCoords] = useState<Coords | null>(null)
  const subscriptionRef = useRef<Location.LocationSubscription | null>(null)

  useEffect(() => {
    if (!isGranted) {
      return
    }

    let cancelled = false
    Location.watchPositionAsync(
      { accuracy: Location.Accuracy.High, distanceInterval: 10 },
      (location) => {
        if (!cancelled) {
          setCoords({ latitude: location.coords.latitude, longitude: location.coords.longitude })
        }
      },
    ).then((subscription) => {
      if (cancelled) {
        subscription.remove()
      } else {
        subscriptionRef.current = subscription
      }
    })

    return () => {
      cancelled = true
      subscriptionRef.current?.remove()
      subscriptionRef.current = null
    }
  }, [isGranted])

  return <LiveLocationContext.Provider value={{ coords }}>{children}</LiveLocationContext.Provider>
}

export function useLiveLocation() {
  const context = useContext(LiveLocationContext)
  if (!context) {
    throw new Error('useLiveLocation must be used inside LiveLocationProvider')
  }
  return context
}
