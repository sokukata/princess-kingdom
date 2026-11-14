import { describe, expect, it } from 'vitest'
import { groupSizes } from './sizes.ts'

const by = (n: number, extra: 'enlarge' | 'smaller') => ({ by: 'size' as const, n, extra })
const sum = (sizes: number[]) => sizes.reduce((a, b) => a + b, 0)

describe('groupSizes by size', () => {
  it.each([
    [12, [4, 4, 4]],
    [13, [5, 4, 4]],
    [14, [5, 5, 4]],
    [15, [5, 5, 5]],
    [9, [5, 4]],
    [4, [4]],
    [3, [3]],
    [1, [1]],
  ])('enlarge, %i students in groups of 4', (total, expected) => {
    expect(groupSizes(total, by(4, 'enlarge'))).toEqual(expected)
  })

  it('enlarge: floor(n/N) groups covering everybody', () => {
    for (let total = 4; total <= 40; total++) {
      const sizes = groupSizes(total, by(4, 'enlarge'))
      expect(sizes.length).toBe(Math.floor(total / 4))
      expect(sum(sizes)).toBe(total)
      expect(Math.min(...sizes)).toBeGreaterThanOrEqual(4)
    }
  })

  it.each([
    [12, [4, 4, 4]],
    [13, [4, 3, 3, 3]],
    [14, [4, 4, 3, 3]],
    [15, [4, 4, 4, 3]],
    [9, [3, 3, 3]],
    [5, [3, 2]],
    [3, [3]],
    [1, [1]],
  ])('smaller, %i students in groups of 4', (total, expected) => {
    expect(groupSizes(total, by(4, 'smaller'))).toEqual(expected)
  })

  it('smaller: never more than N, never empty, balanced', () => {
    for (let total = 1; total <= 40; total++) {
      const sizes = groupSizes(total, by(5, 'smaller'))
      expect(sum(sizes)).toBe(total)
      expect(Math.max(...sizes)).toBeLessThanOrEqual(5)
      expect(Math.min(...sizes)).toBeGreaterThan(0)
      expect(Math.max(...sizes) - Math.min(...sizes)).toBeLessThanOrEqual(1)
    }
  })

  it('one group when N is larger than the class', () => {
    expect(groupSizes(5, by(8, 'enlarge'))).toEqual([5])
    expect(groupSizes(5, by(8, 'smaller'))).toEqual([5])
  })

  it('no group without students', () => {
    expect(groupSizes(0, by(4, 'enlarge'))).toEqual([])
  })
})

describe('groupSizes by count', () => {
  it.each([
    [12, 4, [3, 3, 3, 3]],
    [13, 4, [4, 3, 3, 3]],
    [14, 4, [4, 4, 3, 3]],
    [15, 4, [4, 4, 4, 3]],
    [3, 5, [1, 1, 1]],
  ])('%i students in %i groups', (total, count, expected) => {
    expect(groupSizes(total, { by: 'count', n: count, extra: 'enlarge' })).toEqual(expected)
  })
})
