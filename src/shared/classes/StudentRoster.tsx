import { useState, type ReactNode } from 'react'
import type { Student, StudentId } from './model.ts'

export interface Badge {
  label: string
  tone?: 'gold' | 'plum' | 'muted'
  title?: string
}

interface Props {
  title: string
  hint?: ReactNode
  students: Student[]
  summary?: string[]
  badges: (student: Student) => Badge[]
  details: (student: Student) => ReactNode
  actions: (selected: StudentId[], clear: () => void) => ReactNode
}

// The class list of a tool: one row per student, never cut, with badges for what is set. A click on the name opens
// the student's sheet, which the tool fills; ticked students get the tool's bulk actions. A new per-student setting
// adds a line to the sheet and a badge, not a column.
export function StudentRoster({ title, hint, students, summary, badges, details, actions }: Props) {
  const [selected, setSelected] = useState<StudentId[]>([])
  const [open, setOpen] = useState<StudentId>()
  const present = new Set(students.map((s) => s.id))
  const ticked = selected.filter((id) => present.has(id))
  const tick = (id: StudentId) =>
    setSelected((ids) => (ids.includes(id) ? ids.filter((other) => other !== id) : [...ids, id]))

  return (
    <fieldset className="panel student-roster">
      <legend>{title}</legend>
      {hint && <p className="hint">{hint}</p>}
      {summary && summary.length > 0 && <p className="students-summary">{summary.join(' · ')}</p>}
      <ul className="student-rows">
        {students.map((s) => {
          const isOpen = open === s.id
          return (
            <li key={s.id} className={isOpen ? 'open' : undefined}>
              <div className="student-row">
                <input
                  type="checkbox"
                  aria-label={`Cocher ${s.name}`}
                  checked={ticked.includes(s.id)}
                  onChange={() => tick(s.id)}
                />
                <button
                  className="student-name"
                  aria-expanded={isOpen}
                  title={isOpen ? 'Fermer la fiche' : 'Ouvrir la fiche'}
                  onClick={() => setOpen(isOpen ? undefined : s.id)}
                >
                  {s.name}
                </button>
                <span className="badges">
                  {badges(s).map((badge) => (
                    <span key={badge.label} className={`badge-pill ${badge.tone ?? ''}`} title={badge.title}>
                      {badge.label}
                    </span>
                  ))}
                </span>
              </div>
              {isOpen && <div className="student-sheet">{details(s)}</div>}
            </li>
          )
        })}
      </ul>
      <div className="rule-bar">
        <span className="rule-bar-count">
          {ticked.length === 0
            ? 'Coche des élèves pour leur appliquer une action'
            : `${ticked.length} élève${ticked.length > 1 ? 's' : ''} coché${ticked.length > 1 ? 's' : ''}`}
        </span>
        {/* Always shown, so the actions are known in advance; each one is disabled until enough students are ticked. */}
        {actions(ticked, () => setSelected([]))}
        {ticked.length > 0 && (
          <button className="icon" title="Tout décocher" onClick={() => setSelected([])}>
            ✕
          </button>
        )}
      </div>
    </fieldset>
  )
}

// One line of a student sheet: a label, then its control.
export function SheetLine({ label, children }: { label: string; children: ReactNode }) {
  return (
    <div className="sheet-line">
      <span className="sheet-label">{label}</span>
      <span className="sheet-control">{children}</span>
    </div>
  )
}
