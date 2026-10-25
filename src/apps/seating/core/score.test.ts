import { describe, expect, it } from 'vitest'
import { compile, fillCost } from './compile.ts'
import { randomSeating, realisticClass } from './fixtures.ts'
import type { Seating } from './model.ts'
import { mulberry32 } from './random.ts'
import { applyMove, cost, explain, fromSeating, moveDelta, toSeating } from './score.ts'

// Seats two tablemates of the last validated plan together again at the first table, on a full plan.
function withPreviousTablemates(seating: Seating, last: Seating): Seating {
  const left = Object.keys(last).find((key) => key.endsWith('-0') && last[key.slice(0, -1) + '1'])!
  const result = { ...seating }
  for (const [id, target] of [
    [last[left], '0-0-0'],
    [last[left.slice(0, -1) + '1'], '0-0-1'],
  ]) {
    const from = Object.keys(result).find((key) => result[key] === id)!
    result[from] = result[target]
    result[target] = id
  }
  return result
}

describe('score', () => {
  const { students, config } = realisticClass()
  config.room.disabledSeats = ['1-1-0', '3-2-1', '5-0-0', '5-0-1'] // two single desks, one table removed
  const { problem } = compile(students, config)
  const seating = withPreviousTablemates(randomSeating(students, config.room, 7), config.history.at(-1)!.seating)

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
    const fill = students.reduce((sum, _, x) => sum + fillCost(problem.seats[a.seatOf[x]].row), 0)
    expect(new Set(issues.map((issue) => issue.kind))).toEqual(
      new Set(['front', 'rotation', 'separate', 'together', 'mix', 'previous']),
    )
    expect(cost(problem, a)).toBeCloseTo(issues.reduce((sum, issue) => sum + issue.points, 0) + fill, 9)
  })

  it('converts a seating back and forth', () => {
    expect(toSeating(problem, fromSeating(problem, seating))).toEqual(seating)
  })
})
