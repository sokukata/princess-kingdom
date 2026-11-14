import type { Student, StudentId } from '../../../shared/classes/model.ts'
import { SheetLine, StudentRoster, type Badge } from '../../../shared/classes/StudentRoster.tsx'
import type { Rule, SeatingConfig } from '../core/model.ts'
import type { ConfigChange } from '../state.ts'

interface Props {
  students: Student[]
  config: SeatingConfig
  update: (change: ConfigChange) => void
}

type Place = 'free' | 'front' | 'back'

const PLACES: { place: Place; label: string }[] = [
  { place: 'free', label: 'Libre' },
  { place: 'front', label: 'Devant' },
  { place: 'back', label: 'Fond' },
]

const without = (ids: StudentId[], drop: StudentId[]) => ids.filter((id) => !drop.includes(id))

export function StudentsPanel({ students, config, update }: Props) {
  const back = config.back ?? []
  const aesh = config.aesh ?? {}
  const placeOf = (id: StudentId): Place => (config.front.includes(id) ? 'front' : back.includes(id) ? 'back' : 'free')

  // Devant and Fond exclude each other.
  const setPlace = (ids: StudentId[], place: Place) =>
    update((c) => ({
      front: place === 'front' ? [...without(c.front, ids), ...ids] : without(c.front, ids),
      back: place === 'back' ? [...without(c.back ?? [], ids), ...ids] : without(c.back ?? [], ids),
    }))

  const setAesh = (ids: StudentId[], on: boolean) =>
    update((c) => {
      const current = c.aesh ?? {}
      if (on) return { aesh: { ...Object.fromEntries(ids.map((id) => [id, ''])), ...current } }
      return { aesh: Object.fromEntries(Object.entries(current).filter(([id]) => !ids.includes(id))) }
    })

  const addRule = (rule: Rule) => update((c) => ({ rules: [...c.rules, rule] }))

  const badges = (s: Student): Badge[] => {
    const kinds = new Set(config.rules.filter((rule) => rule.ids.includes(s.id)).map((rule) => rule.kind))
    return [
      ...(placeOf(s.id) === 'front' ? [{ label: '👑 Devant', tone: 'gold' as const }] : []),
      ...(placeOf(s.id) === 'back' ? [{ label: '🌹 Fond', tone: 'plum' as const }] : []),
      ...(aesh[s.id] !== undefined ? [{ label: '🧚 AESH', title: aesh[s.id] || undefined }] : []),
      ...(kinds.has('separate') ? [{ label: '⚔️', title: 'À séparer', tone: 'muted' as const }] : []),
      ...(kinds.has('together') ? [{ label: '💞', title: 'Binôme', tone: 'muted' as const }] : []),
    ]
  }

  const details = (s: Student) => (
    <>
      <SheetLine label="Place">
        {PLACES.map(({ place, label }) => (
          <button
            key={place}
            className="chip"
            aria-pressed={placeOf(s.id) === place}
            onClick={() => setPlace([s.id], place)}
          >
            {label}
          </button>
        ))}
      </SheetLine>
      <SheetLine label="AESH">
        <label className="toggle">
          <input
            type="checkbox"
            checked={aesh[s.id] !== undefined}
            onChange={(e) => setAesh([s.id], e.target.checked)}
          />
          Accompagné·e
        </label>
        {aesh[s.id] !== undefined && (
          <input
            className="aesh-name"
            value={aesh[s.id]}
            placeholder="Nom de l'AESH (facultatif)"
            aria-label={`Nom de l'AESH de ${s.name}`}
            onChange={(e) => update((c) => ({ aesh: { ...c.aesh, [s.id]: e.target.value } }))}
          />
        )}
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
        <button disabled={ids.length === 0} onClick={run(() => setPlace(ids, 'front'))}>
          👑 Devant
        </button>
        <button disabled={ids.length === 0} onClick={run(() => setPlace(ids, 'back'))}>
          🌹 Fond
        </button>
        <button disabled={ids.length === 0} onClick={run(() => setAesh(ids, true))}>
          🧚 AESH
        </button>
        <button disabled={ids.length < 2} onClick={run(() => addRule({ kind: 'separate', ids }))}>
          <span aria-hidden="true">⚔️ </span>À séparer
        </button>
        <button
          disabled={ids.length !== 2}
          onClick={run(() => addRule({ kind: 'together', ids: [ids[0], ids[1]] }))}
        >
          <span aria-hidden="true">💞 </span>Binôme
        </button>
      </>
    )
  }

  const aeshCount = Object.keys(aesh).length
  const summary = [
    config.front.length > 0 && `${config.front.length} devant`,
    back.length > 0 && `${back.length} au fond`,
    aeshCount > 0 && `${aeshCount} AESH`,
    config.rules.length > 0 && `${config.rules.length} règle${config.rules.length > 1 ? 's' : ''}`,
  ].filter((part): part is string => !!part)

  return (
    <StudentRoster
      title="Élèves"
      hint="Clique sur un nom pour ses réglages, ou coche plusieurs élèves pour une règle ou un réglage commun."
      students={students}
      summary={summary}
      badges={badges}
      details={details}
      actions={actions}
    />
  )
}
