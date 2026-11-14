import { describe, expect, it } from 'vitest'
import { criteria } from '../criteria.ts'
import { bank, combinations, conclusions, openings } from './index.ts'

const count = (lists: string[][]) => lists.reduce((total, list) => total + list.length, 0)

describe('bank', () => {
  it('has sentences for every criterion and nothing else', () => {
    expect(Object.keys(bank).sort()).toEqual(criteria.map((c) => c.id).sort())
  })

  it('holds a few hundred sentences', () => {
    const total =
      count(Object.values(bank).flatMap((b) => [...Object.values(b.levels), b.advice ?? []])) +
      count(Object.values(openings)) +
      count(Object.values(conclusions)) +
      count(combinations.map((c) => c.variants))
    expect(total).toBeGreaterThan(200)
  })
})
