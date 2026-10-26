import type { Student, StudentId } from '../../../shared/classes/model.ts'
import type { SeatKey, SeatingConfig } from './model.ts'
import { buildSeats, parseSeatKey, tableKey, type Seat } from './room.ts'

// Starting values, checked by the solver tests.
export const WEIGHTS = {
  front: 30, // × (rows behind the second one)², row 0 being next to the board
  together: 50,
  mix: 8,
  previous: [15, 10, 5], // tablemates in the last, second-to-last and third-to-last validated plans
  rotation: 30,
  fill: 1, // × row, for every student: empty seats go to the back
}

// Separation cost by row gap (3 or more costs nothing), going down linearly with the distance across the room, from
// the same column to one student against each side wall. Same row: chatting goes on even far apart. One row apart:
// just behind is as bad as neighbouring tables, so the column gap matters as much as the rows.
export const SEPARATION = {
  sameTable: 100,
  byRowGap: [
    { near: 70, far: 50 },
    { near: 70, far: 15 },
    { near: 10, far: 3 },
  ],
}

export function separationCost(a: Seat, b: Seat, tablesPerRow: number): number {
  const rowGap = Math.abs(a.row - b.row)
  if (rowGap === 0 && a.table === b.table) return SEPARATION.sameTable
  if (rowGap >= SEPARATION.byRowGap.length) return 0
  const across = Math.abs(2 * a.table + a.side - (2 * b.table + b.side)) / (2 * tablesPerRow - 1)
  const { near, far } = SEPARATION.byRowGap[rowGap]
  return near - (near - far) * across
}

export const togetherCost = (a: Seat, b: Seat) => (a.row === b.row && a.table === b.table ? 0 : WEIGHTS.together)

// The teacher counts the first two rows as the front.
export const frontCost = (row: number) => WEIGHTS.front * Math.max(0, row - 1) ** 2

export const fillCost = (row: number) => WEIGHTS.fill * row

export const mixCost = (a: Student, b: Student) => (a.gender && a.gender === b.gender ? WEIGHTS.mix : 0)

// 0 in the front half of the room, rising to 1 in the last row; a row beyond the room counts as the last one.
export function backness(row: number, rows: number): number {
  return rows > 1 ? Math.max(0, (2 * Math.min(row, rows - 1)) / (rows - 1) - 1) : 0
}

export const rotationCost = (previousBackness: number, row: number, rows: number) =>
  WEIGHTS.rotation * previousBackness * backness(row, rows)

export interface PairTerm {
  other: number
  kind: 'separate' | 'together'
}

// Students and seats are numbered by their index in `students` and `seats`.
export interface Problem {
  seats: Seat[]
  tableSeats: number[][] // [table]: its one or two seats
  tableOf: Int32Array // [seat]: its table
  students: Student[]
  rows: number
  seatIndex: Map<SeatKey, number>
  studentIndex: Map<StudentId, number>
  unary: Float64Array // [student * seats + seat]: front, rotation and fill
  pairs: PairTerm[][] // [student]: each pair rule is listed for both students
  kernels: Record<PairTerm['kind'], Float64Array> // [seat * seats + seat]
  tablemate: Float64Array // [student * students + student]: mix and previous tablemates
  pinned: Int32Array // [student]: imposed seat, or -1
  front: boolean[]
  previousBackness: Float64Array // [student], 0 when the rotation is off
  previousTablemates: Float64Array // [student * students + student], 0 when the option is off
  mixGender: boolean
}

export interface Compiled {
  problem: Problem
  warnings: string[]
  blocking?: string
}

