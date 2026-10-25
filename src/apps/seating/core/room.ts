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

// Enabled seats, ordered by row, table and side.
export function buildSeats(room: Room): Seat[] {
  const disabled = new Set(room.disabledSeats)
  const seats: Seat[] = []
  for (let row = 0; row < room.rows; row++) {
    for (let table = 0; table < room.tablesPerRow; table++) {
      for (const side of [0, 1] as const) {
        const key = seatKey(row, table, side)
        if (!disabled.has(key)) seats.push({ key, row, table, side })
      }
    }
  }
  return seats
}
