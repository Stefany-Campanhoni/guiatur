import { Platform } from 'react-native'

const DEFAULT_JSON_SERVER_URL = Platform.select({
  android: 'http://10.0.2.2:3001',
  default: 'http://localhost:3001',
})

export const JSON_SERVER_URL = process.env.EXPO_PUBLIC_API_URL ?? DEFAULT_JSON_SERVER_URL

export const GOOGLE_MAPS_API_KEY = process.env.EXPO_PUBLIC_GOOGLE_MAPS_API_KEY ?? ''
