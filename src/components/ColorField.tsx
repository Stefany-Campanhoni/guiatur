import { Pressable, Text, View } from 'react-native'

import { COLORS } from '@/constants/theme'

export const PIN_COLORS = ['#E8A0B4', '#C4C8E4', '#B2CFC4', '#F5D4A8', '#EDADAD', '#A0C4E8', '#C9A0E8', '#7FB7A3']

type ColorFieldProps = {
  label: string
  value: string
  onChange: (color: string) => void
}

export function ColorField({ label, value, onChange }: ColorFieldProps) {
  return (
    <View className="mb-4">
      <Text className="mb-2 font-medium text-sm text-ink">{label}</Text>
      <View className="flex-row flex-wrap gap-3">
        {PIN_COLORS.map((color) => (
          <Pressable
            key={color}
            onPress={() => onChange(color)}
            style={{
              width: 36,
              height: 36,
              borderRadius: 18,
              backgroundColor: color,
              borderWidth: value === color ? 3 : 1,
              borderColor: value === color ? COLORS.roseDark : COLORS.sand,
            }}
          />
        ))}
      </View>
    </View>
  )
}
