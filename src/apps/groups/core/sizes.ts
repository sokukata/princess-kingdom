import type { GroupSizing } from './model.ts'

// Splits `total` students into `count` groups as evenly as possible, bigger groups first.
const balanced = (total: number, count: number) =>
  Array.from({ length: count }, (_, i) => Math.floor(total / count) + (i < total % count ? 1 : 0))

// Never an empty group; a size larger than the class gives a single group.
export function groupSizes(total: number, { by, n, extra }: GroupSizing): number[] {
  if (total <= 0) return []
  const n1 = Math.max(1, Math.floor(n))
  if (by === 'count') return balanced(total, Math.min(n1, total))
  const count = extra === 'enlarge' ? Math.floor(total / n1) : Math.ceil(total / n1)
  return balanced(total, Math.max(1, count))
}
