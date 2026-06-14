import type { ConfigContext, ExpoConfig } from 'expo/config'

export default ({ config }: ConfigContext): ExpoConfig => ({
  ...config,
  name: config.name ?? 'guiatur',
  slug: config.slug ?? 'guiatur',
  plugins: (config.plugins ?? []).map((plugin) =>
    Array.isArray(plugin) && plugin[0] === 'react-native-maps'
      ? ['react-native-maps', { androidGoogleMapsApiKey: process.env.GOOGLE_MAPS_API_KEY }]
      : plugin,
  ) as ExpoConfig['plugins'],
})
