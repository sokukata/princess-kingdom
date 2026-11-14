import { expect } from 'vitest'
import type { Gender, PeriodId } from '../model.ts'
import { forbidden, isNeutral, render } from '../text.ts'

const genders: Gender[] = ['F', 'M', undefined]
const samplePeriods: PeriodId[] = ['T1', 'S2']

// Every sentence of a bank, rendered for each gender, must read as a clean sentence of a school report.
export function expectCleanSentences(variants: string[], where: string) {
  expect(variants.length, where).toBeGreaterThan(0)
  expect(variants.some(isNeutral), `${where}: a variant without gender marker`).toBe(true)
  for (const variant of variants) {
    for (const gender of genders) {
      if (!gender && !isNeutral(variant)) continue
      for (const period of samplePeriods) {
        const text = render(variant, gender, period)
        expect(text, where).not.toMatch(/[{}|!]/)
        expect(text, where).toMatch(/^[A-ZÀÂÉÈÊÎÔÛÇ]/)
        expect(text, where).toMatch(/[^.]\.$/)
        expect(text, where).not.toMatch(/ {2}|\s[.,]|'/)
        for (const word of forbidden) expect(text, where).not.toMatch(word)
      }
    }
  }
}
