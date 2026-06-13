import type { MapPoint } from '@/types/place'

import { findNewlyEnteredPoint, findPointsInRange } from './geofence'

function makePoint(overrides: Partial<MapPoint>): MapPoint {
  return {
    id: 'p1',
    source: 'local',
    name: 'Ponto',
    category: 'museum',
    imageUrl: null,
    latitude: -28.6775,
    longitude: -49.3697,
    radiusMeters: 100,
    isActive: true,
    ...overrides,
  }
}

const userAtPoint = { latitude: -28.6775, longitude: -49.3697 }
const userFarAway = { latitude: -28.7, longitude: -49.4 }

describe('findPointsInRange', () => {
  it('includes an active point the user is standing on', () => {
    const points = [makePoint({})]
    expect(findPointsInRange(points, userAtPoint)).toHaveLength(1)
  })

  it('excludes points outside their radius', () => {
    const points = [makePoint({})]
    expect(findPointsInRange(points, userFarAway)).toHaveLength(0)
  })

  it('excludes inactive points even when in range', () => {
    const points = [makePoint({ isActive: false })]
    expect(findPointsInRange(points, userAtPoint)).toHaveLength(0)
  })
})

describe('findNewlyEnteredPoint', () => {
  it('returns an in-range point not yet triggered', () => {
    const points = [makePoint({ id: 'a' })]
    const result = findNewlyEnteredPoint(points, userAtPoint, new Set())
    expect(result?.id).toBe('a')
  })

  it('returns null when the only in-range point is already triggered', () => {
    const points = [makePoint({ id: 'a' })]
    const result = findNewlyEnteredPoint(points, userAtPoint, new Set(['a']))
    expect(result).toBeNull()
  })

  it('returns null when nothing is in range', () => {
    const points = [makePoint({ id: 'a' })]
    expect(findNewlyEnteredPoint(points, userFarAway, new Set())).toBeNull()
  })
})
