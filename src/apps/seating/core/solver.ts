import { mulberry32, shuffle } from '../../../shared/random.ts'
import type { Problem } from './compile.ts'
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
  // Seats that never move: pinned students, and seats kept empty.
  const fixedSeats = new Set([...p.pinned.filter((seat) => seat >= 0), ...p.keptEmpty])
  const movable = range(p.seats.length).filter((seat) => !fixedSeats.has(seat))
  const blocks = pairBlocks(p).filter((block) => !block.some((seat) => fixedSeats.has(seat)))
  let best = emptyAssignment(p)
  let bestCost = Infinity
  for (let r = 0; r < restarts; r++) {
    const a = randomStart(p, random)
    anneal(p, a, movable, blocks, iterations, random)
    descend(p, a, movable)
    const c = cost(p, a)
    if (c < bestCost) {
      best = a
      bestCost = c
    }
  }
  return best
}

// Pairs of seats that move together, so that two neighbours change places without being split: the two seats of a
// table, and two single desks side by side in a row (a student and her AESH, two students meant to be together).
function pairBlocks(p: Problem): number[][] {
  const blocks = p.tableSeats.filter((seats) => seats.length === 2)
  p.tableSeats.forEach((seats, t) => {
    const next = p.tableSeats[t + 1]
    if (seats.length !== 1 || next?.length !== 1) return
    const [a, b] = [p.seats[seats[0]], p.seats[next[0]]]
    if (a.row === b.row && b.table === a.table + 1) blocks.push([seats[0], next[0]])
  })
  return blocks
}

function randomStart(p: Problem, random: () => number): Assignment {
  const a = emptyAssignment(p)
  p.pinned.forEach((seat, x) => {
    if (seat >= 0) place(a, x, seat)
  })
  const free = shuffle(
    range(p.seats.length).filter((seat) => a.occupant[seat] < 0 && !p.keptEmpty.has(seat)),
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
  blocks: number[][],
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
    // Two pairs of seats: trading them changes the place of two neighbours without splitting them; turning both round
    // reaches the mirror image of a part of the plan, which single swaps only reach by going through a worse plan.
    if (blocks.length > 1 && random() < TABLE_MOVE_RATE) {
      const block1 = pick(blocks)
      const block2 = pick(blocks)
      if (block1.some((seat) => block2.includes(seat))) continue
      if (random() < 0.5) [s1, s2, s3, s4] = [block1[0], block2[0], block1[1], block2[1]]
      else [s1, s2, s3, s4] = [block1[0], block1[1], block2[0], block2[1]]
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
