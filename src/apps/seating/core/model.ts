import type { StudentId } from '../../../shared/classes/model.ts'

export type SeatKey = string // "row-table-side", counted from 0, row 0 being next to the board
export type TableKey = string // "row-table"

export interface Room {
  rows: number
  tablesPerRow: number
  seatsPerTable?: 1 | 2 // 2 when missing; a single desk has only its side 0
  disabledSeats: SeatKey[] // a table with one seat left is a single desk; with none, there is no table
}

export type Rule =
  | { kind: 'separate'; ids: StudentId[] }
  | { kind: 'together'; ids: StudentId[] } // 2 students or more, as close as possible

// A seat holds a student, or the AESH of a student, under the id `aesh:<student id>`.
export type Seating = Record<SeatKey, StudentId>

export const aeshSeatId = (studentId: StudentId) => `aesh:${studentId}`

// The student an AESH seat id stands for, or undefined for a student's id.
export const aeshStudentOf = (id: StudentId) => (id.startsWith('aesh:') ? id.slice('aesh:'.length) : undefined)

export interface SeatingConfig {
  room: Room
  front: StudentId[]
  back?: StudentId[]
  rules: Rule[]
  mixGender: boolean
  avoidPreviousNeighbours: boolean
  rotateFrontBack: boolean
  pins: Record<StudentId, SeatKey>
  emptyPins?: SeatKey[] // seats kept empty when generating
  aesh?: Record<StudentId, string> // students with an AESH, and her name ('' is shown as "AESH")
  current?: Seating
  history: { date: string; seating: Seating }[] // validated plans, most recent last
}

export function defaultConfig(): SeatingConfig {
  return {
    room: { rows: 5, tablesPerRow: 3, seatsPerTable: 2, disabledSeats: [] },
    front: [],
    back: [],
    rules: [],
    mixGender: false,
    avoidPreviousNeighbours: true,
    rotateFrontBack: true,
    pins: {},
    emptyPins: [],
    aesh: {},
    history: [],
  }
}
