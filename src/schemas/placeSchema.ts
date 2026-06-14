import { z } from 'zod'

import { PLACE_CATEGORIES } from '@/types/place'

export const placeSchema = z
  .object({
    name: z.string().min(3, 'Mínimo de 3 caracteres'),
    description: z.string().min(20, 'Mínimo de 20 caracteres'),
    category: z.enum(PLACE_CATEGORIES),
    customCategory: z.string().optional(),
    radiusMeters: z
      .string()
      .regex(/^\d+$/, 'Informe um número')
      .refine((value) => Number(value) >= 50 && Number(value) <= 1000, 'Entre 50 e 1000 metros'),
    imageUrl: z.string().min(1, 'Adicione uma imagem'),
    pinColor: z.string().min(1, 'Escolha uma cor'),
    isActive: z.boolean(),
  })
  .refine((data) => data.category !== 'other' || (data.customCategory?.trim().length ?? 0) >= 3, {
    message: 'Informe a categoria (mín. 3 caracteres)',
    path: ['customCategory'],
  })

export type PlaceFormValues = z.infer<typeof placeSchema>
