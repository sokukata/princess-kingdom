import type { Student } from '../../../shared/classes/model.ts'
import { defaultConfig, type Room, type Rule, type Seating, type SeatingConfig } from './model.ts'
import { mulberry32, shuffle } from './random.ts'
import { buildSeats } from './room.ts'

export function makeStudents(count: number): Student[] {
  return Array.from({ length: count }, (_, i) => ({ id: `s${i}`, name: `Élève ${i}`, gender: i % 5 < 3 ? 'F' : 'M' }))
}

export const makeRoom = (rows: number, tablesPerRow: number): Room => ({ rows, tablesPerRow, disabledSeats: [] })

export function makeConfig(overrides: Partial<SeatingConfig>): SeatingConfig {
  return { ...defaultConfig(), avoidPreviousNeighbours: false, rotateFrontBack: false, ...overrides }
}

// Random plan standing for a validated one.
export function randomSeating(students: Student[], room: Room, seed: number): Seating {
  const seats = shuffle(buildSeats(room), mulberry32(seed))
  return Object.fromEntries(students.map((student, i) => [seats[i].key, student.id]))
}

// 32 students in a 6 × 3 room, with every rule and option.
export function realisticClass(): { students: Student[]; config: SeatingConfig } {
  const students = makeStudents(32)
  const id = (i: number) => students[i].id
  const room = makeRoom(6, 3)
  const rules: Rule[] = [
    ...[0, 2, 4, 6, 8, 10].map((i): Rule => ({ kind: 'separate', ids: [id(i), id(i + 1)] })),
    { kind: 'separate', ids: [id(12), id(13), id(14)] },
    { kind: 'together', ids: [id(15), id(16)] },
    { kind: 'together', ids: [id(17), id(18)] },
  ]
  return {
    students,
    config: makeConfig({
      room,
      front: [0, 2, 20, 21, 22].map(id),
      rules,
      mixGender: true,
      avoidPreviousNeighbours: true,
      rotateFrontBack: true,
      history: [
        { date: '2026-09-01', seating: randomSeating(students, room, 1) },
        { date: '2026-11-03', seating: randomSeating(students, room, 2) },
      ],
    }),
  }
}
