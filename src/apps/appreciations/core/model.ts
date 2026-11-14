import type { StudentId } from '../../../shared/classes/model.ts'

export type Level = 1 | 2 | 3 | 4 // 1 very insufficient, 4 very good
export type Gender = 'F' | 'M' | undefined
export type Category = 'results' | 'work' | 'attitude'

export type CriterionId =
  | 'results'
  | 'evolution'
  | 'abilities'
  | 'knowledge'
  | 'reasoning'
  | 'writing'
  | 'speaking'
  | 'method'
  | 'homework'
  | 'involvement'
  | 'assignments'
  | 'organisation'
  | 'autonomy'
  | 'curiosity'
  | 'perseverance'
  | 'participation'
  | 'attention'
  | 'behaviour'
  | 'respect'
  | 'groupwork'
  | 'attendance'
  | 'punctuality'

export type Levels = Partial<Record<CriterionId, Level>>

// Sentences may hold `{masculine|feminine}` markers, and `{p}` for the period noun ("trimestre" or "semestre").
export type Variants = string[]

export interface CriterionBank {
  levels: Record<Level, Variants>
  advice?: Variants // conclusion when the criterion is the weakest lever, at level 1 or 2
}

export type PeriodId = 'T1' | 'T2' | 'T3' | 'S1' | 'S2'

export const periods: { id: PeriodId; label: string }[] = [
  { id: 'T1', label: 'Trimestre 1' },
  { id: 'T2', label: 'Trimestre 2' },
  { id: 'T3', label: 'Trimestre 3' },
  { id: 'S1', label: 'Semestre 1' },
  { id: 'S2', label: 'Semestre 2' },
]

export const periodNoun = (period: PeriodId) => (period.startsWith('T') ? 'trimestre' : 'semestre')

export function previousPeriod(period: PeriodId): PeriodId | undefined {
  return ({ T2: 'T1', T3: 'T2', S2: 'S1' } as Partial<Record<PeriodId, PeriodId>>)[period]
}

// From the most positive to the most severe. Praising: the strengths only. Encouraging: the strengths first, whatever
// the assessment. Balanced: the overall assessment, with one point the other way when there is one. Demanding: what
// is to improve first, even for a good student. Severe: what is to improve only.
export type Tone = 'praising' | 'encouraging' | 'balanced' | 'demanding' | 'severe'

export interface StudentEntry {
  levels: Levels
  tone?: Tone // balanced when missing
  highlighted?: CriterionId[] // criteria the text must speak of
  reroll?: number
  text?: string // only when the teacher edited the generated text
}

export interface ClassAppreciations {
  period: PeriodId
  hidden: CriterionId[]
  maxLength: number
  periods: Partial<Record<PeriodId, Record<StudentId, StudentEntry>>>
}

export const defaultMaxLength = 200

export const defaultClassAppreciations = (): ClassAppreciations => ({
  period: 'T1',
  hidden: [],
  maxLength: defaultMaxLength,
  periods: {},
})
