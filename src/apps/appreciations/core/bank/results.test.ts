import { describe, expect, it } from 'vitest'
import { criteria } from '../criteria.ts'
import { render } from '../text.ts'
import { expectCleanSentences } from './checkBank.ts'
import { resultsBank } from './results.ts'

describe('results bank', () => {
  it('covers every criterion of its category, at every level, with at least two clean variants', () => {
    for (const criterion of criteria.filter((c) => c.category === 'results')) {
      const bank = resultsBank[criterion.id]!
      for (const level of [1, 2, 3, 4] as const) {
        expect(bank.levels[level].length, `${criterion.id} ${level}`).toBeGreaterThanOrEqual(2)
        expectCleanSentences(bank.levels[level], `${criterion.id} ${level}`)
      }
      expectCleanSentences(bank.advice!, `${criterion.id} advice`)
    }
  })

  it('agrees with the gender and the period', () => {
    expect(render('{Il|Elle} obtient de très bons résultats.', 'F', 'T2')).toBe('Elle obtient de très bons résultats.')
    expect(render('Des progrès sont visibles ce {p}.', 'M', 'S1')).toBe('Des progrès sont visibles ce semestre.')
  })
})
