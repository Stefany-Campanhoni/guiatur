export const PLACE_CATEGORIES = ['museum', 'monument', 'park', 'religious', 'cultural', 'other'] as const

export type PlaceCategory = (typeof PLACE_CATEGORIES)[number]

export const CATEGORY_LABELS: Record<PlaceCategory, string> = {
  museum: 'Museu',
  monument: 'Monumento',
  park: 'Parque',
  religious: 'Religioso',
  cultural: 'Cultural',
  other: 'Outro',
}

export function categoryLabel(category: PlaceCategory | null, customCategory?: string | null): string | null {
  if (!category) {
    return null
  }
  if (category === 'other') {
    return customCategory?.trim() || CATEGORY_LABELS.other
  }
  return CATEGORY_LABELS[category]
}

export type Place = {
  id: string
  name: string
  description: string
  category: PlaceCategory
  customCategory?: string
  radiusMeters: number
  imageUrl: string
  pinColor?: string
  isActive: boolean
  latitude: number
  longitude: number
  createdAt: string
}

export enum PlaceSource {
  Local = 'local',
  Google = 'google',
}

export type MapPoint = {
  id: string
  source: PlaceSource
  name: string
  category: PlaceCategory | null
  customCategory: string | null
  imageUrl: string | null
  pinColor: string | null
  latitude: number
  longitude: number
  radiusMeters: number
  isActive: boolean
}

export function placeToMapPoint(place: Place): MapPoint {
  return {
    id: place.id,
    source: PlaceSource.Local,
    name: place.name,
    category: place.category,
    customCategory: place.customCategory ?? null,
    imageUrl: place.imageUrl,
    pinColor: place.pinColor ?? null,
    latitude: place.latitude,
    longitude: place.longitude,
    radiusMeters: place.radiusMeters,
    isActive: place.isActive,
  }
}
