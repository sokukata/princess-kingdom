import { describe, expect, it } from 'vitest'
import { mulberry32, shuffle } from '../../../shared/random.ts'
import { compile } from './compile.ts'
import { makeConfig, makeStudents } from './fixtures.ts'
import { cost, explain, fromGrouping, swap, swapDelta, toGrouping, type Groups } from './score.ts'

const two = { by: 'size' as const, n: 2, extra: 'enlarge' as const }
const problemOf = (config: Parameters<typeof makeConfig>[0], count = 8, girls = 4) =>
  compile(makeStudents(count, girls), makeConfig({ sizing: two, ...config })).problem

describe('cost', () => {
  it('charges 50 per split "together" pair and nothing when they are reunited', () => {
    const p = problemOf({ rules: [{ kind: 'together', ids: ['s0', 's1'] }] })
    expect(cost(p, [[0, 1], [2, 3], [4, 5], [6, 7]])).toBe(0)
    expect(cost(p, [[0, 2], [1, 3], [4, 5], [6, 7]])).toBe(50)
  })

  it('charges 100 per reunited "separate" pair', () => {
    const p = problemOf({ rules: [{ kind: 'separate', ids: ['s0', 's1', 's2'] }] })
    expect(cost(p, [[0, 1], [2, 3], [4, 5], [6, 7]])).toBe(100)
    expect(cost(p, [[0, 1, 2], [3, 4], [5, 6], [7]])).toBe(300)
    expect(cost(p, [[0, 3], [1, 4], [2, 5], [6, 7]])).toBe(0)
  })

  it('charges the gap to the class proportion of girls', () => {
    const p = problemOf({ mixGender: true })
    // 4 girls out of 8: each pair should hold one girl.
    expect(cost(p, [[0, 4], [1, 5], [2, 6], [3, 7]])).toBe(0)
    expect(cost(p, [[0, 1], [2, 3], [4, 5], [6, 7]])).toBe(4 * 20 * 1)
  })

  it('charges former teammates 15, 10 and 5 from the most recent grouping', () => {
    const history = [
      { date: '', grouping: { groups: [['s0', 's1']] } },
      { date: '', grouping: { groups: [['s2', 's3']] } },
      { date: '', grouping: { groups: [['s4', 's5']] } },
    ]
    const p = problemOf({ history })
    expect(cost(p, [[0, 1], [2, 3], [4, 5], [6, 7]])).toBe(5 + 10 + 15)
  })

  it('prefers mixed levels in "mixed" mode and close levels in "tiered" mode', () => {
    const levels = { s0: 3 as const, s1: 3 as const, s2: 1 as const, s3: 1 as const }
    const mixed = problemOf({ levels, levelMode: 'mixed' }, 4, 2)
    const tiered = problemOf({ levels, levelMode: 'tiered' }, 4, 2)
    const together: Groups = [[0, 1], [2, 3]]
    const split: Groups = [[0, 2], [1, 3]]
    expect(cost(mixed, split)).toBeLessThan(cost(mixed, together))
    expect(cost(tiered, together)).toBeLessThan(cost(tiered, split))
  })
})

describe('swapDelta', () => {
  it('equals the difference of full recomputations, with every option on', () => {
    const levels = { s0: 1 as const, s1: 2 as const, s2: 3 as const, s3: 3 as const, s4: 1 as const, s9: 2 as const }
    const rules = [
      { kind: 'together' as const, ids: ['s0', 's5', 's7'] },
      { kind: 'separate' as const, ids: ['s1', 's2', 's3'] },
      { kind: 'separate' as const, ids: ['s4', 's5'] },
    ]
    const history = [{ date: '', grouping: { groups: [['s0', 's1', 's2'], ['s3', 's4', 's5']] } }]
    for (const levelMode of ['mixed', 'tiered'] as const) {
      const p = problemOf({ rules, levels, levelMode, mixGender: true, history, sizing: { by: 'size', n: 3, extra: 'enlarge' } }, 11, 5)
      const random = mulberry32(7)
      const groups: Groups = p.sizes.map(() => [])
      const order = shuffle(p.students.map((_, x) => x), random)
      let next = 0
      p.sizes.forEach((size, g) => groups[g].push(...order.slice(next, (next += size))))
      for (let k = 0; k < 300; k++) {
        const a = Math.floor(random() * groups.length)
        const b = (a + 1 + Math.floor(random() * (groups.length - 1))) % groups.length
        const i = Math.floor(random() * groups[a].length)
        const j = Math.floor(random() * groups[b].length)
        const before = cost(p, groups)
        const delta = swapDelta(p, groups, a, i, b, j)
        swap(groups, a, i, b, j)
        expect(cost(p, groups) - before).toBeCloseTo(delta, 6)
      }
    }
  })
})

describe('explain', () => {
  it('names the broken rules in French', () => {
    const rules = [
      { kind: 'separate' as const, ids: ['s0', 's1'] },
      { kind: 'together' as const, ids: ['s2', 's3'] },
    ]
    const p = problemOf({ rules })
    const messages = explain(p, [[0, 1], [2, 4], [3, 5], [6, 7]]).map((i) => i.message)
    expect(messages).toEqual([
      'Élève 0 et Élève 1 (à séparer) sont dans le même groupe',
      'Élève 2 et Élève 3 (ensemble) sont dans des groupes différents',
    ])
  })

  it('reports nothing for a grouping that follows every rule', () => {
    const p = problemOf({ mixGender: true, rules: [{ kind: 'separate', ids: ['s0', 's1'] }] })
    expect(explain(p, [[0, 4], [1, 5], [2, 6], [3, 7]])).toEqual([])
  })

  it('explains a gender imbalance', () => {
    const p = problemOf({ mixGender: true })
    const issues = explain(p, [[0, 1], [2, 3], [4, 5], [6, 7]])
    expect(issues[0].message).toBe('Groupe 1 : 2 filles et 0 garçon')
  })
})

describe('grouping conversion', () => {
  it('round-trips and drops students who are no longer present', () => {
    const p = problemOf({ absent: ['s7'] })
    const groups = [[0, 1], [2, 3], [4, 5], [6]]
    const grouping = toGrouping(p, groups)
    expect(fromGrouping(p, grouping)).toEqual(groups)
    expect(fromGrouping(p, { groups: [['s0', 'gone', 's7']] })).toEqual([[0]])
  })
})
