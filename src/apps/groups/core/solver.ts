import { mulberry32, shuffle } from '../../../shared/random.ts'
import type { Problem } from './compile.ts'
import { cost, groupCost, swap, type Groups } from './score.ts'

export interface SolveOptions {
  seed: number
  restarts?: number
  iterations?: number
}

const START_TEMPERATURE = 40
const END_TEMPERATURE = 0.1
const EPSILON = 1e-9

// Simulated annealing from several random starts, each one finished by a descent; returns the best groups.
// Swapping two students of different groups keeps the sizes fixed.
export function solve(p: Problem, { seed, restarts = 4, iterations = 20_000 }: SolveOptions): Groups {
  const random = mulberry32(seed)
  let best: Groups = []
  let bestCost = Infinity
  for (let r = 0; r < restarts; r++) {
    const groups = randomStart(p, random)
    if (groups.length > 1) {
      anneal(p, groups, iterations, random)
      descend(p, groups)
    }
    const c = cost(p, groups)
    if (c < bestCost) {
      best = groups
      bestCost = c
    }
  }
  return best
}

function randomStart(p: Problem, random: () => number): Groups {
  const order = shuffle(
    p.students.map((_, x) => x),
    random,
  )
  let next = 0
  return p.sizes.map((size) => order.slice(next, (next += size)))
}

function anneal(p: Problem, groups: Groups, iterations: number, random: () => number) {
  const costs = groups.map((g) => groupCost(p, g))
  const cooling = (END_TEMPERATURE / START_TEMPERATURE) ** (1 / iterations)
  let temperature = START_TEMPERATURE
  for (let k = 0; k < iterations; k++, temperature *= cooling) {
    const a = Math.floor(random() * groups.length)
    let b = Math.floor(random() * (groups.length - 1))
    if (b >= a) b++
    const i = Math.floor(random() * groups[a].length)
    const j = Math.floor(random() * groups[b].length)
    swap(groups, a, i, b, j)
    const costA = groupCost(p, groups[a])
    const costB = groupCost(p, groups[b])
    const delta = costA + costB - costs[a] - costs[b]
    if (delta <= 0 || random() < Math.exp(-delta / temperature)) {
      costs[a] = costA
      costs[b] = costB
    } else {
      swap(groups, a, i, b, j)
    }
  }
}

// Takes every improving swap until none is left.
function descend(p: Problem, groups: Groups) {
  const costs = groups.map((g) => groupCost(p, g))
  let improved = true
  while (improved) {
    improved = false
    for (let a = 0; a < groups.length; a++) {
      for (let b = a + 1; b < groups.length; b++) {
        for (let i = 0; i < groups[a].length; i++) {
          for (let j = 0; j < groups[b].length; j++) {
            swap(groups, a, i, b, j)
            const costA = groupCost(p, groups[a])
            const costB = groupCost(p, groups[b])
            if (costA + costB < costs[a] + costs[b] - EPSILON) {
              costs[a] = costA
              costs[b] = costB
              improved = true
            } else {
              swap(groups, a, i, b, j)
            }
          }
        }
      }
    }
  }
}

// One role per student, from the list in order, drawn at random; the roles run out in groups smaller than the list.
export function assignRoles(groups: Groups, roleNames: string[], seed: number): string[][] {
  const random = mulberry32(seed)
  return groups.map((g) => {
    const drawn = shuffle([...roleNames], random)
    return g.map((_, k) => drawn[k] ?? '')
  })
}
