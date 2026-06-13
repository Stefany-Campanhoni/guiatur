import { Pressable, Text, View } from 'react-native'

type ErrorMessageProps = {
  message: string
  onRetry?: () => void
}

export function ErrorMessage({ message, onRetry }: ErrorMessageProps) {
  return (
    <View className="flex-1 items-center justify-center bg-rose-subtle px-6">
      <View className="w-full rounded-3xl border border-sand bg-white p-6 shadow-sm">
        <Text className="font-bold text-lg text-rose-dark">Ops!</Text>
        <Text className="mt-2 font-sans text-base leading-6 text-ink-muted">{message}</Text>
        {onRetry ? (
          <Pressable className="mt-6 items-center rounded-2xl bg-rose px-5 py-4 active:bg-rose-dark" onPress={onRetry}>
            <Text className="font-bold text-base text-white">Tentar novamente</Text>
          </Pressable>
        ) : null}
      </View>
    </View>
  )
}
