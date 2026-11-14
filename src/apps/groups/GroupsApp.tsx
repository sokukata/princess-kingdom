import { useMemo, useState } from 'react'
import { ClassPicker } from '../../shared/classes/ClassPicker.tsx'
import type { ClassRoster, StudentId } from '../../shared/classes/model.ts'
import { useClasses } from '../../shared/classes/state.ts'
import { compile } from './core/compile.ts'
import { explain, fromGrouping, toGrouping } from './core/score.ts'
import { assignRoles, solve } from './core/solver.ts'
import './groups.css'
import { useGroupsConfig } from './state.ts'
import { GroupCards } from './ui/GroupCards.tsx'
import { HistoryPanel } from './ui/HistoryPanel.tsx'
import { IssuesPanel } from './ui/IssuesPanel.tsx'
import { RulesEditor } from './ui/RulesEditor.tsx'
import { SizePanel } from './ui/SizePanel.tsx'
import { StudentsPanel } from './ui/StudentsPanel.tsx'

export default function GroupsApp() {
  const { current } = useClasses()
  return (
    <div className="groups">
      <div className="toolbar no-print">
        <h1>Groupes de travail</h1>
        <ClassPicker />
      </div>
      {current && <GroupsEditor key={current.id} roster={current} />}
    </div>
  )
}

const newSeed = () => crypto.getRandomValues(new Uint32Array(1))[0]

function GroupsEditor({ roster }: { roster: ClassRoster }) {
  const [config, update] = useGroupsConfig(roster.id)
  const [projected, setProjected] = useState(false)
  const { current } = config
  const { problem, warnings, blocking } = useMemo(() => compile(roster.students, config), [roster.students, config])
  const issues = useMemo(() => (current ? explain(problem, fromGrouping(problem, current)) : []), [problem, current])
  const placed = new Set(current?.groups.flat())
  const unplaced = current ? problem.students.filter((s) => !placed.has(s.id)) : []
  const validated =
    current !== undefined && JSON.stringify(config.history.at(-1)?.grouping) === JSON.stringify(current)

  const generate = () => {
    const seed = newSeed()
    const groups = solve(problem, { seed })
    const roles = config.useRoles ? assignRoles(groups, config.roleNames, seed) : undefined
    update({ current: toGrouping(problem, groups, roles) })
  }

  const validate = () =>
    update((c) => ({ history: [...c.history, { date: new Date().toISOString(), grouping: c.current! }] }))

  // Roles belong to the places in the groups, so they stay where they are.
  const swapStudents = (from: StudentId, to: StudentId) =>
    update((c) => {
      const groups = c.current!.groups.map((g) => g.map((id) => (id === from ? to : id === to ? from : id)))
      return { current: { ...c.current!, groups } }
    })

  return (
    <div className="seating-layout">
      <aside className="no-print">
        <SizePanel students={roster.students} config={config} update={update} />
        <StudentsPanel students={roster.students} config={config} update={update} />
        <RulesEditor classId={roster.id} students={roster.students} config={config} update={update} />
      </aside>

      <section>
        <div className="plan-actions no-print">
          <button className="primary" onClick={generate} disabled={!!blocking}>
            <span aria-hidden="true">✨ </span>
            {current ? 'Changer de groupes' : 'Former les groupes'}
          </button>
          <button onClick={validate} disabled={!current || validated}>
            <span aria-hidden="true">👑 </span>
            {validated ? 'Tirage validé' : 'Valider ce tirage'}
          </button>
          <label className="toggle">
            <input type="checkbox" checked={projected} onChange={(e) => setProjected(e.target.checked)} />
            Vue projetée
          </label>
          <button onClick={() => window.print()} disabled={!current}>
            <span aria-hidden="true">🖨️ </span>
            Imprimer
          </button>
        </div>

        {roster.students.length === 0 && (
          <p className="hint">
            Ajoute d'abord des élèves dans <a href="#/classes">Mes classes</a>.
          </p>
        )}
        {blocking && roster.students.length > 0 && <p className="message error">{blocking}</p>}
        {warnings.map((warning) => (
          <p key={warning} className="message warning no-print">
            {warning}
          </p>
        ))}

        {current && (
          <>
            <h2 className="print-only">Groupes de travail : {roster.name}</h2>
            <GroupCards
              grouping={current}
              students={roster.students}
              absent={config.absent}
              projected={projected}
              onSwap={swapStudents}
            />
            {unplaced.length > 0 && (
              <p className="message warning no-print">
                Sans groupe : {unplaced.map((s) => s.name).join(', ')}. Change de groupes pour les placer.
              </p>
            )}
            <IssuesPanel issues={issues} />
          </>
        )}

        <HistoryPanel
          history={config.history}
          onRestore={(grouping) => update({ current: grouping })}
          onDelete={(index) => update((c) => ({ history: c.history.filter((_, i) => i !== index) }))}
        />
      </section>
    </div>
  )
}
