import type { Student } from '../../../shared/classes/model.ts'
import type { ClassAppreciations, Levels, StudentEntry } from '../core/model.ts'
import { textOf, type StudentText } from '../core/generate.ts'

export type Status = 'unrated' | 'generated' | 'edited'

export const statusLabels: Record<Status, string> = { unrated: 'Non évalué', generated: 'Généré', edited: 'Modifié' }

export interface Appreciation {
  status: Status
  text: string
  source: StudentText
  reroll: number
}

// Hidden criteria are not used by the class, so their old levels do not count either.
export function appreciationOf(student: Student, entry: StudentEntry, config: ClassAppreciations): Appreciation {
  const levels: Levels = Object.fromEntries(
    Object.entries(entry.levels).filter(([id]) => !config.hidden.includes(id as keyof Levels)),
  )
  const { period, maxLength } = config
  const source = { studentId: student.id, levels, gender: student.gender, period, maxLength }
  const reroll = entry.reroll ?? 0
  if (entry.text !== undefined) return { status: 'edited', text: entry.text, source, reroll }
  if (Object.keys(levels).length === 0) return { status: 'unrated', text: '', source, reroll }
  return { status: 'generated', text: textOf(source, reroll), source, reroll }
}
