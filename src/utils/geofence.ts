import type { MapPoint } from '@/types/place'
import { haversineDistance } from '@/utils/haversine'

type LatLng = { latitude: number; longitude: number }

export function findPointsInRange(points: MapPoint[], coords: LatLng): MapPoint[] {
  return points.filter(
    (point) => point.isActive && haversineDistance(coords, point) <= point.radiusMeters,
  )
}

export function findNewlyEnteredPoint(
  points: MapPoint[],
  coords: LatLng,
  triggeredIds: ReadonlySet<string>,
): MapPoint | null {
  return findPointsInRange(points, coords).find((point) => !triggeredIds.has(point.id)) ?? null
}
