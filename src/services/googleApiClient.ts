import axios from 'axios'

import { GOOGLE_MAPS_API_KEY } from '@/constants/api'

export const GOOGLE_PLACES_BASE_URL = 'https://places.googleapis.com/v1'

export const googleApiClient = axios.create({
  baseURL: GOOGLE_PLACES_BASE_URL,
  timeout: 8000,
  headers: { 'X-Goog-Api-Key': GOOGLE_MAPS_API_KEY },
})
