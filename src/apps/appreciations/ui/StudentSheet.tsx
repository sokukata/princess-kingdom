import { useEffect, useState } from 'react'
import type { Student } from '../../../shared/classes/model.ts'
import type { Criterion } from '../core/criteria.ts'
import type { Level } from '../core/model.ts'
import type { AppreciationsStore } from '../state.ts'
import { appreciationOf } from './appreciation.ts'
import { isTextField } from './browser.ts'
import { CriteriaList } from './CriteriaList.tsx'
import { TextPanel } from './TextPanel.tsx'

interface Props {
  students: Student[]
  index: number
  onSelect: (index: number) => void
  criteria: Criterion[]
  store: AppreciationsStore
}

export function StudentSheet({ students, index, onSelect, criteria, store }: Props) {
  const [focused, setFocused] = useState(0)
  const student = students[index]
  const entry = store.entry(student.id)
  const appreciation = appreciationOf(student, entry, store.config)
  const row = Math.min(focused, criteria.length - 1)

  useEffect(() => {
    const onKey = (event: KeyboardEvent) => {
      if (isTextField(event.target) || event.ctrlKey || event.metaKey || event.altKey) return
      const criterion = criteria[row]
      if (event.key === 'ArrowDown') setFocused(Math.min(row + 1, criteria.length - 1))
      else if (event.key === 'ArrowUp') setFocused(Math.max(row - 1, 0))
      else if (event.key === 'ArrowLeft') onSelect(Math.max(index - 1, 0))
      else if (event.key === 'ArrowRight') onSelect(Math.min(index + 1, students.length - 1))
      else if (criterion && /^[0-4]$/.test(event.key)) {
        store.setLevel(student.id, criterion.id, event.key === '0' ? undefined : (Number(event.key) as Level))
      } else return
      event.preventDefault()
    }
    window.addEventListener('keydown', onKey)
    return () => window.removeEventListener('keydown', onKey)
  }, [criteria, row, index, students.length, student.id, onSelect, store])

  return (
    <div className="student-sheet">
      <div className="sheet-nav plan-actions">
        <button onClick={() => onSelect(index - 1)} disabled={index === 0} aria-label="Élève précédent">
          ←
        </button>
        <strong className="sheet-name">{student.name}</strong>
        <span className="hint">
          {index + 1} / {students.length}
        </span>
        <button onClick={() => onSelect(index + 1)} disabled={index === students.length - 1} aria-label="Élève suivant">
          →
        </button>
      </div>
      {!student.gender && (
        <p className="message warning">
          F/G non renseigné dans <a href="#/classes">Mes classes</a> : le texte évite les accords au masculin ou au
          féminin.
        </p>
      )}
      <p className="hint">Clavier : ↑ ↓ pour le critère, 1 à 4 pour le niveau, 0 pour effacer, ← → pour l’élève.</p>
      <div className="sheet-layout">
        <CriteriaList
          criteria={criteria}
          values={entry.levels}
          focused={row}
          onFocus={setFocused}
          onChange={(id, level) => store.setLevel(student.id, id, level)}
        />
        <TextPanel
          appreciation={appreciation}
          onReroll={(reroll) => store.reroll(student.id, reroll)}
          onEdit={(text) => store.setText(student.id, text)}
          onRegenerate={() => store.regenerate(student.id)}
        />
      </div>
    </div>
  )
}
