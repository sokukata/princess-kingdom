import type { Student } from '../../../shared/classes/model.ts'
import { groupSizes } from './sizes.ts'
import type { GroupsConfig, Grouping } from './model.ts'

export const WEIGHTS = {
  together: 50, // per split pair of a "together" rule
  separate: 100, // per reunited pair of a "separate" rule
  gender: 20, // per student of gap to the class proportion of girls
  level: 10, // per level point of gap (mixed groups) or of squared deviation (tiered groups)
  previous: [15, 10, 5], // per former teammate, from the last validated grouping backwards
}

// Pairs are stored in n×n tables indexed by x * n + y, symmetric, for the present students only.
export interface Problem {
  students: Student[]
  sizes: number[]
  together: Uint8Array
  togetherDegree: Int32Array // number of "together" partners of each student
  separate: Uint8Array
  previous: Float64Array // cost of putting the pair in the same group
  gender: Int8Array // 1 for a girl, -1 for a boy, 0 unknown
  girlShare: number // among the students whose gender is known
  mixGender: boolean
  level: Uint8Array // 1 to 3, 0 unknown
  levelMean: number
  levelMode: GroupsConfig['levelMode']
}

export interface Compiled {
  problem: Problem
  warnings: string[]
  blocking?: string
}

export function compile(students: Student[], config: GroupsConfig): Compiled {
  const absent = new Set(config.absent)
  const present = students.filter((s) => !absent.has(s.id))
  const n = present.length
  const index = new Map(present.map((s, x) => [s.id, x]))
  const name = (id: string) => students.find((s) => s.id === id)?.name ?? 'élève retiré'
  const sizes = groupSizes(n, config.sizing)
  const warnings: string[] = []

  const together = new Uint8Array(n * n)
  const separate = new Uint8Array(n * n)
  const pairsOf = (ids: string[]) => {
    const xs = ids.flatMap((id) => index.get(id) ?? [])
    return xs.flatMap((x, i) => xs.slice(i + 1).map((y) => [x, y] as const))
  }
  for (const rule of config.rules) {
    const table = rule.kind === 'together' ? together : separate
    for (const [x, y] of pairsOf(rule.ids)) table[x * n + y] = table[y * n + x] = 1
  }
  for (let x = 0; x < n; x++) {
    for (let y = x + 1; y < n; y++) {
      if (together[x * n + y] && separate[x * n + y]) {
        warnings.push(`${present[x].name} et ${present[y].name} sont à la fois « Ensemble » et « À séparer ».`)
      }
    }
  }
  const largest = Math.max(0, ...sizes)
  for (const rule of config.rules) {
    const count = rule.ids.filter((id) => index.has(id)).length
    if (rule.kind === 'together' && count > largest) {
      warnings.push(
        `Ensemble : ${rule.ids.map(name).join(', ')} sont ${count}, pour des groupes de ${largest} au plus.`,
      )
    }
  }

  const previous = new Float64Array(n * n)
  if (config.avoidPrevious) addPrevious(previous, n, index, config.history.map((h) => h.grouping))

  const gender = Int8Array.from(present, (s) => (s.gender === 'F' ? 1 : s.gender === 'M' ? -1 : 0))
  const girls = gender.filter((g) => g > 0).length
  const known = gender.filter((g) => g !== 0).length
  const level = Uint8Array.from(present, (s) => config.levels[s.id] ?? 0)
  const rated = level.filter((l) => l > 0)

  if (config.mixGender && known === 0) warnings.push("La mixité F/G ne s'applique pas : renseigne F/G dans Mes classes.")
  if (config.levelMode !== 'off' && rated.length === 0) warnings.push("Aucun niveau n'est renseigné : les niveaux ne comptent pas.")

  const problem: Problem = {
    students: present,
    sizes,
    together,
    togetherDegree: Int32Array.from(present, (_, x) => together.subarray(x * n, x * n + n).reduce((a, b) => a + b, 0)),
    separate,
    previous,
    gender,
    girlShare: known ? girls / known : 0,
    mixGender: config.mixGender && known > 0,
    level,
    levelMean: rated.length ? rated.reduce((a, b) => a + b, 0) / rated.length : 0,
    levelMode: rated.length ? config.levelMode : 'off',
  }
  return { problem, warnings, blocking: n === 0 ? 'Aucun élève présent : décoche des absents.' : undefined }
}

function addPrevious(table: Float64Array, n: number, index: Map<string, number>, history: Grouping[]) {
  history.slice(-WEIGHTS.previous.length).reverse().forEach((grouping, age) => {
    for (const group of grouping.groups) {
      const xs = group.flatMap((id) => index.get(id) ?? [])
      for (const x of xs) for (const y of xs) if (x !== y) table[x * n + y] += WEIGHTS.previous[age]
    }
  })
}
