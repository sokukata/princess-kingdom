import type { StudentId } from '../../../shared/classes/model.ts'

export type SeatKey = string // "row-table-side", counted from 0, row 0 being next to the board
export type TableKey = string // "row-table"

export interface Room {
  rows: number
  tablesPerRow: number
  disabledSeats: SeatKey[] // a table with one seat left is a single desk; with none, there is no table
}

export type Rule =
  | { kind: 'separate'; ids: StudentId[] }
  | { kind: 'together'; ids: [StudentId, StudentId] }

export type Seating = Record<SeatKey, StudentId>

export interface SeatingConfig {
  room: Room
  front: StudentId[]
  rules: Rule[]
  mixGender: boolean
  avoidPreviousNeighbours: boolean
  rotateFrontBack: boolean
  pins: Record<StudentId, SeatKey>
  current?: Seating
  history: { date: string; seating: Seating }[] // validated plans, most recent last
}

export function defaultConfig(): SeatingConfig {
  return {
    room: { rows: 5, tablesPerRow: 3, disabledSeats: [] },
    front: [],
    rules: [],
    mixGender: false,
    avoidPreviousNeighbours: true,
    rotateFrontBack: true,
    pins: {},
    history: [],
  }
}
