import { Image } from 'expo-image'
import * as ImagePicker from 'expo-image-picker'
import { Alert, Pressable, Text, TextInput, View } from 'react-native'

import { COLORS } from '@/constants/theme'

type ImageFieldProps = {
  label: string
  value: string
  onChange: (uri: string) => void
  onBlur: () => void
  error?: string
  required?: boolean
}

export function ImageField({ label, value, onChange, onBlur, error, required }: ImageFieldProps) {
  const pickFromLibrary = async () => {
    const result = await ImagePicker.launchImageLibraryAsync({ mediaTypes: ['images'], quality: 0.6 })
    if (!result.canceled) {
      onChange(result.assets[0].uri)
    }
  }

  const takePhoto = async () => {
    const permission = await ImagePicker.requestCameraPermissionsAsync()
    if (!permission.granted) {
      Alert.alert('Permissão necessária', 'Permita o acesso à câmera para tirar uma foto.')
      return
    }
    const result = await ImagePicker.launchCameraAsync({ quality: 0.6 })
    if (!result.canceled) {
      onChange(result.assets[0].uri)
    }
  }

  return (
    <View className="mb-4">
      <Text className="mb-1 font-medium text-sm text-ink">
        {label}
        {required ? <Text className="text-error"> *</Text> : null}
      </Text>

      {value ? (
        <Image source={{ uri: value }} style={{ width: '100%', height: 160, borderRadius: 16, marginBottom: 8 }} contentFit="cover" />
      ) : null}

      <View className="mb-2 flex-row gap-2">
        <Pressable className="flex-1 items-center rounded-2xl border border-sand bg-white py-3 active:bg-sand-light" onPress={pickFromLibrary}>
          <Text className="font-medium text-sm text-rose-dark">Galeria</Text>
        </Pressable>
        <Pressable className="flex-1 items-center rounded-2xl border border-sand bg-white py-3 active:bg-sand-light" onPress={takePhoto}>
          <Text className="font-medium text-sm text-rose-dark">Câmera</Text>
        </Pressable>
      </View>

      <TextInput
        className="rounded-2xl border border-sand bg-white px-4 py-3 font-sans text-base text-ink"
        placeholder="ou cole uma URL de imagem"
        placeholderTextColor={COLORS.inkMuted}
        value={value}
        onChangeText={onChange}
        onBlur={onBlur}
        autoCapitalize="none"
        keyboardType="url"
      />
      {error ? <Text className="mt-1 font-medium text-xs text-error">{error}</Text> : null}
    </View>
  )
}
