import { describe, expect, it } from 'vitest'
import { mulberry32 } from '../../../shared/random.ts'
import { compile, fillCost } from './compile.ts'
import { randomSeating, realisticClass } from './fixtures.ts'
import { aeshSeatId, type Seating } from './model.ts'
import { buildSeats } from './room.ts'
import { applyMove, cost, explain, fromSeating, moveDelta, toSeating } from './score.ts'

// Moves each student to its target seat, swapping with its occupant, if any.
function seatAt(seating: Seating, moves: [string, string][]): Seating {
  const result = { ...seating }
  for (const [id, target] of moves) {
    const from = Object.keys(result).find((key) => result[key] === id)!
    if (result[target] === undefined) delete result[from]
    else result[from] = result[target]
    result[target] = id
  }
  return result
}

// Seats two tablemates of the last validated plan together again at the first table.
function withPreviousTablemates(seating: Seating, last: Seating): Seating {
  const seated = new Set(Object.values(seating))
  const right = (key: string) => key.slice(0, -1) + '1'
  const left = Object.keys(last).find((key) => key.endsWith('-0') && seated.has(last[key]) && seated.has(last[right(key)]))!
  return seatAt(seating, [
    [last[left], '0-0-0'],
    [last[right(left)], '0-0-1'],
  ])
}

describe('score', () => {
  // 29 students and 3 AESH in the 32 seats left.
  const { config } = realisticClass()
  const students = realisticClass().students.slice(0, 29)
  config.room.disabledSeats = ['1-1-0', '3-2-1', '5-0-0', '5-0-1'] // two single desks, one table removed
  config.aesh = { s20: '', s23: 'Mme Roy', s24: '' }
  const { problem } = compile(students, config)
  const pupils = withPreviousTablemates(randomSeating(students, config.room, 7), config.history.at(-1)!.seating)
  const free = buildSeats(config.room)
    .map((seat) => seat.key)
    .filter((key) => !(key in pupils))
  const seating: Seating = {
    ...pupils,
    ...Object.fromEntries(['s20', 's23', 's24'].map((id, i) => [free[i], aeshSeatId(id)])),
  }

  it('computes the same cost change incrementally as from scratch', () => {
    const a = fromSeating(problem, seating)
    const random = mulberry32(42)
    const pick = (count: number) => Math.floor(random() * count)
    const pairTables = problem.tableSeats.filter((seats) => seats.length === 2)
    for (let k = 0; k < 5000; k++) {
      let move: number[]
      if (random() < 0.3) {
        const [t1, t2] = [pairTables[pick(pairTables.length)], pairTables[pick(pairTables.length)]]
        move = [t1[0], t2[0], t1[1], t2[1]]
      } else {
        move = [pick(problem.seats.length), pick(problem.seats.length), -1, -1]
      }
      const [s1, s2, s3, s4] = move
      if (s1 === s2) continue
      const before = cost(problem, a)
      const delta = moveDelta(problem, a, s1, s2, s3, s4)
      expect(cost(problem, a)).toBe(before)
      applyMove(a, s1, s2, s3, s4)
      expect(cost(problem, a) - before).toBeCloseTo(delta, 9)
    }
  })

  it('adds up to the explained points plus the fill cost', () => {
    const a = fromSeating(problem, seating)
    const issues = explain(problem, a)
    const fill = problem.students.reduce((sum, _, x) => sum + fillCost(problem.seats[a.seatOf[x]].row), 0)
    expect([...a.seatOf].every((seat) => seat >= 0)).toBe(true)
    expect(new Set(issues.map((issue) => issue.kind))).toEqual(
      new Set(['front', 'rotation', 'separate', 'together', 'aesh', 'mix', 'previous']),
    )
    expect(cost(problem, a)).toBeCloseTo(issues.reduce((sum, issue) => sum + issue.points, 0) + fill, 9)
  })

  it('converts a seating back and forth', () => {
    expect(toSeating(problem, fromSeating(problem, seating))).toEqual(seating)
  })
})
