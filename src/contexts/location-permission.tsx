import * as Location from 'expo-location'
import { createContext, type PropsWithChildren, useContext } from 'react'

type LocationPermissionContextValue = {
  permission: Location.LocationPermissionResponse | null
  requestPermission: () => Promise<Location.LocationPermissionResponse>
  isGranted: boolean
}

const LocationPermissionContext = createContext<LocationPermissionContextValue | null>(null)

export function LocationPermissionProvider({ children }: PropsWithChildren) {
  const [permission, requestPermission] = Location.useForegroundPermissions()

  return (
    <LocationPermissionContext.Provider
      value={{
        permission,
        requestPermission,
        isGranted: permission?.granted ?? false,
      }}
    >
      {children}
    </LocationPermissionContext.Provider>
  )
}

export function useLocationPermission() {
  const context = useContext(LocationPermissionContext)

  if (!context) {
    throw new Error('useLocationPermission must be used inside LocationPermissionProvider')
  }

  return context
}
