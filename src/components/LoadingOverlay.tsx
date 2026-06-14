import { ActivityIndicator, Text, View } from 'react-native'

import { COLORS } from '@/constants/theme'

export function LoadingOverlay({ message = 'Carregando...' }: { message?: string }) {
  return (
    <View className="flex-1 items-center justify-center bg-rose-subtle">
      <ActivityIndicator color={COLORS.roseDark} />
      <Text className="mt-3 font-sans text-sm text-ink-muted">{message}</Text>
    </View>
  )
}
