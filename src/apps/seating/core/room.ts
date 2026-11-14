import type { Room, SeatKey, TableKey } from './model.ts'

export interface Seat {
  key: SeatKey
  row: number
  table: number
  side: 0 | 1
}

export const range = (count: number) => Array.from({ length: count }, (_, i) => i)

export const tableKey = (row: number, table: number): TableKey => `${row}-${table}`

export const seatKey = (row: number, table: number, side: 0 | 1): SeatKey => `${row}-${table}-${side}`

export function parseSeatKey(key: SeatKey): { row: number; table: number } {
  const [row, table] = key.split('-').map(Number)
  return { row, table }
}

export const tableSides = (room: Room): (0 | 1)[] => (room.seatsPerTable === 1 ? [0] : [0, 1])

// The aisle where the AESH of the student at this seat sits. Aisles of a row go from 0, the left wall in the students'
// view, to tablesPerRow, the right wall. A single desk takes its left aisle, except the first one, against the wall.
export function aeshAisle(seat: Pick<Seat, 'table' | 'side'>, room: Room): number {
  if (room.seatsPerTable === 1) return seat.table === 0 ? 1 : seat.table
  return seat.table + seat.side
}

// Enabled seats, ordered by row, table and side.
export function buildSeats(room: Room): Seat[] {
  const disabled = new Set(room.disabledSeats)
  const seats: Seat[] = []
  for (let row = 0; row < room.rows; row++) {
    for (let table = 0; table < room.tablesPerRow; table++) {
      for (const side of tableSides(room)) {
        const key = seatKey(row, table, side)
        if (!disabled.has(key)) seats.push({ key, row, table, side })
      }
    }
  }
  return seats
}
