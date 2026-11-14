import type { StudentId } from '../../../shared/classes/model.ts'

export type Rule = { kind: 'together' | 'separate'; ids: StudentId[] }

export type Level = 1 | 2 | 3 // 1: en difficulté, 2: moyen, 3: à l'aise

export interface GroupSizing {
  by: 'size' | 'count' // n students per group, or n groups
  n: number
  extra: 'enlarge' | 'smaller' // by size only: the remaining students enlarge groups, or form smaller ones
}

export interface Grouping {
  groups: StudentId[][]
  roles?: string[][] // same shape as groups: the role of each student, '' for none
}

export interface GroupsConfig {
  sizing: GroupSizing
  absent: StudentId[]
  rules: Rule[]
  mixGender: boolean
  levelMode: 'off' | 'mixed' | 'tiered'
  levels: Record<StudentId, Level>
  avoidPrevious: boolean
  useRoles: boolean
  roleNames: string[]
  current?: Grouping
  history: { date: string; grouping: Grouping }[] // validated groupings, most recent last
}

export const DEFAULT_ROLES = ['Secrétaire', 'Porte-parole', 'Gestion du temps', 'Animation']

export function defaultConfig(): GroupsConfig {
  return {
    sizing: { by: 'size', n: 4, extra: 'enlarge' },
    absent: [],
    rules: [],
    mixGender: false,
    levelMode: 'off',
    levels: {},
    avoidPrevious: true,
    useRoles: false,
    roleNames: DEFAULT_ROLES,
    history: [],
  }
}
