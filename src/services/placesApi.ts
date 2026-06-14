import { GOOGLE_MAPS_API_KEY } from '@/constants/api'
import { GOOGLE_PLACES_BASE_URL, googleApiClient } from '@/services/googleApiClient'
import { PlaceSource, type MapPoint } from '@/types/place'

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

const PLACES_FIELD_MASK = 'places.id,places.displayName,places.location,places.photos,places.rating'

export function googlePhotoUrl(photoName: string): string {
  return `${GOOGLE_PLACES_BASE_URL}/${photoName}/media?maxWidthPx=600&key=${GOOGLE_MAPS_API_KEY}`
}

function toMapPoint(place: GooglePlace): MapPoint {
  return {
    id: place.id,
    source: PlaceSource.Google,
    name: place.displayName?.text ?? 'Ponto turístico',
    category: null,
    customCategory: null,
    imageUrl: place.photos?.[0] ? googlePhotoUrl(place.photos[0].name) : null,
    pinColor: null,
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
    const { data } = await googleApiClient.post<{ places?: GooglePlace[] }>(
      '/places:searchNearby',
      {
        includedTypes: ['tourist_attraction'],
        maxResultCount: 15,
        locationRestriction: { circle: { center, radius: 5000 } },
      },
      { headers: { 'X-Goog-FieldMask': PLACES_FIELD_MASK } },
    )
    return (data.places ?? []).map(toMapPoint)
  } catch {
    return []
  }
}

export async function searchGooglePlaces(query: string, center: LatLng): Promise<MapPoint[]> {
  if (!GOOGLE_MAPS_API_KEY || !query.trim()) {
    return []
  }
  try {
    const { data } = await googleApiClient.post<{ places?: GooglePlace[] }>(
      '/places:searchText',
      {
        textQuery: query,
        maxResultCount: 15,
        locationBias: { circle: { center, radius: 20000 } },
      },
      { headers: { 'X-Goog-FieldMask': PLACES_FIELD_MASK } },
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
  const { data } = await googleApiClient.get<GooglePlace>(`/places/${placeId}`, {
    headers: { 'X-Goog-FieldMask': 'id,displayName,location,photos,rating,formattedAddress,editorialSummary' },
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
