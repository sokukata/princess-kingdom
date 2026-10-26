import { describe, expect, it } from 'vitest'
import { backness, compile, frontCost, separationCost } from './compile.ts'
import { makeConfig, makeRoom, makeStudents } from './fixtures.ts'
import { buildSeats, type Seat } from './room.ts'

describe('separation cost', () => {
  const seats = buildSeats(makeRoom(5, 3))
  const at = (row: number, table: number, side: 0 | 1) =>
    seats.find((s) => s.row === row && s.table === table && s.side === side)!
  const cost = (a: Seat, b: Seat) => separationCost(a, b, 3)
  const x = (s: Seat) => 2 * s.table + s.side

  it('follows how easily two students chat', () => {
    expect(cost(at(0, 1, 0), at(0, 1, 1))).toBe(100) // same table
    expect(cost(at(1, 1, 0), at(2, 1, 0))).toBe(70) // just behind
    expect(cost(at(0, 0, 0), at(0, 2, 1))).toBe(50) // same row, both ends
    expect(cost(at(1, 0, 0), at(2, 2, 1))).toBe(15) // one row apart, one on each side
    expect(cost(at(0, 0, 0), at(2, 0, 0))).toBe(10) // two rows apart, same column
    expect(cost(at(0, 0, 0), at(3, 0, 0))).toBe(0)
  })

  it('goes down as the seats get further apart across the room or in rows', () => {
    for (const a of seats) {
      for (const b of seats) {
        if (a === b) continue
        for (const c of seats) {
          const furtherAcross = c.row === b.row && Math.abs(x(c) - x(a)) > Math.abs(x(b) - x(a))
          const furtherInRows = x(c) === x(b) && Math.abs(c.row - a.row) > Math.abs(b.row - a.row)
          if (furtherAcross || furtherInRows) expect(cost(a, c)).toBeLessThanOrEqual(cost(a, b))
        }
      }
    }
  })
})

describe('frontCost', () => {
  it('counts the first two rows as the front, then rises fast', () => {
    expect([0, 1, 2, 3, 4].map(frontCost)).toEqual([0, 0, 30, 120, 270])
  })
})

describe('backness', () => {
  it('is 0 in the front half and 1 in the last row', () => {
    expect([0, 1, 2, 3, 4].map((row) => backness(row, 5))).toEqual([0, 0, 0, 0.5, 1])
    expect(backness(7, 5)).toBe(1)
    expect(backness(0, 1)).toBe(0)
  })
})

describe('compile', () => {
  it('blocks when there are more students than seats', () => {
    expect(compile(makeStudents(7), makeConfig({ room: makeRoom(1, 3) })).blocking).toBe(
      'Pas assez de places : 7 élèves pour 6 places.',
    )
    expect(compile(makeStudents(6), makeConfig({ room: makeRoom(1, 3) })).blocking).toBeUndefined()
  })

  it('warns about duplicate names, contradictory rules and unusable pins', () => {
    const students = makeStudents(4)
    students[3].name = students[2].name
    const { warnings } = compile(
      students,
      makeConfig({
        room: makeRoom(2, 2),
        rules: [
          { kind: 'separate', ids: ['s0', 's1', 's2'] },
          { kind: 'together', ids: ['s1', 's0'] },
        ],
        pins: { s0: '9-0-0', s1: '0-0-0', s2: '0-0-0' },
      }),
    )
    expect(warnings).toEqual([
      'Élève 0 et Élève 1 sont à la fois à séparer et en binôme.',
      "Le cadenas de Élève 0 est ignoré : sa place n'est plus disponible.",
      "Le cadenas de Élève 2 est ignoré : sa place n'est plus disponible.",
      "2 élèves s'appellent « Élève 2 » : ajoute une initiale dans Mes classes pour les distinguer sur le plan.",
    ])
  })

  it('ignores students removed from the class', () => {
    const { problem, warnings } = compile(
      makeStudents(3),
      makeConfig({
        rules: [
          { kind: 'separate', ids: ['s0', 'gone', 's1'] },
          { kind: 'together', ids: ['gone', 's2'] },
        ],
        front: ['gone'],
        pins: { gone: '0-0-0' },
        rotateFrontBack: true,
        avoidPreviousNeighbours: true,
        history: [{ date: '2026-09-01', seating: { '4-0-0': 'gone', '4-0-1': 's2' } }],
      }),
    )
    expect(warnings).toEqual([])
    expect(problem.pairs).toEqual([[{ other: 1, kind: 'separate' }], [{ other: 0, kind: 'separate' }], []])
    expect([...problem.pinned]).toEqual([-1, -1, -1])
    expect([...problem.previousTablemates].every((weight) => weight === 0)).toBe(true)
  })
})
