import axios from 'axios'

import { JSON_SERVER_URL } from '@/constants/api'
import type { Place } from '@/types/place'

const api = axios.create({
  baseURL: JSON_SERVER_URL,
  timeout: 8000,
})

/** Fields the client sends when creating/updating a place (server assigns `id`). */
export type PlaceInput = Omit<Place, 'id'>

export async function fetchPlaces(): Promise<Place[]> {
  const { data } = await api.get<Place[]>('/places')
  return data
}

export async function fetchPlace(id: string): Promise<Place> {
  const { data } = await api.get<Place>(`/places/${id}`)
  return data
}

export async function createPlace(input: PlaceInput): Promise<Place> {
  const { data } = await api.post<Place>('/places', input)
  return data
}

export async function updatePlace(id: string, input: PlaceInput): Promise<Place> {
  const { data } = await api.put<Place>(`/places/${id}`, input)
  return data
}
