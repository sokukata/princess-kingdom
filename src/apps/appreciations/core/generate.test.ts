import { describe, expect, it } from 'vitest'
import { bank, combinations } from './bank/index.ts'
import { criteria } from './criteria.ts'
import { generate, nextReroll, overall, seedOf, textOf, type GenerateOptions, type StudentText } from './generate.ts'
import type { Gender, Level, Levels } from './model.ts'
import { forbidden, render } from './text.ts'

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

  it('writes clean sentences, within the maximum length, each one once', () => {
    for (const [n, levels] of profiles(300).entries()) {
      for (const gender of ['F', 'M', 'none'] as const) {
        for (const maxLength of [120, 200, 300, 1000]) {
          const text = generate(levels, options(n, gender, maxLength))
          if (Object.keys(levels).length === 0) continue
          expect(text.length, text).toBeLessThanOrEqual(maxLength)
          expect(sentences(text).length, text).toBeGreaterThanOrEqual(2)
          expect(new Set(sentences(text)).size, text).toBe(sentences(text).length)
          expect(text, text).not.toMatch(/[{}|!]/)
          for (const word of forbidden) expect(text).not.toMatch(word)
          if (gender === 'none') expect(text, text).not.toMatch(personal)
        }
      }
    }
  })

  it('fills the maximum length the teacher chose, as far as the rated criteria allow', () => {
    const many = profiles(300).filter((levels) => Object.keys(levels).length >= 12)
    const mean = (maxLength: number) =>
      many.reduce((sum, levels, n) => sum + generate(levels, options(n, 'F', maxLength)).length, 0) / many.length
    const [short, usual, long] = [mean(120), mean(200), mean(1000)]
    expect(short).toBeGreaterThan(0.75 * 120)
    expect(usual).toBeGreaterThan(0.85 * 200)
    expect(long).toBeGreaterThan(3 * usual)
    // With a few rated criteria only, a long limit says each of them, and no more.
    const few: Levels = { results: 3, homework: 2, participation: 4 }
    const text = generate(few, options(1, 'F', 1000))
    expect(sentences(text).length, text).toBe(4)
  })

  it('reads in the order of a report: results, then work, then attitude', () => {
    const levels: Levels = { participation: 4, homework: 3, knowledge: 3, behaviour: 3, reasoning: 4 }
    const order = ['knowledge', 'reasoning', 'homework', 'participation', 'behaviour'] as const
    for (let seed = 0; seed < 10; seed++) {
      const text = generate(levels, options(seed, 'M', 1000))
      const positions = order.map((id) =>
        Math.max(...Object.values(bank[id].levels[levels[id]!]).map((v) => text.indexOf(render(v, 'M', 'T1')))),
      )
      expect(positions.every((p) => p >= 0), text).toBe(true)
      expect([...positions].sort((a, b) => a - b), text).toEqual(positions)
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

  describe('tones and highlighted criteria', () => {
    // A very good student, chatty and disorganised; a weak student, good at speaking and well-behaved.
    const good: Levels = {
      results: 4,
      abilities: 4,
      knowledge: 4,
      method: 4,
      homework: 4,
      involvement: 4,
      assignments: 4,
      organisation: 2,
      participation: 4,
      attention: 3,
      behaviour: 2,
      respect: 4,
    }
    const weak: Levels = {
      results: 1,
      knowledge: 1,
      method: 1,
      homework: 2,
      assignments: 2,
      speaking: 4,
      participation: 4,
      behaviour: 4,
      respect: 4,
    }
    const strength = (levels: Levels, text: string) =>
      (Object.entries(levels) as [keyof Levels, Level][]).some(
        ([id, level]) => level >= 3 && bank[id].levels[level].some((v) => text.includes(render(v, 'M', 'T1'))),
      )
    const weakness = (levels: Levels, text: string) =>
      (Object.entries(levels) as [keyof Levels, Level][]).some(
        ([id, level]) => level <= 2 && bank[id].levels[level].some((v) => text.includes(render(v, 'M', 'T1'))),
      )
    const toneText = (levels: Levels, tone: GenerateOptions['tone'], seed: number, highlighted?: (keyof Levels)[]) =>
      generate(levels, { ...options(seed, 'M', 300), tone, highlighted })

    it('praising and severe speak of one side only', () => {
      for (let seed = 0; seed < 20; seed++) {
        for (const levels of [good, weak]) {
          const praising = toneText(levels, 'praising', seed)
          expect(weakness(levels, praising), praising).toBe(false)
          expect(strength(levels, praising), praising).toBe(true)
          const severe = toneText(levels, 'severe', seed)
          expect(strength(levels, severe), severe).toBe(false)
          expect(weakness(levels, severe) || /Il faut|attendu|doit/.test(severe), severe).toBe(true)
        }
      }
    })

    it('encouraging always has a strength, demanding always a point to improve, even in a short text', () => {
      // Mostly on one side, with a single point the other way.
      const struggling: Levels = { results: 1, knowledge: 1, method: 2, homework: 2, assignments: 1, respect: 3 }
      const excelling: Levels = { results: 4, knowledge: 4, method: 4, homework: 4, assignments: 4, punctuality: 2 }
      for (let seed = 0; seed < 20; seed++) {
        for (const maxLength of [120, 200]) {
          const encouraging = generate(struggling, { ...options(seed, 'M', maxLength), tone: 'encouraging' })
          expect(strength(struggling, encouraging), encouraging).toBe(true)
          const demanding = generate(excelling, { ...options(seed, 'M', maxLength), tone: 'demanding' })
          const punctuality = [...Object.values(bank.punctuality.levels).flat(), ...(bank.punctuality.advice ?? [])]
          expect(punctuality.some((v) => demanding.includes(render(v, 'M', 'T1'))), demanding).toBe(true)
        }
      }
    })

    // Sentences of the body on each side, the opening and the conclusion left out.
    const sides = (levels: Levels, text: string) => {
      const body = sentences(text).slice(1, -1)
      const said = (s: string, side: (l: Level) => boolean) =>
        (Object.entries(levels) as [keyof Levels, Level][]).some(
          ([id, level]) => side(level) && bank[id].levels[level].some((v) => s.trim() === render(v, 'M', 'T1')),
        )
      return {
        strengths: body.filter((s) => said(s, (l) => l >= 3)).length,
        weaknesses: body.filter((s) => said(s, (l) => l <= 2)).length,
      }
    }

    it('demanding is mostly strengths with one point to improve, encouraging the reverse, whatever the student', () => {
      const advice = (levels: Levels) =>
        (Object.keys(levels) as (keyof Levels)[]).flatMap((id) => bank[id].advice ?? []).map((v) => render(v, 'M', 'T1'))
      for (let seed = 0; seed < 20; seed++) {
        for (const levels of [good, weak]) {
          const demanding = toneText(levels, 'demanding', seed)
          const d = sides(levels, demanding)
          expect(d.strengths, demanding).toBeGreaterThanOrEqual(1)
          expect(d.weaknesses, demanding).toBeLessThanOrEqual(1)
          // The point to improve is a sentence of the body, or the advice that closes the text.
          expect(d.weaknesses === 1 || advice(levels).some((a) => demanding.endsWith(a)), demanding).toBe(true)

          const encouraging = toneText(levels, 'encouraging', seed)
          const e = sides(levels, encouraging)
          expect(e.weaknesses, encouraging).toBeGreaterThanOrEqual(1)
          expect(e.strengths, encouraging).toBe(1)
        }
      }
    })

    it('goes from the most positive text to the most severe along the slider', () => {
      const order = ['praising', 'demanding', 'balanced', 'encouraging', 'severe'] as const
      for (let seed = 0; seed < 10; seed++) {
        for (const levels of [good, weak]) {
          const share = order.map((tone) => {
            const { strengths, weaknesses } = sides(levels, toneText(levels, tone, seed))
            return weaknesses / Math.max(1, strengths + weaknesses)
          })
          for (let i = 1; i < share.length; i++) expect(share[i], `${order[i]}: ${share}`).toBeGreaterThanOrEqual(share[i - 1])
        }
      }
    })

    it('balanced nuances the assessment with a point the other way when there is room', () => {
      const nuanced = Array.from({ length: 20 }, (_, seed) => toneText(weak, 'balanced', seed)).filter((t) =>
        strength(weak, t),
      )
      expect(nuanced.length).toBeGreaterThanOrEqual(18)
    })

    it('opens without a judgement when a one-sided text goes against the assessment', () => {
      for (let seed = 0; seed < 10; seed++) {
        expect(toneText(weak, 'praising', seed)).not.toMatch(/^(Trimestre|Bilan) (très )?(insuffisant|fragile|difficile)/)
        expect(toneText(good, 'severe', seed)).not.toMatch(/^(Excellent|Très bon|Bon)/)
      }
    })

    it('falls back to a two-sided text when the student has nothing on the chosen side', () => {
      const excellent: Levels = { results: 4, knowledge: 4, homework: 4, participation: 4, behaviour: 4 }
      const text = toneText(excellent, 'severe', 1)
      expect(sentences(text).length, text).toBeGreaterThanOrEqual(3)
    })

    it('always speaks of a highlighted criterion, whatever the tone and the length', () => {
      const levels: Levels = { results: 3, knowledge: 3, homework: 3, participation: 3, behaviour: 3, punctuality: 4 }
      const punctual = bank.punctuality.levels[4].map((v) => render(v, 'M', 'T1'))
      for (const tone of ['praising', 'encouraging', 'balanced', 'demanding', 'severe'] as const) {
        for (let seed = 0; seed < 10; seed++) {
          const text = generate(levels, { ...options(seed, 'M', 120), tone, highlighted: ['punctuality'] })
          expect(punctual.some((v) => text.includes(v)), `${tone}: ${text}`).toBe(true)
          expect(text.length).toBeLessThanOrEqual(120)
        }
      }
    })

    it('spreads the sentences over the categories before saying more about one', () => {
      // Every criterion of each category rated alike: the first three body sentences come from three categories.
      const levels: Levels = {
        knowledge: 3,
        reasoning: 3,
        method: 3,
        homework: 3,
        involvement: 3,
        assignments: 3,
        participation: 3,
        attention: 3,
        behaviour: 3,
      }
      const categoryOfText = (text: string) =>
        criteria.find((c) => bank[c.id].levels[levels[c.id] ?? 3].some((v) => text.startsWith(render(v, 'M', 'T1'))))
          ?.category
      for (let seed = 0; seed < 10; seed++) {
        const body = sentences(generate(levels, options(seed, 'M', 200))).slice(1, -1)
        const categories = new Set(body.map((s) => categoryOfText(s.trim())))
        expect(categories.size, body.join(' ')).toBe(Math.min(3, body.length))
      }
    })
  })

  it('finds another wording on reroll', () => {
    const levels: Levels = { results: 2, evolution: 4 }
    const student: StudentText = { studentId: 'x', levels, gender: 'F', period: 'T1', maxLength: 200 }
    for (let reroll = 0; reroll < 10; reroll++) {
      expect(textOf(student, nextReroll(student, reroll))).not.toBe(textOf(student, reroll))
    }
  })
})
