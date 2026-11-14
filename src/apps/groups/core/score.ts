import { WEIGHTS, type Problem } from './compile.ts'
import type { Grouping } from './model.ts'

// A grouping is an array of groups, each one an array of student indices (into problem.students).
export type Groups = number[][]

// The cost of a group depends on its members only, so a swap changes the total by the change of its two groups.
// A split "together" pair is seen from each of its two sides, hence half the weight on each.
export function groupCost(p: Problem, members: number[]): number {
  const n = p.students.length
  let cost = 0
  let girls = 0
  let known = 0
  let rated = 0
  let levelSum = 0
  let levelSquares = 0
  for (const x of members) {
    cost += (WEIGHTS.together / 2) * p.togetherDegree[x]
    if (p.gender[x] !== 0) {
      known++
      if (p.gender[x] > 0) girls++
    }
    if (p.level[x] > 0) {
      rated++
      levelSum += p.level[x]
      levelSquares += p.level[x] ** 2
    }
    for (const y of members) {
      if (y <= x) continue
      cost += p.previous[x * n + y]
      cost += WEIGHTS.separate * p.separate[x * n + y]
      cost -= WEIGHTS.together * p.together[x * n + y]
    }
  }
  if (p.mixGender) cost += WEIGHTS.gender * Math.abs(girls - known * p.girlShare)
  if (rated > 0) cost += levelCost(p, rated, levelSum, levelSquares)
  return cost
}

function levelCost(p: Problem, rated: number, sum: number, squares: number): number {
  if (p.levelMode === 'mixed') return WEIGHTS.level * Math.abs(sum - rated * p.levelMean)
  if (p.levelMode === 'tiered') return WEIGHTS.level * (squares - sum ** 2 / rated)
  return 0
}

export const cost = (p: Problem, groups: Groups) => groups.reduce((sum, g) => sum + groupCost(p, g), 0)

export function swap(groups: Groups, a: number, i: number, b: number, j: number) {
  const moving = groups[a][i]
  groups[a][i] = groups[b][j]
  groups[b][j] = moving
}

// Change of the total cost if the students at two positions of two different groups were swapped.
export function swapDelta(p: Problem, groups: Groups, a: number, i: number, b: number, j: number): number {
  const before = groupCost(p, groups[a]) + groupCost(p, groups[b])
  swap(groups, a, i, b, j)
  const after = groupCost(p, groups[a]) + groupCost(p, groups[b])
  swap(groups, a, i, b, j)
  return after - before
}

export interface Issue {
  kind: 'together' | 'separate' | 'previous' | 'mix'
  message: string
  points: number
}

// Students who are not in the problem (absent, removed from the class) are dropped.
export function fromGrouping(p: Problem, grouping: Grouping): Groups {
  const index = new Map(p.students.map((s, x) => [s.id, x]))
  return grouping.groups.map((g) => g.flatMap((id) => index.get(id) ?? []))
}

export function toGrouping(p: Problem, groups: Groups, roles?: string[][]): Grouping {
  return { groups: groups.map((g) => g.map((x) => p.students[x].id)), ...(roles && { roles }) }
}

const plural = (count: number, word: string) => `${count} ${word}${count > 1 ? 's' : ''}`

export function explain(p: Problem, groups: Groups): Issue[] {
  const n = p.students.length
  const issues: Issue[] = []
  const groupOf = new Map(groups.flatMap((g, i) => g.map((x) => [x, i] as const)))
  const name = (x: number) => p.students[x].name
  for (let x = 0; x < n; x++) {
    for (let y = x + 1; y < n; y++) {
      const same = groupOf.get(x) === groupOf.get(y)
      if (p.separate[x * n + y] && same) {
        issues.push({
          kind: 'separate',
          message: `${name(x)} et ${name(y)} (à séparer) sont dans le même groupe`,
          points: WEIGHTS.separate,
        })
      }
      if (p.together[x * n + y] && !same && groupOf.has(x) && groupOf.has(y)) {
        issues.push({
          kind: 'together',
          message: `${name(x)} et ${name(y)} (ensemble) sont dans des groupes différents`,
          points: WEIGHTS.together,
        })
      }
      if (same && p.previous[x * n + y] > 0) {
        issues.push({
          kind: 'previous',
          message: `${name(x)} et ${name(y)} étaient déjà ensemble dans un groupe validé récent`,
          points: p.previous[x * n + y],
        })
      }
    }
  }
  groups.forEach((g, i) => {
    const gaps: string[] = []
    let points = 0
    if (p.mixGender) {
      const known = g.filter((x) => p.gender[x] !== 0)
      const girls = known.filter((x) => p.gender[x] > 0).length
      const gap = Math.abs(girls - known.length * p.girlShare)
      if (gap >= 0.5) {
        gaps.push(`${plural(girls, 'fille')} et ${plural(known.length - girls, 'garçon')}`)
        points += WEIGHTS.gender * gap
      }
    }
    const levels = g.map((x) => p.level[x]).filter((l) => l > 0)
    if (levels.length > 0 && p.levelMode !== 'off') {
      const sum = levels.reduce((a, b) => a + b, 0)
      const levelPoints = levelCost(
        p,
        levels.length,
        sum,
        levels.reduce((a, l) => a + l * l, 0),
      )
      if (levelPoints >= 5) {
        gaps.push(p.levelMode === 'mixed' ? 'niveaux déséquilibrés' : 'niveaux trop écartés')
        points += levelPoints
      }
    }
    if (gaps.length > 0) issues.push({ kind: 'mix', message: `Groupe ${i + 1} : ${gaps.join(', ')}`, points })
  })
  return issues
}
