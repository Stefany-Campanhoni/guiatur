import { Text, TextInput, View, type TextInputProps } from 'react-native'

import { COLORS } from '@/constants/theme'

type FormInputProps = TextInputProps & {
  label: string
  error?: string
  required?: boolean
}

export function FormInput({ label, error, required, ...inputProps }: FormInputProps) {
  return (
    <View className="mb-4">
      <Text className="mb-1 font-medium text-sm text-ink">
        {label}
        {required ? <Text className="text-error"> *</Text> : null}
      </Text>
      <TextInput
        className="rounded-2xl border border-sand bg-white px-4 py-3 font-sans text-base text-ink"
        placeholderTextColor={COLORS.inkMuted}
        {...inputProps}
      />
      {error ? <Text className="mt-1 font-medium text-xs text-error">{error}</Text> : null}
    </View>
  )
}
