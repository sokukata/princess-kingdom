import { mulberry32, shuffle } from '../../../shared/random.ts'
import { bandOf, bank, combinations, conclusions, openings, type Band } from './bank/index.ts'
import { criteria } from './criteria.ts'
import type { CriterionId, Gender, Level, Levels, PeriodId } from './model.ts'
import { render, usable } from './text.ts'

export interface GenerateOptions {
  gender: Gender
  period: PeriodId
  seed: number
  maxLength: number
}

// FNV-1a, so that a student keeps the same text on reload and two students get different ones.
export function seedOf(...parts: (string | number)[]): number {
  let hash = 2166136261
  for (const char of parts.join('|')) hash = Math.imul(hash ^ char.charCodeAt(0), 16777619)
  return hash >>> 0
}

// Mean of the rated levels, results counting double; evolution is a trend, not a level, and is left out.
export function overall(levels: Levels): number | undefined {
  let sum = 0
  let weight = 0
  for (const [id, level] of Object.entries(levels) as [CriterionId, Level][]) {
    if (id === 'evolution') continue
    const w = id === 'results' ? 2 : 1
    sum += w * level
    weight += w
  }
  return weight ? sum / weight : undefined
}

// The criteria a short comment speaks of first, other things being equal.
const keyCriteria = new Set<CriterionId>([
  'results',
  'evolution',
  'abilities',
  'knowledge',
  'method',
  'homework',
  'involvement',
  'assignments',
  'participation',
  'attention',
  'behaviour',
  'attendance',
])

const isWeak = (id: CriterionId, level: Level) => (id === 'evolution' ? level === 1 : level <= 2)
const direction = (id: CriterionId, level: Level) => (id === 'evolution' && level === 2 ? 0 : level >= 3 ? 1 : -1)
const bandDirection = (band: Band) => ({ veryWeak: -1, weak: -1, average: 0, good: 1, excellent: 1 })[band]

// Sentences that agree with the overall assessment come first, then extreme levels, then key criteria.
function rank(id: CriterionId, level: Level, band: Band): number {
  const sign = direction(id, level)
  const aligned = bandDirection(band) === 0 || sign === bandDirection(band)
  return 1 + (sign === 0 ? 8 : aligned ? 0 : 4) + (level === 1 || level === 4 ? 0 : 2) + (keyCriteria.has(id) ? 0 : 1)
}

interface Candidate {
  variants: string[]
  rank: number
  order: number // place in the text: combinations first, then the criteria in the order of the list
  conclusions?: string[]
}

const criterionOrder = new Map(criteria.map((c, i) => [c.id, i]))

const stems = (sentence: string) => sentence.toLowerCase().match(/\p{L}{6,}/gu)?.map((w) => w.slice(0, 6)) ?? []
const head = (sentence: string) => sentence.split(' ').slice(0, 2).join(' ').toLowerCase()

export function generate(levels: Levels, { gender, period, seed, maxLength }: GenerateOptions): string {
  const rated = (Object.entries(levels) as [CriterionId, Level][]).filter(([, level]) => level)
  if (rated.length === 0) return ''
  const random = mulberry32(seed)
  const band = bandOf(overall(levels) ?? 2.5)
  const sentences: string[] = []
  const body: { text: string; order: number }[] = []

  // Variants rendered for this student, the ones repeating no word or sentence start of the text first.
  const options = (variants: string[]) => {
    const written = [...sentences, ...body.map((b) => b.text)]
    const usedStems = new Set(written.flatMap(stems))
    const usedHeads = new Set(written.map(head))
    const score = (text: string) =>
      stems(text).filter((s) => usedStems.has(s)).length + (usedHeads.has(head(text)) ? 2 : 0)
    return shuffle(
      usable(variants, gender).map((v) => render(v, gender, period)),
      random,
    ).sort((a, b) => score(a) - score(b))
  }
  sentences.push(options(openings[band])[0])
  const length = () => [...sentences, ...body.map((b) => b.text)].join(' ').length
  const fits = (variants: string[], room: number) => options(variants).find((t) => length() + 1 + t.length <= room)

  // Combinations come first, in the order of the list; their own conclusion then closes the text.
  const covered = new Set<CriterionId>()
  const candidates: Candidate[] = []
  for (const [i, combination] of combinations.entries()) {
    if (!combination.matches(levels) || combination.covers.some((id) => covered.has(id))) continue
    combination.covers.forEach((id) => covered.add(id))
    const { variants, conclusions } = combination
    candidates.push({ variants, conclusions, rank: i - combinations.length, order: i - combinations.length })
  }

  const weak = rated.filter(([id, level]) => isWeak(id, level))
  const lowest = Math.min(...weak.map(([, level]) => level))
  const advised = shuffle(weak.filter(([, level]) => level === lowest), random)[0]?.[0]

  for (const [id, level] of rated) {
    if (covered.has(id) || id === advised) continue
    // "Stable" adds nothing to the other criteria: it is only said when nothing else is rated.
    if (id === 'evolution' && level === 2 && rated.length > 1) continue
    candidates.push({ variants: bank[id].levels[level], rank: rank(id, level, band), order: criterionOrder.get(id)! })
  }

  // The maximum length is what the teacher wants to fill: the most telling sentences are picked first, as many as fit
  // while keeping room for the conclusion, then read in the order of a report (results, work, attitude). The
  // conclusion closes the text when it fits. Each criterion is said once.
  const ordered = shuffle(candidates, random).sort((a, b) => a.rank - b.rank)
  const closing = (first?: Candidate) => first?.conclusions ?? (advised ? bank[advised].advice! : conclusions[band])
  const shortest = (variants: string[]) => Math.min(...options(variants).map((t) => t.length))
  let first: Candidate | undefined
  for (const candidate of ordered) {
    const reserve = first ? shortest(closing(first)) + 1 : 0
    const text = fits(candidate.variants, maxLength - reserve) ?? (first ? undefined : fits(candidate.variants, maxLength))
    if (!text) continue
    body.push({ text, order: candidate.order })
    first ??= candidate
  }
  const conclusion = fits(closing(first), maxLength)
  sentences.push(...body.sort((a, b) => a.order - b.order).map((b) => b.text))
  if (conclusion) sentences.push(conclusion)
  return sentences.join(' ')
}

export interface StudentText {
  studentId: string
  levels: Levels
  gender: Gender
  period: PeriodId
  maxLength: number
}

export const textOf = ({ studentId, levels, gender, period, maxLength }: StudentText, reroll: number) =>
  generate(levels, { gender, period, maxLength, seed: seedOf(studentId, period, reroll) })

// "Autre formulation" skips the seeds that give the current text again, when the bank allows another one.
export function nextReroll(student: StudentText, reroll: number): number {
  const current = textOf(student, reroll)
  for (let next = reroll + 1; next <= reroll + 20; next++) if (textOf(student, next) !== current) return next
  return reroll + 1
}
