export const PLACE_CATEGORIES = ['museum', 'monument', 'park', 'religious', 'cultural'] as const

export type PlaceCategory = (typeof PLACE_CATEGORIES)[number]

export const CATEGORY_LABELS: Record<PlaceCategory, string> = {
  museum: 'Museu',
  monument: 'Monumento',
  park: 'Parque',
  religious: 'Religioso',
  cultural: 'Cultural',
}

/** A point stored in json-server (created by the user). */
export type Place = {
  id: string
  name: string
  description: string
  category: PlaceCategory
  radiusMeters: number
  imageUrl: string
  isActive: boolean
  latitude: number
  longitude: number
  createdAt: string
}

export type PlaceSource = 'local' | 'google'

/** Unified shape consumed by the map and list, regardless of source. */
export type MapPoint = {
  id: string
  source: PlaceSource
  name: string
  category: PlaceCategory | null
  imageUrl: string | null
  latitude: number
  longitude: number
  radiusMeters: number
  isActive: boolean
}

export function placeToMapPoint(place: Place): MapPoint {
  return {
    id: place.id,
    source: 'local',
    name: place.name,
    category: place.category,
    imageUrl: place.imageUrl,
    latitude: place.latitude,
    longitude: place.longitude,
    radiusMeters: place.radiusMeters,
    isActive: place.isActive,
  }
}
