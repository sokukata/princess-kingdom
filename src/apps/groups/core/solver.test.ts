import { describe, expect, it } from 'vitest'
import type { Student } from '../../../shared/classes/model.ts'
import { machineSlowness } from '../../../shared/timing.ts'
import { compile } from './compile.ts'
import { makeConfig, makeStudents } from './fixtures.ts'
import type { GroupsConfig } from './model.ts'
import { cost, explain, type Groups } from './score.ts'
import { assignRoles, solve } from './solver.ts'

const solved = (students: Student[], config: GroupsConfig, seed = 1) => {
  const { problem } = compile(students, config)
  return { problem, groups: solve(problem, { seed }) }
}
const idsOf = (problem: ReturnType<typeof compile>['problem'], groups: Groups) =>
  groups.map((g) => g.map((x) => problem.students[x].id))

function bruteForceOptimum(problem: ReturnType<typeof compile>['problem']): number {
  const n = problem.students.length
  let best = Infinity
  const groups: Groups = [[], []]
  const visit = (x: number): void => {
    if (x === n) return void (best = Math.min(best, cost(problem, groups)))
    for (const g of [0, 1]) {
      if (groups[g].length === problem.sizes[g]) continue
      groups[g].push(x)
      visit(x + 1)
      groups[g].pop()
    }
  }
  visit(0)
  return best
}

describe('solve', () => {
  it('finds the optimum found by brute force, 8 students in 2 groups', () => {
    const students = makeStudents(8, 4)
    const config = makeConfig({
      sizing: { by: 'count', n: 2, extra: 'enlarge' },
      mixGender: true,
      rules: [
        { kind: 'together', ids: ['s0', 's1'] },
        { kind: 'separate', ids: ['s2', 's3', 's6'] },
        { kind: 'together', ids: ['s4', 's5'] },
      ],
      levels: { s0: 1, s1: 3, s2: 2, s3: 3, s4: 1, s5: 2, s6: 3, s7: 1 },
      levelMode: 'mixed',
      history: [{ date: '', grouping: { groups: [['s0', 's2', 's4', 's6'], ['s1', 's3', 's5', 's7']] } }],
    })
    const { problem } = compile(students, config)
    const optimum = bruteForceOptimum(problem)
    for (let seed = 1; seed <= 5; seed++) expect(cost(problem, solve(problem, { seed }))).toBeCloseTo(optimum, 6)
  })

  it('keeps every student once, in groups of the expected sizes', () => {
    const students = makeStudents(29, 15)
    const { problem, groups } = solved(students, makeConfig({ sizing: { by: 'size', n: 4, extra: 'smaller' } }))
    expect(groups.map((g) => g.length)).toEqual(problem.sizes)
    expect(groups.flat().sort((a, b) => a - b)).toEqual(problem.students.map((_, x) => x))
  })

  it('keeps the "together" students together and the "separate" ones apart', () => {
    const students = makeStudents(24)
    const config = makeConfig({
      rules: [
        { kind: 'together', ids: ['s0', 's1', 's2'] },
        { kind: 'together', ids: ['s10', 's20'] },
        { kind: 'separate', ids: ['s3', 's4', 's5', 's6', 's7', 's8'] },
        { kind: 'separate', ids: ['s0', 's10'] },
      ],
    })
    for (let seed = 1; seed <= 10; seed++) {
      const { problem, groups } = solved(students, config, seed)
      const ids = idsOf(problem, groups)
      const groupOf = (id: string) => ids.findIndex((g) => g.includes(id))
      expect(new Set(['s0', 's1', 's2'].map(groupOf)).size).toBe(1)
      expect(groupOf('s10')).toBe(groupOf('s20'))
      expect(new Set(['s3', 's4', 's5', 's6', 's7', 's8'].map(groupOf)).size).toBe(6)
      expect(groupOf('s0')).not.toBe(groupOf('s10'))
      expect(explain(problem, groups)).toEqual([])
    }
  })

  it('splits girls and boys like the class', () => {
    const students = makeStudents(24, 12)
    for (let seed = 1; seed <= 5; seed++) {
      const { problem, groups } = solved(students, makeConfig({ mixGender: true }), seed)
      for (const g of groups) expect(g.filter((x) => problem.gender[x] > 0)).toHaveLength(2)
    }
  })

  it('leaves the absent students out', () => {
    const students = makeStudents(16)
    const { problem, groups } = solved(students, makeConfig({ absent: ['s3', 's9'] }))
    const placed = idsOf(problem, groups).flat()
    expect(placed).toHaveLength(14)
    expect(placed).not.toContain('s3')
    expect(placed).not.toContain('s9')
  })

  it('puts the previous teammates in other groups when it can', () => {
    const students = makeStudents(16)
    const first = solved(students, makeConfig({ rules: [] }))
    const history = [{ date: '', grouping: { groups: idsOf(first.problem, first.groups) } }]
    for (let seed = 1; seed <= 5; seed++) {
      const { problem, groups } = solved(students, makeConfig({ history }), seed)
      expect(cost(problem, groups)).toBe(0)
    }
  })

  it('separates the levels in "tiered" mode and mixes them in "mixed" mode', () => {
    const students = makeStudents(12)
    const levels = Object.fromEntries(students.map((s, i) => [s.id, ((i % 3) + 1) as 1 | 2 | 3]))
    const sizing = { by: 'size' as const, n: 4, extra: 'enlarge' as const }
    const mixed = solved(students, makeConfig({ sizing, levels, levelMode: 'mixed' }))
    for (const g of mixed.groups) expect(g.reduce((sum, x) => sum + mixed.problem.level[x], 0)).toBe(8)
    const tiered = solved(students, makeConfig({ sizing, levels, levelMode: 'tiered' }))
    for (const g of tiered.groups) {
      const spread = g.map((x) => tiered.problem.level[x])
      expect(Math.max(...spread) - Math.min(...spread)).toBeLessThanOrEqual(1)
    }
  })

  it('gives another draw for another seed', () => {
    const students = makeStudents(24)
    const draw = (seed: number) => JSON.stringify(idsOf(...(Object.values(solved(students, makeConfig(), seed)) as [never, never])))
    expect(new Set([1, 2, 3, 4].map(draw)).size).toBeGreaterThan(1)
  })

  it('handles a single group', () => {
    const { groups } = solved(makeStudents(3), makeConfig())
    expect(groups).toHaveLength(1)
    expect(groups[0]).toHaveLength(3)
  })

  it('takes less than 100 ms for 36 students', () => {
    const students = makeStudents(36, 20)
    const config = makeConfig({
      mixGender: true,
      levelMode: 'mixed',
      levels: Object.fromEntries(students.map((s, i) => [s.id, ((i % 3) + 1) as 1 | 2 | 3])),
      rules: [
        { kind: 'together', ids: ['s0', 's1'] },
        { kind: 'separate', ids: ['s2', 's3', 's4'] },
      ],
    })
    const { problem } = compile(students, config)
    solve(problem, { seed: 1 })
    const start = performance.now()
    solve(problem, { seed: 2 })
    expect(performance.now() - start).toBeLessThan(100 * machineSlowness())
  })
})

describe('assignRoles', () => {
  it('gives each student of a group a different role, and none in the surplus', () => {
    const roles = assignRoles([[0, 1, 2, 3, 4], [5, 6]], ['A', 'B', 'C', 'D'], 3)
    expect([...roles[0]].sort()).toEqual(['', 'A', 'B', 'C', 'D'])
    expect(new Set(roles[1]).size).toBe(2)
    expect(roles[1].every((r) => r !== '')).toBe(true)
  })
})
