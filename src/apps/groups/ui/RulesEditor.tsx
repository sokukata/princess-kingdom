import type { Student, StudentId } from '../../../shared/classes/model.ts'
import { useSeatingConfig } from '../../seating/state.ts'
import type { GroupsConfig, Rule } from '../core/model.ts'
import type { ConfigChange } from '../state.ts'

interface Props {
  classId: string
  students: Student[]
  config: GroupsConfig
  update: (change: ConfigChange) => void
}

const sameStudents = (a: StudentId[], b: StudentId[]) => a.length === b.length && a.every((id) => b.includes(id))

// The rules are created from the student list; this panel lists them, with the options of the groups.
export function RulesEditor({ classId, students, config, update }: Props) {
  const [seating] = useSeatingConfig(classId)
  const names = new Map(students.map((s) => [s.id, s.name]))

  // Copies the seating plan's "separate" rules, without the students no longer in the class.
  const importSeparated = () =>
    update((c) => {
      const known = new Set(students.map((s) => s.id))
      const added: Rule[] = []
      for (const rule of seating.rules) {
        if (rule.kind !== 'separate') continue
        const ids = rule.ids.filter((id) => known.has(id))
        const exists = [...c.rules, ...added].some((r) => r.kind === 'separate' && sameStudents(r.ids, ids))
        if (ids.length >= 2 && !exists) added.push({ kind: 'separate', ids })
      }
      return { rules: [...c.rules, ...added] }
    })

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
      <div className="rule-buttons">
        <button onClick={importSeparated}>Reprendre les élèves à séparer du plan de classe</button>
      </div>

      <div className="options">
        <label className="toggle">
          <input type="checkbox" checked={config.mixGender} onChange={(e) => update({ mixGender: e.target.checked })} />
          Mixité F/G dans la proportion de la classe
        </label>
        {config.mixGender && !students.some((s) => s.gender) && (
          <p className="hint">Renseigne F/G dans Mes classes pour que la mixité s'applique.</p>
        )}
        <label className="roles-field">
          Niveaux
          <select
            value={config.levelMode}
            onChange={(e) => update({ levelMode: e.target.value as GroupsConfig['levelMode'] })}
          >
            <option value="off">Sans tenir compte du niveau</option>
            <option value="mixed">Groupes hétérogènes</option>
            <option value="tiered">Groupes de niveau</option>
          </select>
        </label>
        {config.levelMode !== 'off' && !students.some((s) => config.levels[s.id] !== undefined) && (
          <p className="hint">Renseigne le niveau des élèves dans leur fiche, dans la liste des élèves.</p>
        )}
        <label className="toggle">
          <input
            type="checkbox"
            checked={config.avoidPrevious}
            onChange={(e) => update({ avoidPrevious: e.target.checked })}
          />
          Changer de groupes par rapport aux 3 derniers tirages validés
        </label>
        <label className="toggle">
          <input type="checkbox" checked={config.useRoles} onChange={(e) => update({ useRoles: e.target.checked })} />
          Tirer au sort un rôle par élève
        </label>
        {config.useRoles && (
          <label className="roles-field">
            Rôles, séparés par des virgules
            <input
              type="text"
              value={config.roleNames.join(', ')}
              onChange={(e) => update({ roleNames: e.target.value.split(',').map((r) => r.trimStart()) })}
              onBlur={(e) => update({ roleNames: e.target.value.split(',').map((r) => r.trim()).filter(Boolean) })}
            />
          </label>
        )}
      </div>
    </fieldset>
  )
}
