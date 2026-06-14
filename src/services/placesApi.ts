import axios from 'axios'

import { GOOGLE_MAPS_API_KEY } from '@/constants/api'
import type { MapPoint } from '@/types/place'

type LatLng = { latitude: number; longitude: number }

type GooglePlace = {
  id: string
  displayName?: { text?: string }
  location: LatLng
  photos?: { name: string }[]
  rating?: number
  formattedAddress?: string
  editorialSummary?: { text?: string }
}

const api = axios.create({ baseURL: 'https://places.googleapis.com/v1', timeout: 8000 })

export function googlePhotoUrl(photoName: string): string {
  return `https://places.googleapis.com/v1/${photoName}/media?maxWidthPx=600&key=${GOOGLE_MAPS_API_KEY}`
}

function toMapPoint(place: GooglePlace): MapPoint {
  return {
    id: place.id,
    source: 'google',
    name: place.displayName?.text ?? 'Ponto turístico',
    category: null,
    imageUrl: place.photos?.[0] ? googlePhotoUrl(place.photos[0].name) : null,
    latitude: place.location.latitude,
    longitude: place.location.longitude,
    radiusMeters: 0,
    isActive: true,
  }
}

export async function fetchNearbyGooglePlaces(center: LatLng): Promise<MapPoint[]> {
  if (!GOOGLE_MAPS_API_KEY) {
    return []
  }
  try {
    const { data } = await api.post<{ places?: GooglePlace[] }>(
      '/places:searchNearby',
      {
        includedTypes: ['tourist_attraction'],
        maxResultCount: 15,
        locationRestriction: { circle: { center, radius: 5000 } },
      },
      {
        headers: {
          'X-Goog-Api-Key': GOOGLE_MAPS_API_KEY,
          'X-Goog-FieldMask': 'places.id,places.displayName,places.location,places.photos,places.rating',
        },
      },
    )
    return (data.places ?? []).map(toMapPoint)
  } catch {
    return []
  }
}

export type GooglePlaceDetails = {
  id: string
  name: string
  description: string
  imageUrl: string | null
  rating: number | null
  latitude: number
  longitude: number
}

export async function fetchGooglePlaceDetails(placeId: string): Promise<GooglePlaceDetails> {
  const { data } = await api.get<GooglePlace>(`/places/${placeId}`, {
    headers: {
      'X-Goog-Api-Key': GOOGLE_MAPS_API_KEY,
      'X-Goog-FieldMask': 'id,displayName,location,photos,rating,formattedAddress,editorialSummary',
    },
  })
  return {
    id: data.id,
    name: data.displayName?.text ?? 'Ponto turístico',
    description: data.editorialSummary?.text ?? data.formattedAddress ?? 'Sem descrição disponível.',
    imageUrl: data.photos?.[0] ? googlePhotoUrl(data.photos[0].name) : null,
    rating: data.rating ?? null,
    latitude: data.location.latitude,
    longitude: data.location.longitude,
  }
}
