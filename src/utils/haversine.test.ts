import { haversineDistance } from './haversine'

describe('haversineDistance', () => {
  it('returns 0 for identical points', () => {
    const p = { latitude: -28.6775, longitude: -49.3697 }
    expect(haversineDistance(p, p)).toBe(0)
  })

  it('approximates ~111 m for 0.001° of latitude', () => {
    const a = { latitude: -28.6775, longitude: -49.3697 }
    const b = { latitude: -28.6765, longitude: -49.3697 }
    const d = haversineDistance(a, b)
    expect(d).toBeGreaterThan(108)
    expect(d).toBeLessThan(114)
  })

  it('is symmetric', () => {
    const a = { latitude: -28.6775, longitude: -49.3697 }
    const b = { latitude: -28.68, longitude: -49.37 }
    expect(haversineDistance(a, b)).toBeCloseTo(haversineDistance(b, a), 6)
  })
})
