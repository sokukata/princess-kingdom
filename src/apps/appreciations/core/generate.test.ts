import { describe, expect, it } from 'vitest'
import { combinations } from './bank/index.ts'
import { criteria } from './criteria.ts'
import { generate, nextReroll, overall, seedOf, textOf, type GenerateOptions, type StudentText } from './generate.ts'
import type { Gender, Level, Levels } from './model.ts'
import { forbidden } from './text.ts'

const options = (seed: number, gender: Gender | 'none' = 'F', maxLength = 200): GenerateOptions => ({
  gender: gender === 'none' ? undefined : gender,
  period: 'T1',
  seed,
  maxLength,
})

// Deterministic pseudo-random profiles, each rating a random subset of the criteria.
function profiles(count: number): Levels[] {
  return Array.from({ length: count }, (_, n) => {
    const levels: Levels = {}
    criteria.forEach((c, i) => {
      const value = seedOf(n, i) % 6
      if (value >= 1 && value <= 4) levels[c.id] = value as Level
    })
    return levels
  })
}

const personal = /\b(Elle|Il (?!faut))/
const sentences = (text: string) => text.match(/[^.]+\./g) ?? []

describe('generate', () => {
  it('writes nothing without any rated criterion', () => {
    expect(generate({}, options(1))).toBe('')
  })

  it('counts results double in the overall level, and leaves the trend out', () => {
    expect(overall({ results: 4, homework: 1 })).toBe(3)
    expect(overall({ evolution: 1, homework: 3 })).toBe(3)
    expect(overall({ evolution: 4 })).toBeUndefined()
  })

  it('gives the same text for the same seed, and mostly different texts across students', () => {
    const levels: Levels = { results: 3, homework: 2, participation: 4, behaviour: 3, method: 3 }
    expect(generate(levels, options(42))).toBe(generate(levels, options(42)))
    const text = (student: string) => generate(levels, options(seedOf(student, 'T1', 0)))
    const differing = Array.from({ length: 100 }, (_, n) => text(`a${n}`) !== text(`b${n}`)).filter(Boolean)
    expect(differing.length).toBeGreaterThan(90)
  })

  it('writes two or three clean sentences, within the maximum length', () => {
    for (const [n, levels] of profiles(400).entries()) {
      for (const gender of ['F', 'M', 'none'] as const) {
        for (const maxLength of [120, 200, 300]) {
          const text = generate(levels, options(n, gender, maxLength))
          if (Object.keys(levels).length === 0) continue
          expect(text.length, text).toBeLessThanOrEqual(maxLength)
          expect(sentences(text).length, text).toBeGreaterThanOrEqual(2)
          expect(sentences(text).length, text).toBeLessThanOrEqual(3)
          expect(text, text).not.toMatch(/[{}|!]/)
          for (const word of forbidden) expect(text).not.toMatch(word)
          if (gender === 'none') expect(text, text).not.toMatch(personal)
        }
      }
    }
  })

  it('agrees with the gender', () => {
    const levels: Levels = { attention: 3 }
    const texts = (gender: Gender | 'none') =>
      Array.from({ length: 20 }, (_, n) => generate(levels, options(n, gender, 300)))
    expect(texts('F').some((t) => t.includes('Elle est attentive en classe.'))).toBe(true)
    expect(texts('M').some((t) => t.includes('Il est attentif en classe.'))).toBe(true)
    expect(texts('none').some((t) => personal.test(t))).toBe(false)
  })

  it('puts a combination first and does not repeat the criteria it covers', () => {
    const levels: Levels = { abilities: 4, homework: 1, involvement: 2, participation: 3 }
    const capable = combinations.find((c) => c.id === 'capableButNotWorking')!.variants
    for (let seed = 0; seed < 20; seed++) {
      const text = generate(levels, options(seed))
      expect(capable.some((v) => text.includes(v)), text).toBe(true)
      expect(text).not.toMatch(/Les capacités sont remarquables|L’investissement reste/)
    }
  })

  it('advises on the weakest criterion in the conclusion', () => {
    const text = generate({ results: 3, punctuality: 1, participation: 3 }, options(3))
    expect(text).toMatch(/(Il faut arriver à l’heure en cours|Une meilleure ponctualité est attendue)\.$/)
  })

  it('names the period', () => {
    const levels: Levels = { results: 4, homework: 4, participation: 4 }
    expect(generate(levels, { ...options(1), period: 'S2' })).toMatch(/semestre/i)
    expect(generate(levels, { ...options(1), period: 'S2' })).not.toMatch(/trimestre/i)
  })

  it('finds another wording on reroll', () => {
    const levels: Levels = { results: 2, evolution: 4 }
    const student: StudentText = { studentId: 'x', levels, gender: 'F', period: 'T1', maxLength: 200 }
    for (let reroll = 0; reroll < 10; reroll++) {
      expect(textOf(student, nextReroll(student, reroll))).not.toBe(textOf(student, reroll))
    }
  })
})
