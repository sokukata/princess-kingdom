import { useState } from 'react'
import { ClassPicker } from '../../shared/classes/ClassPicker.tsx'
import type { ClassRoster } from '../../shared/classes/model.ts'
import { useClasses } from '../../shared/classes/state.ts'
import './appreciations.css'
import { criteria } from './core/criteria.ts'
import { periods, previousPeriod, type PeriodId } from './core/model.ts'
import { useAppreciations } from './state.ts'
import { ClassView } from './ui/ClassView.tsx'
import { Settings } from './ui/Settings.tsx'
import { StudentSheet } from './ui/StudentSheet.tsx'

type View = 'sheet' | 'class' | 'settings'

const views: { id: View; label: string }[] = [
  { id: 'sheet', label: 'Fiche élève' },
  { id: 'class', label: 'Vue classe' },
  { id: 'settings', label: 'Réglages' },
]

export default function AppreciationsApp() {
  const { current } = useClasses()
  return (
    <div className="appreciations">
      <div className="toolbar">
        <h1>Appréciations</h1>
        <ClassPicker />
      </div>
      {current && <AppreciationsEditor key={current.id} roster={current} />}
    </div>
  )
}

function AppreciationsEditor({ roster }: { roster: ClassRoster }) {
  const store = useAppreciations(roster.id)
  const [view, setView] = useState<View>('sheet')
  const [index, setIndex] = useState(0)
  const visible = criteria.filter((c) => !store.config.hidden.includes(c.id))
  const previous = previousPeriod(store.config.period)
  const selected = Math.min(index, roster.students.length - 1)

  if (roster.students.length === 0) {
    return (
      <p className="hint">
        Ajoute d'abord des élèves dans <a href="#/classes">Mes classes</a>.
      </p>
    )
  }

  const copyPrevious = () => {
    const label = periods.find((p) => p.id === previous)!.label
    if (confirm(`Reprendre les niveaux du ${label} pour les élèves pas encore évalués ?`)) store.copyPrevious!()
  }

  return (
    <>
      <div className="plan-actions">
        <label className="class-picker">
          Période
          <select value={store.config.period} onChange={(e) => store.setPeriod(e.target.value as PeriodId)}>
            {periods.map((p) => (
              <option key={p.id} value={p.id}>
                {p.label}
              </option>
            ))}
          </select>
        </label>
        {store.copyPrevious && (
          <button onClick={copyPrevious}>Reprendre les niveaux de la période précédente</button>
        )}
        <span className="chips views" role="tablist">
          {views.map((v) => (
            <button key={v.id} className="chip" role="tab" aria-pressed={view === v.id} onClick={() => setView(v.id)}>
              {v.label}
            </button>
          ))}
        </span>
      </div>
      {view === 'sheet' && (
        <StudentSheet
          students={roster.students}
          index={selected}
          onSelect={setIndex}
          criteria={visible}
          store={store}
        />
      )}
      {view === 'class' && (
        <ClassView
          roster={roster}
          store={store}
          onOpen={(i) => {
            setIndex(i)
            setView('sheet')
          }}
        />
      )}
      {view === 'settings' && <Settings store={store} />}
    </>
  )
}
