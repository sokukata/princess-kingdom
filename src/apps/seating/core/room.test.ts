import { describe, expect, it } from 'vitest'
import { makeRoom } from './fixtures.ts'
import { aeshAisle, buildSeats } from './room.ts'

describe('aeshAisle', () => {
  it('takes the aisle on the side of the seat at a table of two, walls included', () => {
    const room = makeRoom(2, 3)
    expect(buildSeats(room).slice(0, 6).map((seat) => aeshAisle(seat, room))).toEqual([0, 1, 1, 2, 2, 3])
    expect(aeshAisle({ table: 2, side: 1 }, { ...room, seatsPerTable: 2 })).toBe(3)
  })

  it('takes the left aisle of a single desk, or the right one against the left wall', () => {
    const room = { ...makeRoom(2, 4), seatsPerTable: 1 as const }
    expect(buildSeats(room).slice(0, 4).map((seat) => aeshAisle(seat, room))).toEqual([1, 1, 2, 3])
    expect(aeshAisle({ table: 0, side: 0 }, { ...room, tablesPerRow: 1 })).toBe(1) // the right wall
  })
})
