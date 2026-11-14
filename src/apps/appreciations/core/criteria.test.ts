import { describe, expect, it } from 'vitest'
import { criteria } from './criteria.ts'

describe('criteria', () => {
  it('each have a short hint on what is rated', () => {
    for (const criterion of criteria) {
      expect(criterion.hint, criterion.id).toMatch(/^\p{Lu}.*\.$/u)
      expect(criterion.hint.length, criterion.id).toBeLessThanOrEqual(110)
    }
  })

  it('have distinct names', () => {
    expect(new Set(criteria.map((c) => c.label)).size).toBe(criteria.length)
  })
})
