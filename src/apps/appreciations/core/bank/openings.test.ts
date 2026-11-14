import { describe, expect, it } from 'vitest'
import { render } from '../text.ts'
import { expectCleanSentences } from './checkBank.ts'
import { bandOf, conclusions, openings } from './openings.ts'

describe('openings and conclusions', () => {
  it('are clean sentences for every band', () => {
    for (const [band, variants] of Object.entries(openings)) expectCleanSentences(variants, `opening ${band}`)
    for (const [band, variants] of Object.entries(conclusions)) expectCleanSentences(variants, `conclusion ${band}`)
  })

  it('name the period with a capital at the start of a sentence', () => {
    expect(render('{P} fragile.', undefined, 'T2')).toBe('Trimestre fragile.')
    expect(render('Bon {p}.', undefined, 'S1')).toBe('Bon semestre.')
  })

  it('maps a mean level to a band', () => {
    expect([1, 2, 2.6, 3, 3.8].map(bandOf)).toEqual(['veryWeak', 'weak', 'average', 'good', 'excellent'])
  })
})