export function compile(students: Student[], config: SeatingConfig): Compiled {
  const { room } = config
  const seats = buildSeats(room)
  const S = seats.length
  const N = students.length
  const seatIndex = new Map(seats.map((seat, s) => [seat.key, s]))
  const studentIndex = new Map(students.map((student, x) => [student.id, x]))
  const warnings: string[] = []

  const tableSeats: number[][] = []
  const tableOf = new Int32Array(S)
  seats.forEach((seat, s) => {
    const previous = seats[s - 1]
    if (previous?.row !== seat.row || previous.table !== seat.table) tableSeats.push([])
    tableOf[s] = tableSeats.length - 1
    tableSeats[tableSeats.length - 1].push(s)
  })

  const pairs: PairTerm[][] = students.map(() => [])
  const listed = new Set<string>()
  const addPair = (kind: PairTerm['kind'], x: number, y: number) => {
    const id = `${kind}:${Math.min(x, y)}:${Math.max(x, y)}`
    if (listed.has(id)) return
    listed.add(id)
    pairs[x].push({ other: y, kind })
    pairs[y].push({ other: x, kind })
  }
  for (const rule of config.rules) {
    const xs = rule.ids.flatMap((id) => studentIndex.get(id) ?? [])
    if (rule.kind === 'separate') xs.forEach((x, i) => xs.slice(i + 1).forEach((y) => addPair('separate', x, y)))
    else if (xs.length === 2) addPair('together', xs[0], xs[1])
  }
  for (const id of listed) {
    const [kind, x, y] = id.split(':')
    if (kind === 'separate' && listed.has(`together:${x}:${y}`)) {
      warnings.push(`${students[+x].name} et ${students[+y].name} sont à la fois à séparer et en binôme.`)
    }
  }

  const kernels = { separate: new Float64Array(S * S), together: new Float64Array(S * S) }
  for (let a = 0; a < S; a++) {
    for (let b = 0; b < S; b++) {
      kernels.separate[a * S + b] = separationCost(seats[a], seats[b], room.tablesPerRow)
      kernels.together[a * S + b] = togetherCost(seats[a], seats[b])
    }
  }

  const previousBackness = new Float64Array(N)
  const last = config.history.at(-1)
  if (config.rotateFrontBack && last) {
    for (const [key, id] of Object.entries(last.seating)) {
      const x = studentIndex.get(id)
      if (x !== undefined) previousBackness[x] = backness(parseSeatKey(key).row, room.rows)
    }
  }

  const previousTablemates = new Float64Array(N * N)
  if (config.avoidPreviousNeighbours) {
    config.history
      .slice(-WEIGHTS.previous.length)
      .reverse()
      .forEach(({ seating }, age) => {
        const byTable = new Map<string, number[]>()
        for (const [key, id] of Object.entries(seating)) {
          const x = studentIndex.get(id)
          if (x === undefined) continue
          const { row, table } = parseSeatKey(key)
          const t = tableKey(row, table)
          byTable.set(t, [...(byTable.get(t) ?? []), x])
        }
        for (const [x, y] of byTable.values()) {
          // A binôme is meant to stay together.
          if (y === undefined || listed.has(`together:${Math.min(x, y)}:${Math.max(x, y)}`)) continue
          previousTablemates[x * N + y] += WEIGHTS.previous[age]
          previousTablemates[y * N + x] += WEIGHTS.previous[age]
        }
      })
  }

  const tablemate = new Float64Array(N * N)
  for (let x = 0; x < N; x++) {
    for (let y = 0; y < N; y++) {
      tablemate[x * N + y] = previousTablemates[x * N + y] + (config.mixGender ? mixCost(students[x], students[y]) : 0)
    }
  }

  const frontIds = new Set(config.front)
  const front = students.map((student) => frontIds.has(student.id))
  const unary = new Float64Array(N * S)
  for (let x = 0; x < N; x++) {
    for (let s = 0; s < S; s++) {
      const { row } = seats[s]
      unary[x * S + s] =
        fillCost(row) + (front[x] ? frontCost(row) : 0) + rotationCost(previousBackness[x], row, room.rows)
    }
  }

  const pinned = new Int32Array(N).fill(-1)
  const pinnedSeats = new Set<number>()
  for (const [id, key] of Object.entries(config.pins)) {
    const x = studentIndex.get(id)
    if (x === undefined) continue
    const s = seatIndex.get(key)
    if (s === undefined || pinnedSeats.has(s)) {
      warnings.push(`Le cadenas de ${students[x].name} est ignoré : sa place n'est plus disponible.`)
      continue
    }
    pinned[x] = s
    pinnedSeats.add(s)
  }

  const nameCounts = new Map<string, number>()
  for (const { name } of students) nameCounts.set(name, (nameCounts.get(name) ?? 0) + 1)
  for (const [name, count] of nameCounts) {
    if (count > 1) {
      warnings.push(
        `${count} élèves s'appellent « ${name} » : ajoute une initiale dans Mes classes pour les distinguer sur le plan.`,
      )
    }
  }

  return {
    problem: {
      seats,
      tableSeats,
      tableOf,
      students,
      rows: room.rows,
      seatIndex,
      studentIndex,
      unary,
      pairs,
      kernels,
      tablemate,
      pinned,
      front,
      previousBackness,
      previousTablemates,
      mixGender: config.mixGender,
    },
    warnings,
    blocking: N > S ? `Pas assez de places : ${N} élèves pour ${S} places.` : undefined,
  }
}
