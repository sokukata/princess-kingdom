import { mulberry32, shuffle } from '../../../shared/random.ts'
import {
  bandOf,
  bank,
  combinations,
  conclusions,
  encouragements,
  neutralOpenings,
  openings,
  type Band,
} from './bank/index.ts'
import { criteria } from './criteria.ts'
import type { Category, CriterionId, Gender, Level, Levels, PeriodId, Tone } from './model.ts'
import { render, usable } from './text.ts'

export interface GenerateOptions {
  gender: Gender
  period: PeriodId
  seed: number
  maxLength: number
  tone?: Tone
  highlighted?: CriterionId[]
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

const categoryOf = new Map(criteria.map((c) => [c.id, c.category]))
const criterionOrder = new Map(criteria.map((c, i) => [c.id, i]))

const isWeak = (id: CriterionId, level: Level) => (id === 'evolution' ? level === 1 : level <= 2)
// 1 for a strength, -1 for a point to improve, 0 for a neutral one ("stable").
const direction = (id: CriterionId, level: Level) => (id === 'evolution' && level === 2 ? 0 : level >= 3 ? 1 : -1)
const bandDirection = (band: Band) => ({ veryWeak: -1, weak: -1, average: 0, good: 1, excellent: 1 })[band]

// The direction the text leans to: the overall assessment when balanced, the strengths or the points to improve when
// the teacher chose another tone.
function leaning(tone: Tone, band: Band): number {
  if (tone === 'praising' || tone === 'encouraging') return 1
  if (tone === 'demanding' || tone === 'severe') return -1
  return bandDirection(band)
}

// Lower comes first: sentences in the direction of the text, then extreme levels, then key criteria.
function rank(id: CriterionId, level: Level, lean: number): number {
  const sign = direction(id, level)
  const aligned = lean === 0 || sign === lean
  return (sign === 0 ? 8 : aligned ? 0 : 4) + (level === 1 || level === 4 ? 0 : 2) + (keyCriteria.has(id) ? 0 : 1)
}

interface Candidate {
  variants: string[]
  rank: number
  order: number // place in the text: combinations first, then the criteria in the order of the list
  categories: Category[]
  direction: number
  forced: boolean // a criterion the teacher highlighted
  conclusions?: string[]
}

const stems = (sentence: string) => sentence.toLowerCase().match(/\p{L}{6,}/gu)?.map((w) => w.slice(0, 6)) ?? []
const head = (sentence: string) => sentence.split(' ').slice(0, 2).join(' ').toLowerCase()

export function generate(levels: Levels, options: GenerateOptions): string {
  const { gender, period, seed, maxLength, tone = 'balanced', highlighted = [] } = options
  const rated = (Object.entries(levels) as [CriterionId, Level][]).filter(([, level]) => level)
  if (rated.length === 0) return ''
  const random = mulberry32(seed)
  const band = bandOf(overall(levels) ?? 2.5)
  const lean = leaning(tone, band)
  // Praising and severe speak of one side only; the conclusion advises in the tones that look for what to improve.
  const oneSided = tone === 'praising' || tone === 'severe'
  const advising = tone !== 'praising' && tone !== 'encouraging'
  const forced = new Set(highlighted.filter((id) => levels[id]))
  const sentences: string[] = []
  const body: Candidate[] = []
  const bodyTexts: string[] = []

  // Variants rendered for this student, the ones repeating no word or sentence start of the text first.
  const variantsOf = (variants: string[]) => {
    const written = [...sentences, ...bodyTexts]
    const usedStems = new Set(written.flatMap(stems))
    const usedHeads = new Set(written.map(head))
    const score = (text: string) =>
      stems(text).filter((s) => usedStems.has(s)).length + (usedHeads.has(head(text)) ? 2 : 0)
    return shuffle(
      usable(variants, gender).map((v) => render(v, gender, period)),
      random,
    ).sort((a, b) => score(a) - score(b))
  }
  const length = () => [...sentences, ...bodyTexts].join(' ').length
  const fits = (variants: string[], room: number) => variantsOf(variants).find((t) => length() + 1 + t.length <= room)

  // Combinations come first, in the order of the list; their own conclusion then closes the text. One about a
  // highlighted criterion speaks for it. A combination weighs a strength against a weakness, so a one-sided tone does
  // without them and says each criterion on its own.
  const covered = new Set<CriterionId>()
  const candidates: Candidate[] = []
  for (const [i, combination] of combinations.entries()) {
    if (oneSided || !combination.matches(levels) || combination.covers.some((id) => covered.has(id))) continue
    combination.covers.forEach((id) => covered.add(id))
    const { variants, conclusions } = combination
    const rated = combination.covers.filter((id) => levels[id])
    // A combination weighs a strength against a weakness: it leads the text, except when the tone puts the strengths
    // first, where it comes after them.
    candidates.push({
      variants,
      conclusions,
      rank: lean > 0 && tone !== 'balanced' ? 6 : i - combinations.length,
      order: i - combinations.length,
      categories: [...new Set(rated.map((id) => categoryOf.get(id)!))],
      direction: 0,
      forced: rated.some((id) => forced.has(id)),
    })
  }

  // The advice of the conclusion is on the weakest criterion; a highlighted one keeps its own sentence instead.
  const weak = rated.filter(([id, level]) => isWeak(id, level) && !forced.has(id))
  const lowest = Math.min(...weak.map(([, level]) => level))
  const advised = shuffle(weak.filter(([, level]) => level === lowest), random)[0]?.[0]

  for (const [id, level] of rated) {
    // The advised criterion is said by the conclusion, except in a severe text, whose body is its weaknesses.
    if (covered.has(id) || (id === advised && advising && tone !== 'severe')) continue
    // "Stable" adds nothing to the other criteria: it is only said when nothing else is rated.
    if (id === 'evolution' && level === 2 && rated.length > 1 && !forced.has(id)) continue
    candidates.push({
      variants: bank[id].levels[level],
      rank: rank(id, level, lean),
      order: criterionOrder.get(id)!,
      categories: [categoryOf.get(id)!],
      direction: direction(id, level),
      forced: forced.has(id),
    })
  }

  // A one-sided tone keeps the sentences of its side and the highlighted criteria. A student with nothing on that side
  // gets the encouraging or demanding text instead of an empty one.
  const sided = candidates.filter((c) => c.forced || c.direction === lean)
  const restricted = oneSided && sided.some((c) => !c.forced) ? sided : candidates
  // The opening judges the whole period: a one-sided text against that judgement opens without one.
  const against = oneSided && restricted === sided && bandDirection(band) === -lean
  sentences.push(variantsOf(against ? neutralOpenings : openings[band])[0])

  const closing = (first?: Candidate): string[] => {
    if (!advising) return encouragements[band]
    if (first?.conclusions) return first.conclusions
    return advised ? bank[advised].advice! : conclusions[band]
  }
  const shortest = (variants: string[]) => Math.min(...variantsOf(variants).map((t) => t.length))
  const place = (candidate: Candidate, required: boolean) => {
    const first = body[0]
    const reserve = first ? shortest(closing(first)) + 1 : 0
    const text = fits(candidate.variants, maxLength - reserve) ?? (first && !required ? undefined : fits(candidate.variants, maxLength))
    if (!text) return false
    body.push(candidate)
    bodyTexts.push(text)
    return true
  }

  // The maximum length is what the teacher wants to fill. Highlighted criteria are placed first. Then, among the
  // sentences of the same rank, one about a category not spoken of yet comes before a second one in a category; in the
  // balanced tone, a point the other way than the assessment is kept once the main points are said. The sentences are
  // then read in the order of a report (results, work, attitude), and the conclusion closes the text when it fits.
  const pool = shuffle(restricted, random).sort((a, b) => a.rank - b.rank)
  for (const candidate of pool.filter((c) => c.forced)) place(candidate, true)
  let remaining = pool.filter((c) => !c.forced)
  const spoken = () => new Set(body.flatMap((c) => c.categories))
  const nuanced = () => lean === 0 || body.some((c) => c.direction === -lean)
  while (remaining.length > 0) {
    const news = (c: Candidate) => c.categories.some((category) => !spoken().has(category))
    const counterpoint = tone === 'balanced' && body.length >= 2 && !nuanced()
    const next =
      (counterpoint && remaining.find((c) => c.direction === -lean)) ||
      remaining.find((c) => c.rank === remaining[0].rank && news(c)) ||
      remaining[0]
    remaining = remaining.filter((c) => c !== next)
    place(next, false)
  }
  const conclusion = fits(closing(body[0]), maxLength)
  const read = body.map((c, i) => ({ text: bodyTexts[i], order: c.order })).sort((a, b) => a.order - b.order)
  sentences.push(...read.map((r) => r.text))
  if (conclusion) sentences.push(conclusion)
  return sentences.join(' ')
}

export interface StudentText {
  studentId: string
  levels: Levels
  gender: Gender
  period: PeriodId
  maxLength: number
  tone?: Tone
  highlighted?: CriterionId[]
}

export const textOf = ({ studentId, levels, gender, period, maxLength, tone, highlighted }: StudentText, reroll: number) =>
  generate(levels, { gender, period, maxLength, tone, highlighted, seed: seedOf(studentId, period, reroll) })

// "Autre formulation" skips the seeds that give the current text again, when the bank allows another one.
export function nextReroll(student: StudentText, reroll: number): number {
  const current = textOf(student, reroll)
  for (let next = reroll + 1; next <= reroll + 20; next++) if (textOf(student, next) !== current) return next
  return reroll + 1
}
