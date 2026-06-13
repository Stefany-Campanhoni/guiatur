import { z } from 'zod'

import { PLACE_CATEGORIES } from '@/types/place'

export const placeSchema = z.object({
  name: z.string().min(3, 'Mínimo de 3 caracteres'),
  description: z.string().min(20, 'Mínimo de 20 caracteres'),
  category: z.enum(PLACE_CATEGORIES),
  radiusMeters: z
    .string()
    .regex(/^\d+$/, 'Informe um número')
    .refine((value) => Number(value) >= 50 && Number(value) <= 1000, 'Entre 50 e 1000 metros'),
  imageUrl: z.string().url('URL inválida'),
  isActive: z.boolean(),
})

export type PlaceFormValues = z.infer<typeof placeSchema>
