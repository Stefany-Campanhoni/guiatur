import { Platform } from 'react-native'

// Base URL of the local json-server.
// Override with EXPO_PUBLIC_API_URL (e.g. http://192.168.0.10:3001 for a physical device).
// Defaults: the Android emulator reaches the host machine at 10.0.2.2; iOS sim / web use localhost.
const DEFAULT_JSON_SERVER_URL = Platform.select({
  android: 'http://10.0.2.2:3001',
  default: 'http://localhost:3001',
})

export const JSON_SERVER_URL = process.env.EXPO_PUBLIC_API_URL ?? DEFAULT_JSON_SERVER_URL
