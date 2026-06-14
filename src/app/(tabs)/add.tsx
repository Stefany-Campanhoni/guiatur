import { zodResolver } from '@hookform/resolvers/zod'
import { Picker } from '@react-native-picker/picker'
import * as Location from 'expo-location'
import { useRouter } from 'expo-router'
import { Controller, useForm } from 'react-hook-form'
import { Alert, Pressable, ScrollView, Switch, Text, View } from 'react-native'
import { useSafeAreaInsets } from 'react-native-safe-area-context'

import { ColorField, PIN_COLORS } from '@/components/ColorField'
import { FormInput } from '@/components/FormInput'
import { ImageField } from '@/components/ImageField'
import { COLORS } from '@/constants/theme'
import { useLiveLocation } from '@/contexts/location'
import { placeSchema, type PlaceFormValues } from '@/schemas/placeSchema'
import { createPlace } from '@/services/jsonServer'
import { CATEGORY_LABELS, PLACE_CATEGORIES } from '@/types/place'

const DEFAULT_VALUES: PlaceFormValues = {
  name: '',
  description: '',
  category: 'museum',
  customCategory: '',
  radiusMeters: '',
  imageUrl: '',
  pinColor: PIN_COLORS[0],
  isActive: true,
}

export default function AddScreen() {
  const router = useRouter()
  const insets = useSafeAreaInsets()
  const { coords } = useLiveLocation()
  const {
    control,
    handleSubmit,
    reset,
    watch,
    formState: { errors, isSubmitting },
  } = useForm<PlaceFormValues>({
    resolver: zodResolver(placeSchema),
    defaultValues: DEFAULT_VALUES,
  })

  const category = watch('category')

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
        customCategory: values.category === 'other' ? values.customCategory?.trim() : undefined,
        radiusMeters: Number(values.radiusMeters),
        imageUrl: values.imageUrl,
        pinColor: values.pinColor,
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
      contentContainerStyle={{ padding: 24, paddingTop: insets.top + 16 }}
      keyboardShouldPersistTaps="handled"
    >
      <Text className="mb-1 font-bold text-2xl text-rose-dark">Adicionar ponto</Text>
      <Text className="mb-5 font-sans text-sm text-ink-muted">O ponto é salvo na sua localização atual.</Text>

      <Controller
        control={control}
        name="name"
        render={({ field: { onChange, onBlur, value } }) => (
          <FormInput label="Nome" required placeholder="Ex: Praça Central" value={value} onChangeText={onChange} onBlur={onBlur} error={errors.name?.message} />
        )}
      />

      <Controller
        control={control}
        name="description"
        render={({ field: { onChange, onBlur, value } }) => (
          <FormInput
            label="Descrição histórica"
            required
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
        <Text className="mb-1 font-medium text-sm text-ink">
          Categoria<Text className="text-error"> *</Text>
        </Text>
        <View className="overflow-hidden rounded-2xl border border-sand bg-white">
          <Controller
            control={control}
            name="category"
            render={({ field: { onChange, value } }) => (
              <Picker selectedValue={value} onValueChange={onChange}>
                {PLACE_CATEGORIES.map((option) => (
                  <Picker.Item key={option} label={CATEGORY_LABELS[option]} value={option} />
                ))}
              </Picker>
            )}
          />
        </View>
      </View>

      {category === 'other' ? (
        <Controller
          control={control}
          name="customCategory"
          render={({ field: { onChange, onBlur, value } }) => (
            <FormInput
              label="Categoria personalizada"
              required
              placeholder="Ex: Mirante"
              value={value ?? ''}
              onChangeText={onChange}
              onBlur={onBlur}
              error={errors.customCategory?.message}
            />
          )}
        />
      ) : null}

      <Controller
        control={control}
        name="radiusMeters"
        render={({ field: { onChange, onBlur, value } }) => (
          <FormInput
            label="Raio do geofence (metros)"
            required
            placeholder="Ex: 200 — entre 50 e 1000"
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
          <ImageField label="Imagem" required value={value} onChange={onChange} onBlur={onBlur} error={errors.imageUrl?.message} />
        )}
      />

      <Controller
        control={control}
        name="pinColor"
        render={({ field: { onChange, value } }) => <ColorField label="Cor do marcador" value={value} onChange={onChange} />}
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

      <Pressable className="items-center rounded-2xl bg-rose px-5 py-4 active:bg-rose-dark" disabled={isSubmitting} onPress={handleSubmit(onSubmit)}>
        <Text className="font-bold text-base text-white">{isSubmitting ? 'Salvando...' : 'Salvar ponto'}</Text>
      </Pressable>
    </ScrollView>
  )
}
