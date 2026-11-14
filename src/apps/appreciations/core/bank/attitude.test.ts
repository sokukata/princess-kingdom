import { describe, expect, it } from 'vitest'
import { criteria } from '../criteria.ts'
import { render } from '../text.ts'
import { attitudeBank } from './attitude.ts'
import { expectCleanSentences } from './checkBank.ts'

describe('attitude bank', () => {
  it('covers every criterion of its category, at every level, with at least two clean variants', () => {
    for (const criterion of criteria.filter((c) => c.category === 'attitude')) {
      const bank = attitudeBank[criterion.id]!
      for (const level of [1, 2, 3, 4] as const) {
        expect(bank.levels[level].length, `${criterion.id} ${level}`).toBeGreaterThanOrEqual(2)
        expectCleanSentences(bank.levels[level], `${criterion.id} ${level}`)
      }
      expectCleanSentences(bank.advice!, `${criterion.id} advice`)
    }
  })

  it('agrees adjectives with the gender', () => {
    const sentence = '{Il|Elle} est {attentif|attentive} en classe.'
    expect(render(sentence, 'F', 'T1')).toBe('Elle est attentive en classe.')
    expect(render(sentence, 'M', 'T1')).toBe('Il est attentif en classe.')
  })
})
