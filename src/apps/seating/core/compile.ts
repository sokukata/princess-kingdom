import type { Student, StudentId } from '../../../shared/classes/model.ts'
import type { Room, SeatKey, SeatingConfig } from './model.ts'
import { buildSeats, parseSeatKey, tableKey, type Seat } from './room.ts'

// Starting values, checked by the solver tests.
export const WEIGHTS = {
  front: 30, // × (rows behind the second one)², row 0 being next to the board
  back: 30, // × (rows in front of the second-to-last one)²
  together: 50,
  mix: 8,
  previous: [15, 10, 5], // tablemates in the last, second-to-last and third-to-last validated plans
  rotation: 30,
  fill: 1, // × row, for every student: empty seats go to the back
}

// Position across the room, from 0 (left wall) to 1 (right wall).
function across(seat: Seat, room: Room): number {
  const perTable = room.seatsPerTable === 1 ? 1 : 2
  const columns = perTable * room.tablesPerRow - 1
  return columns > 0 ? (perTable * seat.table + seat.side) / columns : 0
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

export function separationCost(a: Seat, b: Seat, room: Room): number {
  const rowGap = Math.abs(a.row - b.row)
  if (rowGap === 0 && a.table === b.table) return SEPARATION.sameTable
  if (rowGap >= SEPARATION.byRowGap.length) return 0
  const { near, far } = SEPARATION.byRowGap[rowGap]
  return near - (near - far) * Math.abs(across(a, room) - across(b, room))
}

// With single desks, a binôme sits at two neighbouring tables of the same row.
export function togetherCost(a: Seat, b: Seat, room: Room): number {
  const tableGap = room.seatsPerTable === 1 ? 1 : 0
  return a.row === b.row && Math.abs(a.table - b.table) <= tableGap ? 0 : WEIGHTS.together
}

// The teacher counts the first two rows as the front, and the last two as the back.
export const frontCost = (row: number) => WEIGHTS.front * Math.max(0, row - 1) ** 2

export const backCost = (row: number, rows: number) => WEIGHTS.back * Math.max(0, rows - 2 - row) ** 2

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
  unary: Float64Array // [student * seats + seat]: front, back, rotation and fill
  pairs: PairTerm[][] // [student]: each pair rule is listed for both students
  kernels: Record<PairTerm['kind'], Float64Array> // [seat * seats + seat]
  tablemate: Float64Array // [student * students + student]: mix and previous tablemates
  pinned: Int32Array // [student]: imposed seat, or -1
  keptEmpty: Set<number> // seats left empty
  front: boolean[]
  back: boolean[]
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
      kernels.separate[a * S + b] = separationCost(seats[a], seats[b], room)
      kernels.together[a * S + b] = togetherCost(seats[a], seats[b], room)
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
  const backIds = new Set(config.back ?? [])
  const front = students.map((student) => frontIds.has(student.id))
  const back = students.map((student) => backIds.has(student.id) && !frontIds.has(student.id))
  // A student meant to sit at the back is not brought forward by the rotation.
  back.forEach((isBack, x) => {
    if (isBack) previousBackness[x] = 0
  })
  for (const student of students) {
    if (frontIds.has(student.id) && backIds.has(student.id)) {
      warnings.push(`${student.name} est à la fois à placer devant et au fond : seul « devant » est appliqué.`)
    }
  }
  const unary = new Float64Array(N * S)
  for (let x = 0; x < N; x++) {
    for (let s = 0; s < S; s++) {
      const { row } = seats[s]
      unary[x * S + s] =
        fillCost(row) +
        (front[x] ? frontCost(row) : 0) +
        (back[x] ? backCost(row, room.rows) : 0) +
        rotationCost(previousBackness[x], row, room.rows)
    }
  }

  const pinned = new Int32Array(N).fill(-1)
  const pinnedSeats = new Set<number>()
  const keptEmpty = new Set<number>()
  for (const key of config.emptyPins ?? []) {
    const s = seatIndex.get(key)
    if (s !== undefined) keptEmpty.add(s)
  }
  for (const [id, key] of Object.entries(config.pins)) {
    const x = studentIndex.get(id)
    if (x === undefined) continue
    const s = seatIndex.get(key)
    if (s === undefined || pinnedSeats.has(s) || keptEmpty.has(s)) {
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
      keptEmpty,
      front,
      back,
      previousBackness,
      previousTablemates,
      mixGender: config.mixGender,
    },
    warnings,
    blocking:
      N > S - keptEmpty.size
        ? `Pas assez de places : ${N} élèves pour ${S - keptEmpty.size} places${keptEmpty.size ? ` (${keptEmpty.size} gardées vides)` : ''}.`
        : undefined,
  }
}
