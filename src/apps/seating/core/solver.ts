import type { Problem } from './compile.ts'
import { mulberry32, shuffle } from './random.ts'
import { range } from './room.ts'
import { applyMove, cost, emptyAssignment, moveDelta, place, type Assignment } from './score.ts'

export interface SolveOptions {
  seed: number
  restarts?: number
  iterations?: number
}

const START_TEMPERATURE = 50
const END_TEMPERATURE = 0.1
const TABLE_MOVE_RATE = 0.1
const EPSILON = 1e-9

// Simulated annealing from several random starts, each one finished by a descent; returns the best plan.
export function solve(p: Problem, { seed, restarts = 4, iterations = 200_000 }: SolveOptions): Assignment {
  const random = mulberry32(seed)
  const pinnedSeats = new Set(p.pinned.filter((seat) => seat >= 0))
  const movable = range(p.seats.length).filter((seat) => !pinnedSeats.has(seat))
  const freeTables = p.tableSeats.filter((seats) => seats.length === 2 && !seats.some((seat) => pinnedSeats.has(seat)))
  let best = emptyAssignment(p)
  let bestCost = Infinity
  for (let r = 0; r < restarts; r++) {
    const a = randomStart(p, random)
    anneal(p, a, movable, freeTables, iterations, random)
    descend(p, a, movable)
    const c = cost(p, a)
    if (c < bestCost) {
      best = a
      bestCost = c
    }
  }
  return best
}

function randomStart(p: Problem, random: () => number): Assignment {
  const a = emptyAssignment(p)
  p.pinned.forEach((seat, x) => {
    if (seat >= 0) place(a, x, seat)
  })
  const free = shuffle(
    range(p.seats.length).filter((seat) => a.occupant[seat] < 0),
    random,
  )
  p.pinned.forEach((seat, x) => {
    if (seat < 0) place(a, x, free.pop()!)
  })
  return a
}

// Accepting some worse moves while the temperature is high gets the search out of merely decent plans.
function anneal(
  p: Problem,
  a: Assignment,
  movable: number[],
  freeTables: number[][],
  iterations: number,
  random: () => number,
): void {
  if (movable.length < 2) return
  const pick = <T,>(items: T[]) => items[Math.floor(random() * items.length)]
  const cooling = (END_TEMPERATURE / START_TEMPERATURE) ** (1 / iterations)
  for (let k = 0, temperature = START_TEMPERATURE; k < iterations; k++, temperature *= cooling) {
    let s1: number
    let s2: number
    let s3 = -1
    let s4 = -1
    // Moving a whole table changes the row of two tablemates without splitting them.
    if (freeTables.length > 1 && random() < TABLE_MOVE_RATE) {
      const table1 = pick(freeTables)
      const table2 = pick(freeTables)
      s1 = table1[0]
      s2 = table2[0]
      s3 = table1[1]
      s4 = table2[1]
    } else {
      s1 = pick(movable)
      s2 = pick(movable)
    }
    if (s1 === s2 || (s3 < 0 && a.occupant[s1] < 0 && a.occupant[s2] < 0)) continue
    const delta = moveDelta(p, a, s1, s2, s3, s4)
    if (delta <= 0 || random() < Math.exp(-delta / temperature)) applyMove(a, s1, s2, s3, s4)
  }
}

// Swaps seats while a swap improves the plan, which then is a local optimum.
function descend(p: Problem, a: Assignment, movable: number[]): void {
  for (let improved = true; improved; ) {
    improved = false
    for (let i = 0; i < movable.length; i++) {
      for (let j = i + 1; j < movable.length; j++) {
        const s1 = movable[i]
        const s2 = movable[j]
        if (a.occupant[s1] < 0 && a.occupant[s2] < 0) continue
        if (moveDelta(p, a, s1, s2) < -EPSILON) {
          applyMove(a, s1, s2)
          improved = true
        }
      }
    }
  }
}
