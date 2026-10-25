import { useState } from 'react'
import type { Student, StudentId } from '../../../shared/classes/model.ts'
import type { Rule, SeatingConfig } from '../core/model.ts'
import type { ConfigChange } from '../state.ts'

interface Props {
  students: Student[]
  config: SeatingConfig
  update: (change: ConfigChange) => void
}

export function RulesEditor({ students, config, update }: Props) {
  const [selected, setSelected] = useState<StudentId[]>([])
  const names = new Map(students.map((s) => [s.id, s.name]))
  const add = (rule: Rule) => {
    update((c) => ({ rules: [...c.rules, rule] }))
    setSelected([])
  }
  const toggle = (id: StudentId) =>
    setSelected((ids) => (ids.includes(id) ? ids.filter((other) => other !== id) : [...ids, id]))

  return (
    <fieldset className="panel">
      <legend>Règles</legend>
      <p className="hint">Sélectionne des élèves, puis choisis la règle.</p>
      <div className="chips">
        {students.map((s) => (
          <button key={s.id} className="chip" aria-pressed={selected.includes(s.id)} onClick={() => toggle(s.id)}>
            {s.name}
          </button>
        ))}
      </div>
      <div className="rule-buttons">
        <button disabled={selected.length < 2} onClick={() => add({ kind: 'separate', ids: selected })}>
          <span aria-hidden="true">⚔️ </span>À séparer
        </button>
        <button
          disabled={selected.length !== 2}
          onClick={() => add({ kind: 'together', ids: [selected[0], selected[1]] })}
        >
          <span aria-hidden="true">💞 </span>Binôme
        </button>
      </div>

      {config.rules.length > 0 && (
        <ul className="rules">
          {config.rules.map((rule, i) => (
            <li key={i}>
              <span>
                <span aria-hidden="true">{rule.kind === 'separate' ? '⚔️ ' : '💞 '}</span>
                {rule.kind === 'separate' ? 'À séparer' : 'Binôme'} :{' '}
                {rule.ids.map((id) => names.get(id) ?? 'élève retiré').join(', ')}
              </span>
              <button
                className="icon"
                title="Supprimer la règle (sashay away)"
                onClick={() => update((c) => ({ rules: c.rules.filter((_, j) => j !== i) }))}
              >
                ✕
              </button>
            </li>
          ))}
        </ul>
      )}

      <div className="options">
        <label className="toggle">
          <input type="checkbox" checked={config.mixGender} onChange={(e) => update({ mixGender: e.target.checked })} />
          Mixité F/G à chaque table
        </label>
        {config.mixGender && !students.some((s) => s.gender) && (
          <p className="hint">Renseigne F/G dans Mes classes pour que la mixité s'applique.</p>
        )}
        <label className="toggle">
          <input
            type="checkbox"
            checked={config.avoidPreviousNeighbours}
            onChange={(e) => update({ avoidPreviousNeighbours: e.target.checked })}
          />
          Changer de voisins par rapport aux 3 derniers plans validés
        </label>
        <label className="toggle">
          <input
            type="checkbox"
            checked={config.rotateFrontBack}
            onChange={(e) => update({ rotateFrontBack: e.target.checked })}
          />
          Rotation : les élèves du fond au dernier plan validé passent devant
        </label>
      </div>
    </fieldset>
  )
}
