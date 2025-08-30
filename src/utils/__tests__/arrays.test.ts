import { describe, it, expect } from 'vitest'
import { toArray, safeMap, safeFilter } from '../arrays'

describe('toArray', () => {
  it('should return the array if input is already an array', () => {
    const input = [1, 2, 3]
    expect(toArray(input)).toBe(input)
  })

  it('should return empty array for undefined', () => {
    expect(toArray(undefined)).toEqual([])
  })

  it('should return empty array for null', () => {
    expect(toArray(null)).toEqual([])
  })

  it('should work with empty arrays', () => {
    const input: number[] = []
    expect(toArray(input)).toBe(input)
  })
})

describe('safeMap', () => {
  it('should map array items correctly', () => {
    const input = [1, 2, 3]
    const result = safeMap(input, (x: number) => x * 2)
    expect(result).toEqual([2, 4, 6])
  })

  it('should return empty array for undefined input', () => {
    const result = safeMap(undefined, (x: number) => x * 2)
    expect(result).toEqual([])
  })

  it('should return empty array for null input', () => {
    const result = safeMap(null, (x: number) => x * 2)
    expect(result).toEqual([])
  })
})

describe('safeFilter', () => {
  it('should filter array items correctly', () => {
    const input = [1, 2, 3, 4, 5]
    const result = safeFilter(input, (x: number) => x % 2 === 0)
    expect(result).toEqual([2, 4])
  })

  it('should return empty array for undefined input', () => {
    const result = safeFilter(undefined, (x: number) => x % 2 === 0)
    expect(result).toEqual([])
  })

  it('should return empty array for null input', () => {
    const result = safeFilter(null, (x: number) => x % 2 === 0)
    expect(result).toEqual([])
  })
})