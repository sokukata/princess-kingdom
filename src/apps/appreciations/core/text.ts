import type { Gender, PeriodId } from './model.ts'
import { periodNoun } from './model.ts'

const genderMarker = /\{([^{}|]*)\|([^{}|]*)\}/g

export const isNeutral = (sentence: string) => !/\{[^{}]*\|/.test(sentence)

// Without a known gender, only the variants with no marker can be used.
export const usable = (variants: string[], gender: Gender) => (gender ? variants : variants.filter(isNeutral))

// `{p}` is the period noun, `{P}` the same with a capital, for a sentence starting with it.
export function render(sentence: string, gender: Gender, period: PeriodId): string {
  const noun = periodNoun(period)
  return sentence
    .replace(genderMarker, (_, masculine: string, feminine: string) => (gender === 'F' ? feminine : masculine))
    .replaceAll('{p}', noun)
    .replaceAll('{P}', noun[0].toUpperCase() + noun.slice(1))
}

// Mentions decided by the class council, and words of the app's theme, which must never reach a school report.
export const forbidden = [
  /félicitation/i,
  /compliment/i,
  /encouragement/i,
  /avertissement/i,
  /mise en garde/i,
  /princess/i,
  /zelda/i,
  /hyrule/i,
  /\bdrag\b/i,
  /\broses?\b/i,
  /kingdom/i,
  /royaume/i,
]
