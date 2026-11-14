import { describe, expect, it } from 'vitest'
import { criteria } from '../criteria.ts'
import { expectCleanSentences } from './checkBank.ts'
import { workBank } from './work.ts'

describe('work bank', () => {
  it('covers every criterion of its category, at every level, with at least two clean variants', () => {
    for (const criterion of criteria.filter((c) => c.category === 'work')) {
      const bank = workBank[criterion.id]!
      for (const level of [1, 2, 3, 4] as const) {
        expect(bank.levels[level].length, `${criterion.id} ${level}`).toBeGreaterThanOrEqual(2)
        expectCleanSentences(bank.levels[level], `${criterion.id} ${level}`)
      }
      expectCleanSentences(bank.advice!, `${criterion.id} advice`)
    }
  })
})
