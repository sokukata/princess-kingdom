// Speed tests run on machines of any speed (the dev server, GitHub's runners): a time limit set on one machine is
// scaled by how much slower this one runs a fixed reference loop, never below 1.
const REFERENCE_MS = 27 // the reference loop on the machine where the limits were set

function referenceLoop(): number {
  let sum = 0
  const values = new Float64Array(1024)
  for (let k = 0; k < 4_000_000; k++) {
    const i = k & 1023
    values[i] = values[i] * 0.5 + k
    sum += values[i]
  }
  return sum
}

export function machineSlowness(): number {
  referenceLoop()
  let best = Infinity
  for (let run = 0; run < 3; run++) {
    const start = performance.now()
    referenceLoop()
    best = Math.min(best, performance.now() - start)
  }
  return Math.max(1, best / REFERENCE_MS)
}
