import type { Student, StudentId } from '../../../shared/classes/model.ts'
import { SheetLine, StudentRoster, type Badge } from '../../../shared/classes/StudentRoster.tsx'
import type { GroupsConfig, Level, Rule } from '../core/model.ts'
import type { ConfigChange } from '../state.ts'

interface Props {
  students: Student[]
  config: GroupsConfig
  update: (change: ConfigChange) => void
}

const LEVELS: { level: Level; label: string }[] = [
  { level: 3, label: "À l'aise" },
  { level: 2, label: 'Moyen' },
  { level: 1, label: 'En difficulté' },
]

const without = (ids: StudentId[], drop: StudentId[]) => ids.filter((id) => !drop.includes(id))

export function StudentsPanel({ students, config, update }: Props) {
  const setAbsent = (ids: StudentId[], absent: boolean) =>
    update((c) => ({ absent: absent ? [...without(c.absent, ids), ...ids] : without(c.absent, ids) }))

  const setLevel = (id: StudentId, level: Level | undefined) =>
    update((c) => {
      const { [id]: _current, ...others } = c.levels
      return { levels: level === undefined ? others : { ...others, [id]: level } }
    })

  const addRule = (rule: Rule) => update((c) => ({ rules: [...c.rules, rule] }))

  const badges = (s: Student): Badge[] => {
    const kinds = new Set(config.rules.filter((rule) => rule.ids.includes(s.id)).map((rule) => rule.kind))
    const level = LEVELS.find((l) => l.level === config.levels[s.id])
    return [
      ...(config.absent.includes(s.id) ? [{ label: '🌙 Absent·e', tone: 'muted' as const }] : []),
      ...(level ? [{ label: level.label, tone: 'gold' as const }] : []),
      ...(kinds.has('separate') ? [{ label: '⚔️', title: 'À séparer', tone: 'muted' as const }] : []),
      ...(kinds.has('together') ? [{ label: '💞', title: 'Ensemble', tone: 'muted' as const }] : []),
    ]
  }

  const details = (s: Student) => (
    <>
      <SheetLine label="Présence">
        <label className="toggle">
          <input
            type="checkbox"
            checked={config.absent.includes(s.id)}
            onChange={(e) => setAbsent([s.id], e.target.checked)}
          />
          Absent·e aujourd'hui
        </label>
      </SheetLine>
      <SheetLine label="Niveau">
        {LEVELS.map(({ level, label }) => (
          <button
            key={level}
            className="chip"
            aria-pressed={config.levels[s.id] === level}
            onClick={() => setLevel(s.id, config.levels[s.id] === level ? undefined : level)}
          >
            {label}
          </button>
        ))}
      </SheetLine>
    </>
  )

  const actions = (ids: StudentId[], clear: () => void) => {
    const run = (action: () => void) => () => {
      action()
      clear()
    }
    return (
      <>
        <button disabled={ids.length === 0} onClick={run(() => setAbsent(ids, true))}>
          🌙 Absents
        </button>
        <button disabled={ids.length < 2} onClick={run(() => addRule({ kind: 'together', ids }))}>
          <span aria-hidden="true">💞 </span>Ensemble
        </button>
        <button disabled={ids.length < 2} onClick={run(() => addRule({ kind: 'separate', ids }))}>
          <span aria-hidden="true">⚔️ </span>À séparer
        </button>
      </>
    )
  }

  const absent = config.absent.filter((id) => students.some((s) => s.id === id)).length
  const rated = students.filter((s) => config.levels[s.id] !== undefined).length
  const summary = [
    `${students.length - absent} présent${students.length - absent > 1 ? 's' : ''}`,
    absent > 0 && `${absent} absent${absent > 1 ? 's' : ''}`,
    rated > 0 && `${rated} niveau${rated > 1 ? 'x' : ''} renseigné${rated > 1 ? 's' : ''}`,
    config.rules.length > 0 && `${config.rules.length} règle${config.rules.length > 1 ? 's' : ''}`,
  ].filter((part): part is string => !!part)

  return (
    <StudentRoster
      title="Élèves"
      hint="Clique sur un nom pour ses réglages, ou coche plusieurs élèves pour les marquer absents ou créer une règle."
      students={students}
      summary={summary}
      badges={badges}
      details={details}
      actions={actions}
    />
  )
}
