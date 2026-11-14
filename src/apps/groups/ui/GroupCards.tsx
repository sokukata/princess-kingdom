import type { Student, StudentId } from '../../../shared/classes/model.ts'
import type { Grouping } from '../core/model.ts'

// A custom type, so that text dragged from elsewhere is not taken for a student.
const STUDENT_TYPE = 'application/x-princess-kingdom-group-student'

interface Props {
  grouping: Grouping
  students: Student[]
  absent: StudentId[]
  projected: boolean
  onSwap: (from: StudentId, to: StudentId) => void
}

// Students who are absent today or no longer in the class are left out of the cards.
export function GroupCards({ grouping, students, absent, projected, onSwap }: Props) {
  const names = new Map(students.map((s) => [s.id, s.name]))
  const away = new Set(absent)
  return (
    <div className={`group-cards${projected ? ' projected' : ''}`}>
      {grouping.groups.map((group, g) => (
        <section key={g} className="group-card">
          <h3>Groupe {g + 1}</h3>
          <ul>
            {group.map((id, k) => {
              const name = names.get(id)
              if (name === undefined || away.has(id)) return null
              const role = grouping.roles?.[g]?.[k]
              return (
                <li
                  key={id}
                  className="group-student"
                  draggable
                  onDragStart={(e) => e.dataTransfer.setData(STUDENT_TYPE, id)}
                  onDragOver={(e) => {
                    if (e.dataTransfer.types.includes(STUDENT_TYPE)) e.preventDefault()
                  }}
                  onDrop={(e) => {
                    const from = e.dataTransfer.getData(STUDENT_TYPE)
                    if (from && from !== id) onSwap(from, id)
                  }}
                >
                  <span className="name">{name}</span>
                  {role && <span className="role">{role}</span>}
                </li>
              )
            })}
          </ul>
        </section>
      ))}
    </div>
  )
}
