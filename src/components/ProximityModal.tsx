import { Image } from 'expo-image'
import { Modal, Pressable, Text, View } from 'react-native'

import { CategoryBadge } from '@/components/CategoryBadge'
import { DistanceBadge } from '@/components/DistanceBadge'
import type { MapPoint } from '@/types/place'

type ProximityModalProps = {
  point: MapPoint | null
  distanceMeters: number | null
  onDismiss: () => void
  onSeeDetails: (point: MapPoint) => void
}

export function ProximityModal({ point, distanceMeters, onDismiss, onSeeDetails }: ProximityModalProps) {
  return (
    <Modal visible={point !== null} transparent animationType="slide" onRequestClose={onDismiss}>
      <Pressable className="flex-1 justify-end bg-black/30" onPress={onDismiss}>
        <Pressable className="rounded-t-3xl border border-sand bg-white p-6" onPress={() => {}}>
          {point ? (
            <>
              <Text className="font-medium text-xs uppercase text-ink-muted">Você está perto de</Text>
              {point.imageUrl ? (
                <Image
                  source={{ uri: point.imageUrl }}
                  style={{ width: '100%', height: 140, borderRadius: 16, marginTop: 8 }}
                  contentFit="cover"
                  transition={200}
                />
              ) : null}
              <Text className="mt-3 font-bold text-xl text-ink">{point.name}</Text>
              <View className="mt-2 flex-row gap-2">
                <CategoryBadge category={point.category} customCategory={point.customCategory} />
                {distanceMeters !== null ? <DistanceBadge meters={distanceMeters} /> : null}
              </View>
              <Pressable
                className="mt-5 items-center rounded-2xl bg-rose px-5 py-4 active:bg-rose-dark"
                onPress={() => onSeeDetails(point)}
              >
                <Text className="font-bold text-base text-white">Ver detalhes</Text>
              </Pressable>
              <Pressable className="mt-2 items-center px-5 py-3" onPress={onDismiss}>
                <Text className="font-medium text-sm text-ink-muted">Agora não</Text>
              </Pressable>
            </>
          ) : null}
        </Pressable>
      </Pressable>
    </Modal>
  )
}
