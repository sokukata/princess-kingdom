import { describe, expect, it } from 'vitest'
import type { Student } from '../../../shared/classes/model.ts'
import { backness, compile, type Problem } from './compile.ts'
import { makeConfig, makeRoom, makeStudents, randomSeating, realisticClass } from './fixtures.ts'
import type { SeatingConfig } from './model.ts'
import { parseSeatKey, range } from './room.ts'
import { cost, emptyAssignment, explain, moveDelta, place, toSeating } from './score.ts'
import { solve } from './solver.ts'

function bruteForceOptimum(p: Problem): number {
  const a = emptyAssignment(p)
  p.pinned.forEach((seat, x) => {
    if (seat >= 0) place(a, x, seat)
  })
  let best = Infinity
  const visit = (x: number): void => {
    if (x === p.students.length) {
      best = Math.min(best, cost(p, a))
      return
    }
    if (p.pinned[x] >= 0) return visit(x + 1)
    for (let seat = 0; seat < p.seats.length; seat++) {
      if (a.occupant[seat] >= 0) continue
      place(a, x, seat)
      visit(x + 1)
      a.occupant[seat] = -1
      a.seatOf[x] = -1
    }
  }
  visit(0)
  return best
}

const solved = (students: Student[], config: SeatingConfig, seed = 1) => {
  const { problem } = compile(students, config)
  const a = solve(problem, { seed })
  return { problem, a, issues: explain(problem, a) }
}

