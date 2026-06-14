import type { ConfigContext, ExpoConfig } from 'expo/config'

export default ({ config }: ConfigContext): ExpoConfig => ({
  ...config,
  name: config.name ?? 'guiatur',
  slug: config.slug ?? 'guiatur',
  android: {
    ...config.android,
    config: {
      ...config.android?.config,
      googleMaps: { apiKey: process.env.GOOGLE_MAPS_API_KEY },
    },
  },
  plugins: [
    ...(config.plugins ?? []),
    [
      'expo-maps',
      {
        requestLocationPermission: true,
        locationPermission: 'Permitir que o $(PRODUCT_NAME) use sua localização',
      },
    ],
    ['expo-build-properties', { android: { minSdkVersion: 26 } }],
  ] as ExpoConfig['plugins'],
})
