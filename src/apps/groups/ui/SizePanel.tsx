import type { Student } from '../../../shared/classes/model.ts'
import type { GroupsConfig } from '../core/model.ts'
import { groupSizes } from '../core/sizes.ts'
import type { ConfigChange } from '../state.ts'

interface Props {
  students: Student[]
  config: GroupsConfig
  update: (change: ConfigChange) => void
}

const plural = (count: number, word: string) => `${count} ${word}${count > 1 ? 's' : ''}`

function describeSizes(sizes: number[]): string {
  const counts = new Map<number, number>()
  for (const size of sizes) counts.set(size, (counts.get(size) ?? 0) + 1)
  return [...counts]
    .map(([size, count]) => `${plural(count, 'groupe')} de ${plural(size, 'élève')}`)
    .join(' et ')
}

export function SizePanel({ students, config, update }: Props) {
  const { sizing } = config
  const absent = config.absent.filter((id) => students.some((s) => s.id === id)).length
  const present = students.length - absent
  const set = (change: Partial<typeof sizing>) => update({ sizing: { ...sizing, ...change } })
  return (
    <fieldset className="panel">
      <legend>Taille des groupes</legend>
      <div className="size-line">
        <input
          type="number"
          aria-label="Nombre"
          min={1}
          max={40}
          value={sizing.n}
          onChange={(e) => set({ n: Math.max(1, Math.min(40, Math.floor(Number(e.target.value)) || 1)) })}
        />
        <select aria-label="Mode" value={sizing.by} onChange={(e) => set({ by: e.target.value as 'size' | 'count' })}>
          <option value="size">élèves par groupe</option>
          <option value="count">groupes</option>
        </select>
      </div>
      {sizing.by === 'size' && (
        <div className="options">
          <label className="toggle">
            <input type="radio" name="extra" checked={sizing.extra === 'enlarge'} onChange={() => set({ extra: 'enlarge' })} />
            Les élèves en trop agrandissent certains groupes
          </label>
          <label className="toggle">
            <input type="radio" name="extra" checked={sizing.extra === 'smaller'} onChange={() => set({ extra: 'smaller' })} />
            Les élèves en trop forment des groupes plus petits
          </label>
        </div>
      )}
      <p className="hint">
        {present > 0
          ? `${plural(present, 'élève')} présent${present > 1 ? 's' : ''} : ${describeSizes(groupSizes(present, sizing))}.`
          : 'Aucun élève présent.'}
      </p>
      {absent > 0 && (
        <div className="rule-buttons">
          <button onClick={() => update({ absent: [] })}>Tout le monde est là</button>
        </div>
      )}
    </fieldset>
  )
}
