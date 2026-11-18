import type { Student } from '../../../shared/classes/model.ts'
import type { SeatingConfig } from '../core/model.ts'
import type { ConfigChange } from '../state.ts'

interface Props {
  students: Student[]
  config: SeatingConfig
  update: (change: ConfigChange) => void
}

// The rules are created from the student list; this panel lists them, with the options of the plan.
export function RulesEditor({ students, config, update }: Props) {
  const names = new Map(students.map((s) => [s.id, s.name]))

  return (
    <fieldset className="panel">
      <legend>Règles et options</legend>
      {config.rules.length === 0 && (
        <p className="hint">Aucune règle : coche des élèves dans la liste pour en créer une.</p>
      )}

      {config.rules.length > 0 && (
        <ul className="rules">
          {config.rules.map((rule, i) => (
            <li key={i}>
              <span>
                <span aria-hidden="true">{rule.kind === 'separate' ? '⚔️ ' : '💞 '}</span>
                {rule.kind === 'separate' ? 'À séparer' : 'Ensemble'} :{' '}
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
