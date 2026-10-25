import type { StudentId } from '../../../shared/classes/model.ts'
import { frontCost, mixCost, rotationCost, type Problem } from './compile.ts'
import type { Seating } from './model.ts'
import type { Seat } from './room.ts'

// occupant[seat] and seatOf[student]; -1 for an empty seat or a student without a seat.
export interface Assignment {
  occupant: Int32Array
  seatOf: Int32Array
}

export function emptyAssignment(p: Problem): Assignment {
  return {
    occupant: new Int32Array(p.seats.length).fill(-1),
    seatOf: new Int32Array(p.students.length).fill(-1),
  }
}

export function place(a: Assignment, student: number, seat: number): void {
  a.occupant[seat] = student
  a.seatOf[student] = seat
}

// Seats and students that no longer exist are dropped.
export function fromSeating(p: Problem, seating: Seating): Assignment {
  const a = emptyAssignment(p)
  for (const [key, id] of Object.entries(seating)) {
    const seat = p.seatIndex.get(key)
    const student = p.studentIndex.get(id)
    if (seat === undefined || student === undefined || a.occupant[seat] >= 0 || a.seatOf[student] >= 0) continue
    place(a, student, seat)
  }
  return a
}

export function toSeating(p: Problem, a: Assignment): Seating {
  const seating: Seating = {}
  a.occupant.forEach((student, seat) => {
    if (student >= 0) seating[p.seats[seat].key] = p.students[student].id
  })
  return seating
}

function swap(a: Assignment, s1: number, s2: number): void {
  const x = a.occupant[s1]
  const y = a.occupant[s2]
  a.occupant[s1] = y
  a.occupant[s2] = x
  if (x >= 0) a.seatOf[x] = s2
  if (y >= 0) a.seatOf[y] = s1
}

// Swaps s1 and s2, plus s3 and s4 for a move of two whole tables of two seats.
export function applyMove(a: Assignment, s1: number, s2: number, s3 = -1, s4 = -1): void {
  swap(a, s1, s2)
  if (s3 >= 0) swap(a, s3, s4)
}

// Tablemates of a two-seat table, as [student, student], or undefined.
function tablemates(p: Problem, a: Assignment, table: number): [number, number] | undefined {
  const [s1, s2] = p.tableSeats[table]
  if (s2 === undefined || a.occupant[s1] < 0 || a.occupant[s2] < 0) return undefined
  return [a.occupant[s1], a.occupant[s2]]
}

function tableCost(p: Problem, a: Assignment, table: number): number {
  const mates = tablemates(p, a, table)
  return mates ? p.tablemate[mates[0] * p.students.length + mates[1]] : 0
}

// Cost of the terms touching the moved students (-1 = empty seat) or the two tables; every student is seated.
function localCost(p: Problem, a: Assignment, moved: number[], table1: number, table2: number): number {
  const S = p.seats.length
  let total = tableCost(p, a, table1) + (table2 === table1 ? 0 : tableCost(p, a, table2))
  for (const x of moved) {
    if (x < 0) continue
    const seat = a.seatOf[x]
    total += p.unary[x * S + seat]
    for (const { other, kind } of p.pairs[x]) {
      if (other < x && moved.includes(other)) continue // already counted from the other student
      total += p.kernels[kind][seat * S + a.seatOf[other]]
    }
  }
  return total
}

// Cost change of a move, computed from the terms it touches; the assignment is left as it was.
export function moveDelta(p: Problem, a: Assignment, s1: number, s2: number, s3 = -1, s4 = -1): number {
  const o = a.occupant
  const moved = [o[s1], o[s2], s3 < 0 ? -1 : o[s3], s4 < 0 ? -1 : o[s4]]
  const before = localCost(p, a, moved, p.tableOf[s1], p.tableOf[s2])
  applyMove(a, s1, s2, s3, s4)
  const after = localCost(p, a, moved, p.tableOf[s1], p.tableOf[s2])
  applyMove(a, s1, s2, s3, s4)
  return after - before
}

// Terms involving a student without a seat are left out.
export function cost(p: Problem, a: Assignment): number {
  const S = p.seats.length
  let total = 0
  for (let table = 0; table < p.tableSeats.length; table++) total += tableCost(p, a, table)
  for (let x = 0; x < p.students.length; x++) {
    const seat = a.seatOf[x]
    if (seat < 0) continue
    total += p.unary[x * S + seat]
    for (const { other, kind } of p.pairs[x]) {
      if (other > x && a.seatOf[other] >= 0) total += p.kernels[kind][seat * S + a.seatOf[other]]
    }
  }
  return total
}

export interface Issue {
  kind: 'front' | 'rotation' | 'separate' | 'together' | 'mix' | 'previous'
  message: string
  points: number
  students: StudentId[]
}

// Broken rules, worst first. Their points add up to the cost, minus the fill cost, which only breaks ties.
export function explain(p: Problem, a: Assignment): Issue[] {
  const S = p.seats.length
  const issues: Issue[] = []
  const name = (x: number) => p.students[x].name
  const add = (kind: Issue['kind'], points: number, message: string, ...xs: number[]) => {
    if (points > 0) issues.push({ kind, points, message, students: xs.map((x) => p.students[x].id) })
  }
  for (let x = 0; x < p.students.length; x++) {
    const seat = a.seatOf[x]
    if (seat < 0) continue
    const { row } = p.seats[seat]
    if (p.front[x]) add('front', frontCost(row), `${name(x)} (devant) est au rang ${row + 1}`, x)
    add(
      'rotation',
      rotationCost(p.previousBackness[x], row, p.rows),
      `${name(x)} était au fond au dernier plan et se retrouve au rang ${row + 1}`,
      x,
    )
    for (const { other, kind } of p.pairs[x]) {
      const otherSeat = a.seatOf[other]
      if (other < x || otherSeat < 0) continue
      const points = p.kernels[kind][seat * S + otherSeat]
      const pair = `${name(x)} et ${name(other)}`
      if (kind === 'separate') add(kind, points, `${pair} (à séparer) ${gap(p.seats[seat], p.seats[otherSeat])}`, x, other)
      else add(kind, points, `${pair} (binôme) ne sont pas à la même table`, x, other)
    }
  }
  for (let table = 0; table < p.tableSeats.length; table++) {
    const mates = tablemates(p, a, table)
    if (!mates) continue
    const [x, y] = mates
    if (p.mixGender) add('mix', mixCost(p.students[x], p.students[y]), `Table non mixte : ${name(x)} et ${name(y)}`, x, y)
    add(
      'previous',
      p.previousTablemates[x * p.students.length + y],
      `${name(x)} et ${name(y)} étaient déjà à la même table dans un plan récent`,
      x,
      y,
    )
  }
  return issues.sort((i, j) => j.points - i.points)
}

function gap(a: Seat, b: Seat): string {
  const rows = Math.abs(a.row - b.row)
  const tables = Math.abs(a.table - b.table)
  const columns = tables === 0 ? 'dans la même colonne' : `à ${tables} table${tables > 1 ? 's' : ''} d'écart`
  if (rows === 0) return tables === 0 ? 'sont à la même table' : `sont au même rang, ${columns}`
  return `${rows === 1 ? "n'ont qu'un rang" : `n'ont que ${rows} rangs`} d'écart, ${columns}`
}
