import { useState } from 'react'
import type { ClassRoster } from '../../../shared/classes/model.ts'
import { toCsv, toTabs } from '../core/exportText.ts'
import { periods } from '../core/model.ts'
import type { AppreciationsStore } from '../state.ts'
import { appreciationOf, statusLabels } from './appreciation.ts'
import { copyText, downloadFile } from './browser.ts'

interface Props {
  roster: ClassRoster
  store: AppreciationsStore
  onOpen: (index: number) => void
}

export function ClassView({ roster, store, onOpen }: Props) {
  const [copied, setCopied] = useState<string>()
  const rows = roster.students.map((student) => ({
    student,
    appreciation: appreciationOf(student, store.entry(student.id), store.config),
  }))
  const exported = rows.map(({ student, appreciation }) => ({ name: student.name, text: appreciation.text }))
  const period = periods.find((p) => p.id === store.config.period)!.label

  const tabs = toTabs(exported)
  const copyAll = async () => setCopied((await copyText(tabs)) ? tabs : undefined)

  const exportCsv = () =>
    downloadFile(`appreciations-${roster.name}-${period}.csv`.replace(/\s+/g, '-'), toCsv(exported), 'text/csv')

  return (
    <section className="panel class-view">
      <div className="plan-actions">
        <button className="primary" onClick={copyAll} title="Nom ⇥ Appréciation, une ligne par élève">
          {copied === tabs ? 'Copié' : 'Copier tout'}
        </button>
        <button onClick={exportCsv}>Exporter en CSV</button>
      </div>
      <table className="appreciations-table">
        <thead>
          <tr>
            <th>Élève</th>
            <th>État</th>
            <th>Appréciation</th>
          </tr>
        </thead>
        <tbody>
          {rows.map(({ student, appreciation }, index) => (
            <tr key={student.id}>
              <td>
                <button className="link" onClick={() => onOpen(index)}>
                  {student.name}
                </button>
              </td>
              <td>
                <span className={`status ${appreciation.status}`}>{statusLabels[appreciation.status]}</span>
              </td>
              <td>{appreciation.text}</td>
            </tr>
          ))}
        </tbody>
      </table>
    </section>
  )
}
