import { useMemo, useState } from 'react'
import { ClassPicker } from '../../shared/classes/ClassPicker.tsx'
import type { ClassRoster, StudentId } from '../../shared/classes/model.ts'
import { useClasses } from '../../shared/classes/state.ts'
import { compile } from './core/compile.ts'
import type { SeatKey } from './core/model.ts'
import { explain, fromSeating, toSeating } from './core/score.ts'
import { solve } from './core/solver.ts'
import { useSeatingConfig } from './state.ts'
import { FrontPicker } from './ui/FrontPicker.tsx'
import { HistoryPanel } from './ui/HistoryPanel.tsx'
import { IssuesPanel } from './ui/IssuesPanel.tsx'
import { RoomEditor } from './ui/RoomEditor.tsx'
import { RulesEditor } from './ui/RulesEditor.tsx'
import { SeatingPlan } from './ui/SeatingPlan.tsx'

export default function SeatingApp() {
  const { current } = useClasses()
  return (
    <div className="seating">
      <div className="toolbar no-print">
        <h1>Plan de classe</h1>
        <ClassPicker />
      </div>
      {current && <SeatingEditor key={current.id} roster={current} />}
    </div>
  )
}

function SeatingEditor({ roster }: { roster: ClassRoster }) {
  const [config, update] = useSeatingConfig(roster.id)
  const [teacherView, setTeacherView] = useState(false)
  const { current } = config
  const { problem, warnings, blocking } = useMemo(() => compile(roster.students, config), [roster.students, config])
  const assignment = useMemo(() => current && fromSeating(problem, current), [problem, current])
  const issues = useMemo(() => (assignment ? explain(problem, assignment) : []), [problem, assignment])
  const unplaced = assignment ? roster.students.filter((_, x) => assignment.seatOf[x] < 0) : []
  const validated = current !== undefined && JSON.stringify(config.history.at(-1)?.seating) === JSON.stringify(current)

  const generate = () => {
    const seed = Math.floor(Math.random() * 2 ** 32)
    update({ current: toSeating(problem, solve(problem, { seed })) })
  }

  const validate = () =>
    update((c) => ({ history: [...c.history, { date: new Date().toISOString(), seating: c.current! }] }))

  const swapSeats = (from: SeatKey, to: SeatKey) =>
    update((c) => {
      const seating = { ...c.current }
      const moving = seating[from]
      const displaced = seating[to]
      delete seating[from]
      delete seating[to]
      if (moving) seating[to] = moving
      if (displaced) seating[from] = displaced
      return { current: seating }
    })

  // A seat holds at most one lock.
  const togglePin = (id: StudentId, seat: SeatKey) =>
    update((c) => {
      const pins = Object.fromEntries(Object.entries(c.pins).filter(([student, key]) => student !== id && key !== seat))
      return { pins: c.pins[id] === seat ? pins : { ...pins, [id]: seat } }
    })

  return (
    <div className="seating-layout">
      <aside className="no-print">
        <RoomEditor room={config.room} onChange={(room) => update({ room })} />
        <FrontPicker students={roster.students} front={config.front} onChange={(front) => update({ front })} />
        <RulesEditor students={roster.students} config={config} update={update} />
      </aside>

      <section>
        <div className="plan-actions no-print">
          <button className="primary" onClick={generate} disabled={!!blocking || roster.students.length === 0}>
            <span aria-hidden="true">✨ </span>
            {config.current ? 'Régénérer' : 'Générer le plan'}
          </button>
          <button onClick={validate} disabled={!config.current || validated}>
            <span aria-hidden="true">👑 </span>
            {validated ? 'Plan validé' : 'Valider ce plan'}
          </button>
          <label className="toggle">
            <input type="checkbox" checked={teacherView} onChange={(e) => setTeacherView(e.target.checked)} />
            Vue prof
          </label>
          <button onClick={() => window.print()} disabled={!config.current}>
            <span aria-hidden="true">🖨️ </span>
            Imprimer
          </button>
        </div>

        {roster.students.length === 0 && (
          <p className="hint">
            Ajoute d'abord des élèves dans <a href="#/classes">Mes classes</a>.
          </p>
        )}
        {blocking && <p className="message error">{blocking}</p>}
        {warnings.map((warning) => (
          <p key={warning} className="message warning no-print">
            {warning}
          </p>
        ))}

        {config.current && (
          <>
            <h2 className="print-only">Plan de classe : {roster.name}</h2>
            <SeatingPlan
              room={config.room}
              seating={config.current}
              students={roster.students}
              pins={config.pins}
              front={config.front}
              teacherView={teacherView}
              onSwap={swapSeats}
              onTogglePin={togglePin}
            />
            {unplaced.length > 0 && (
              <p className="message warning no-print">
                Sans place : {unplaced.map((s) => s.name).join(', ')}. Régénère le plan (les élèves scellés restent à leur
                place).
              </p>
            )}
            <IssuesPanel issues={issues} />
          </>
        )}

        <HistoryPanel
          history={config.history}
          onRestore={(seating) => update({ current: seating })}
          onDelete={(index) => update((c) => ({ history: c.history.filter((_, i) => i !== index) }))}
        />
      </section>
    </div>
  )
}
