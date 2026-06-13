import { zodResolver } from '@hookform/resolvers/zod'
import { Picker } from '@react-native-picker/picker'
import * as Location from 'expo-location'
import { useRouter } from 'expo-router'
import { Controller, useForm } from 'react-hook-form'
import { Alert, Pressable, ScrollView, Switch, Text, View } from 'react-native'

import { FormInput } from '@/components/FormInput'
import { COLORS } from '@/constants/theme'
import { useLiveLocation } from '@/contexts/location'
import { placeSchema, type PlaceFormValues } from '@/schemas/placeSchema'
import { createPlace } from '@/services/jsonServer'
import { CATEGORY_LABELS, PLACE_CATEGORIES } from '@/types/place'

const DEFAULT_VALUES: PlaceFormValues = {
  name: '',
  description: '',
  category: 'museum',
  radiusMeters: '',
  imageUrl: '',
  isActive: true,
}

export default function AddScreen() {
  const router = useRouter()
  const { coords } = useLiveLocation()
  const {
    control,
    handleSubmit,
    reset,
    formState: { errors, isSubmitting },
  } = useForm<PlaceFormValues>({
    resolver: zodResolver(placeSchema),
    defaultValues: DEFAULT_VALUES,
  })

  const onSubmit = async (values: PlaceFormValues) => {
    let position = coords
    if (!position) {
      const current = await Location.getCurrentPositionAsync({ accuracy: Location.Accuracy.High })
      position = { latitude: current.coords.latitude, longitude: current.coords.longitude }
    }

    try {
      await createPlace({
        name: values.name,
        description: values.description,
        category: values.category,
        radiusMeters: Number(values.radiusMeters),
        imageUrl: values.imageUrl,
        isActive: values.isActive,
        latitude: position.latitude,
        longitude: position.longitude,
        createdAt: new Date().toISOString(),
      })
      reset(DEFAULT_VALUES)
      Alert.alert('Pronto!', 'Ponto cadastrado com sucesso.', [
        { text: 'Ver no mapa', onPress: () => router.push('/(tabs)') },
        { text: 'OK' },
      ])
    } catch {
      Alert.alert('Erro', 'Não foi possível salvar o ponto. Verifique o servidor.')
    }
  }

  return (
    <ScrollView
      className="flex-1 bg-rose-subtle"
      contentContainerStyle={{ padding: 24 }}
      keyboardShouldPersistTaps="handled"
    >
      <Text className="mb-1 font-bold text-2xl text-rose-dark">Adicionar ponto</Text>
      <Text className="mb-5 font-sans text-sm text-ink-muted">O ponto é salvo na sua localização atual.</Text>

      <Controller
        control={control}
        name="name"
        render={({ field: { onChange, onBlur, value } }) => (
          <FormInput
            label="Nome"
            placeholder="Ex: Praça Central"
            value={value}
            onChangeText={onChange}
            onBlur={onBlur}
            error={errors.name?.message}
          />
        )}
      />

      <Controller
        control={control}
        name="description"
        render={({ field: { onChange, onBlur, value } }) => (
          <FormInput
            label="Descrição histórica"
            placeholder="Conte a história deste lugar..."
            value={value}
            onChangeText={onChange}
            onBlur={onBlur}
            error={errors.description?.message}
            multiline
            numberOfLines={4}
            style={{ height: 100, textAlignVertical: 'top' }}
          />
        )}
      />

      <View className="mb-4">
        <Text className="mb-1 font-medium text-sm text-ink">Categoria</Text>
        <View className="overflow-hidden rounded-2xl border border-sand bg-white">
          <Controller
            control={control}
            name="category"
            render={({ field: { onChange, value } }) => (
              <Picker selectedValue={value} onValueChange={onChange}>
                {PLACE_CATEGORIES.map((category) => (
                  <Picker.Item key={category} label={CATEGORY_LABELS[category]} value={category} />
                ))}
              </Picker>
            )}
          />
        </View>
      </View>

      <Controller
        control={control}
        name="radiusMeters"
        render={({ field: { onChange, onBlur, value } }) => (
          <FormInput
            label="Raio do geofence (metros)"
            placeholder="50 a 1000"
            value={value}
            onChangeText={onChange}
            onBlur={onBlur}
            error={errors.radiusMeters?.message}
            keyboardType="numeric"
          />
        )}
      />

      <Controller
        control={control}
        name="imageUrl"
        render={({ field: { onChange, onBlur, value } }) => (
          <FormInput
            label="URL da imagem"
            placeholder="https://..."
            value={value}
            onChangeText={onChange}
            onBlur={onBlur}
            error={errors.imageUrl?.message}
            autoCapitalize="none"
            keyboardType="url"
          />
        )}
      />

      <Controller
        control={control}
        name="isActive"
        render={({ field: { onChange, value } }) => (
          <View className="mb-6 flex-row items-center justify-between">
            <Text className="font-medium text-sm text-ink">Geofence ativo</Text>
            <Switch value={value} onValueChange={onChange} trackColor={{ true: COLORS.rose, false: COLORS.sand }} />
          </View>
        )}
      />

      <Pressable
        className="items-center rounded-2xl bg-rose px-5 py-4 active:bg-rose-dark"
        disabled={isSubmitting}
        onPress={handleSubmit(onSubmit)}
      >
        <Text className="font-bold text-base text-white">{isSubmitting ? 'Salvando...' : 'Salvar ponto'}</Text>
      </Pressable>
    </ScrollView>
  )
}
