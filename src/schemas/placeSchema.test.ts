import { placeSchema } from './placeSchema'

const valid = {
  name: 'Praça Central',
  description: 'Uma descrição histórica com mais de vinte caracteres.',
  category: 'park',
  radiusMeters: '200',
  imageUrl: 'https://example.com/img.jpg',
  isActive: true,
}

describe('placeSchema', () => {
  it('accepts a valid form', () => {
    expect(placeSchema.safeParse(valid).success).toBe(true)
  })

  it('rejects a name shorter than 3 chars', () => {
    expect(placeSchema.safeParse({ ...valid, name: 'ab' }).success).toBe(false)
  })

  it('rejects a description shorter than 20 chars', () => {
    expect(placeSchema.safeParse({ ...valid, description: 'curto' }).success).toBe(false)
  })

  it('rejects a radius below 50', () => {
    expect(placeSchema.safeParse({ ...valid, radiusMeters: '10' }).success).toBe(false)
  })

  it('rejects a radius above 1000', () => {
    expect(placeSchema.safeParse({ ...valid, radiusMeters: '5000' }).success).toBe(false)
  })

  it('rejects a non-numeric radius', () => {
    expect(placeSchema.safeParse({ ...valid, radiusMeters: 'abc' }).success).toBe(false)
  })

  it('rejects an invalid image url', () => {
    expect(placeSchema.safeParse({ ...valid, imageUrl: 'not-a-url' }).success).toBe(false)
  })

  it('rejects an unknown category', () => {
    expect(placeSchema.safeParse({ ...valid, category: 'food' }).success).toBe(false)
  })
})