describe('solve', () => {
  it('returns a valid plan that no single swap improves', () => {
    const { students, config } = realisticClass()
    const disabledSeats = ['2-1-0', '2-1-1', '5-0-1']
    config.room.disabledSeats = disabledSeats
    config.pins = { s3: '1-2-1', s4: '4-0-0' }
    const { problem, a } = solved(students, config)

    expect([...a.seatOf].every((seat, x) => seat >= 0 && a.occupant[seat] === x)).toBe(true)
    expect(new Set(a.seatOf).size).toBe(students.length)
    expect(problem.seats[a.seatOf[3]].key).toBe('1-2-1')
    expect(problem.seats[a.seatOf[4]].key).toBe('4-0-0')
    expect(Object.keys(toSeating(problem, a)).filter((key) => disabledSeats.includes(key))).toEqual([])
    const movable = range(problem.seats.length).filter((seat) => !problem.pinned.includes(seat))
    for (const s1 of movable) {
      for (const s2 of movable) if (s1 < s2) expect(moveDelta(problem, a, s1, s2)).toBeGreaterThan(-1e-9)
    }
  })

  it.each([
    ['2 rows × 2 tables, 7 students', makeRoom(2, 2), 7],
    ['4 rows × 1 table, 6 students', makeRoom(4, 1), 6],
    ['2 rows × 2 tables with a single desk, 7 students', { ...makeRoom(2, 2), disabledSeats: ['0-1-1'] }, 7],
  ])('finds the brute-force optimum on %s', (_, room, count) => {
    const students = makeStudents(count)
    const config = makeConfig({
      room,
      front: ['s2', 's5'],
      rules: [
        { kind: 'separate', ids: ['s0', 's1'] },
        { kind: 'separate', ids: ['s2', 's3', 's4'] },
        { kind: 'together', ids: ['s5', count === 7 ? 's6' : 's0'] },
      ],
      mixGender: true,
      avoidPreviousNeighbours: true,
      rotateFrontBack: true,
      pins: { s1: '1-0-1' },
      history: [{ date: '2026-09-01', seating: randomSeating(students, room, 5) }],
    })
    const { problem } = compile(students, config)
    const optimum = bruteForceOptimum(problem)
    for (let seed = 1; seed <= 20; seed++) expect(cost(problem, solve(problem, { seed }))).toBeCloseTo(optimum, 9)
  })

  it('separates disjoint pairs completely when there are enough rows', () => {
    const students = makeStudents(24)
    const rules = range(6).map((i) => ({ kind: 'separate' as const, ids: [`s${2 * i}`, `s${2 * i + 1}`] }))
    const { issues } = solved(students, makeConfig({ room: makeRoom(4, 3), rules }))
    expect(issues.filter((issue) => issue.kind === 'separate')).toEqual([])
  })

  it('puts two students one row apart on opposite sides of the room', () => {
    const { problem, a } = solved(makeStudents(12), makeConfig({ room: makeRoom(2, 3), rules: [{ kind: 'separate', ids: ['s0', 's1'] }] }))
    const [first, second] = [problem.seats[a.seatOf[0]], problem.seats[a.seatOf[1]]]
    expect(Math.abs(first.row - second.row)).toBe(1)
    expect(Math.abs(2 * first.table + first.side - (2 * second.table + second.side))).toBe(5)
  })

  it('finds plans of the same quality whatever the seed, fast enough', () => {
    const { students, config } = realisticClass()
    const { problem } = compile(students, config)
    const costs: number[] = []
    let slowest = 0
    for (let seed = 1; seed <= 50; seed++) {
      const start = performance.now()
      costs.push(cost(problem, solve(problem, { seed })))
      slowest = Math.max(slowest, performance.now() - start)
    }
    const best = Math.min(...costs)
    console.info(`best ${best}, worst ${Math.max(...costs)}, slowest solve ${slowest.toFixed(0)} ms`)
    expect(Math.max(...costs)).toBeLessThanOrEqual(best + Math.max(0.03 * best, 5))
    expect(slowest).toBeLessThan(300)
  }, 60_000)

  it('gives a different plan for each seed', () => {
    const { students, config } = realisticClass()
    const { problem } = compile(students, config)
    const plans = new Set(range(10).map((seed) => JSON.stringify(toSeating(problem, solve(problem, { seed })))))
    expect(plans.size).toBeGreaterThanOrEqual(8)
  })

  it('seats each pair of the binômes at the same table', () => {
    const rules = [
      { kind: 'together' as const, ids: ['s0', 's1'] as [string, string] },
      { kind: 'together' as const, ids: ['s2', 's3'] as [string, string] },
    ]
    const { issues } = solved(makeStudents(20), makeConfig({ rules }))
    expect(issues).toEqual([])
  })

  it('puts the front students in the first two rows when there is room', () => {
    const front = ['s3', 's8', 's11', 's19']
    const { problem, a } = solved(makeStudents(20), makeConfig({ front }))
    for (const id of front) expect(problem.seats[a.seatOf[problem.studentIndex.get(id)!]].row).toBeLessThanOrEqual(1)
  })

  it('changes every tablemate of the last validated plan', () => {
    const students = makeStudents(28)
    const room = makeRoom(5, 3)
    const config = makeConfig({
      room,
      avoidPreviousNeighbours: true,
      history: [{ date: '2026-09-01', seating: randomSeating(students, room, 3) }],
    })
    expect(solved(students, config).issues).toEqual([])
  })

  it('keeps a binôme together without counting them as previous tablemates', () => {
    const students = makeStudents(10)
    const config = makeConfig({
      rules: [{ kind: 'together', ids: ['s0', 's1'] }],
      avoidPreviousNeighbours: true,
      history: [{ date: '2026-09-01', seating: { '0-0-0': 's0', '0-0-1': 's1' } }],
    })
    expect(solved(students, config).issues).toEqual([])
  })

  it('brings the back rows of the last validated plan to the front half', () => {
    const students = makeStudents(30)
    const room = makeRoom(5, 3)
    const previous = randomSeating(students, room, 4)
    const { problem, a, issues } = solved(students, makeConfig({ room, rotateFrontBack: true, history: [{ date: '2026-09-01', seating: previous }] }))
    expect(issues).toEqual([])
    for (const [key, id] of Object.entries(previous)) {
      if (parseSeatKey(key).row !== 4) continue
      expect(backness(problem.seats[a.seatOf[problem.studentIndex.get(id)!]].row, room.rows)).toBe(0)
    }
  })

  it('ignores a student removed from the class', () => {
    const config = makeConfig({
      rules: [{ kind: 'separate', ids: ['s0', 'gone'] }],
      front: ['gone'],
      pins: { gone: '0-0-0' },
      current: { '0-0-0': 'gone', '0-0-1': 's1' },
    })
    const { problem, a } = solved(makeStudents(10), config)
    expect(Object.values(toSeating(problem, a))).not.toContain('gone')
    expect(Object.keys(toSeating(problem, a))).toHaveLength(10)
  })
})
