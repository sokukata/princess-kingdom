import { describe, expect, it } from 'vitest'
import { compile } from './compile.ts'
import { makeConfig, makeStudents } from './fixtures.ts'

describe('compile', () => {
  it('excludes the absent students and sizes the groups from the present ones', () => {
    const students = makeStudents(14)
    const { problem } = compile(students, makeConfig({ absent: ['s0', 's1'] }))
    expect(problem.students.map((s) => s.id)).not.toContain('s0')
    expect(problem.students).toHaveLength(12)
    expect(problem.sizes).toEqual([4, 4, 4])
  })

  it('blocks when nobody is present', () => {
    const students = makeStudents(2)
    expect(compile(students, makeConfig({ absent: ['s0', 's1'] })).blocking).toMatch(/Aucun élève présent/)
  })

  it('warns when an "ensemble" rule is larger than the groups', () => {
    const students = makeStudents(12)
    const rules = [{ kind: 'together' as const, ids: ['s0', 's1', 's2', 's3', 's4'] }]
    const { warnings } = compile(students, makeConfig({ rules }))
    expect(warnings.some((w) => w.startsWith('Ensemble'))).toBe(true)
    const small = [{ kind: 'together' as const, ids: ['s0', 's1', 's2', 's3'] }]
    expect(compile(students, makeConfig({ rules: small })).warnings).toEqual([])
  })

  it('warns when a pair is both together and separate', () => {
    const students = makeStudents(8)
    const rules = [
      { kind: 'together' as const, ids: ['s0', 's1'] },
      { kind: 'separate' as const, ids: ['s1', 's0', 's2'] },
    ]
    const { warnings } = compile(students, makeConfig({ rules }))
    expect(warnings).toEqual(['Élève 0 et Élève 1 sont à la fois « Ensemble » et « À séparer ».'])
  })

  it('ignores the rule members that are absent or removed', () => {
    const students = makeStudents(8)
    const rules = [{ kind: 'separate' as const, ids: ['s0', 'gone', 's1'] }]
    const { problem } = compile(students, makeConfig({ rules, absent: ['s1'] }))
    expect(problem.separate.some((v) => v)).toBe(false)
  })

  it('counts a rule of several students as every pair', () => {
    const students = makeStudents(8)
    const rules = [{ kind: 'separate' as const, ids: ['s0', 's1', 's2'] }]
    const { problem } = compile(students, makeConfig({ rules }))
    expect(problem.separate.reduce((a, b) => a + b, 0)).toBe(6)
  })

  it('weights the three last validated groupings 15, 10, 5 and forgets the older ones', () => {
    const students = makeStudents(4)
    const g = (groups: string[][]) => ({ date: '', grouping: { groups } })
    const history = [g([['s2', 's3']]), g([['s0', 's1']]), g([['s0', 's1']]), g([['s0', 's1']])]
    const { problem } = compile(students, makeConfig({ history, sizing: { by: 'size', n: 2, extra: 'enlarge' } }))
    expect(problem.previous[1]).toBe(15 + 10 + 5)
    expect(problem.previous[2 * 4 + 3]).toBe(0)
    expect(compile(students, makeConfig({ history, avoidPrevious: false })).problem.previous[1]).toBe(0)
  })

  it('warns when the options have nothing to work on', () => {
    const students = makeStudents(6).map((s) => ({ ...s, gender: undefined }))
    const { warnings } = compile(students, makeConfig({ mixGender: true, levelMode: 'mixed' }))
    expect(warnings).toHaveLength(2)
  })
})
