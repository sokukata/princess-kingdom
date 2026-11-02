import type { Student, StudentId } from '../../../shared/classes/model.ts'

interface Props {
  students: Student[]
  front: StudentId[]
  back: StudentId[]
  onChange: (change: { front: StudentId[]; back: StudentId[] }) => void
}

const toggle = (ids: StudentId[], id: StudentId) => (ids.includes(id) ? ids.filter((other) => other !== id) : [...ids, id])

// Choosing one place for a student removes them from the other.
export function PlacePicker({ students, front, back, onChange }: Props) {
  return (
    <>
      <fieldset className="panel">
        <legend>Élèves à placer devant</legend>
        <p className="hint">Placés dans les deux premiers rangs, les VIP : une couronne 👑 les signale sur le plan.</p>
        <div className="chips">
          {students.map((s) => (
            <button
              key={s.id}
              className="chip vip"
              aria-pressed={front.includes(s.id)}
              onClick={() => onChange({ front: toggle(front, s.id), back: back.filter((id) => id !== s.id) })}
            >
              {s.name}
            </button>
          ))}
        </div>
      </fieldset>
      <fieldset className="panel">
        <legend>Élèves à placer au fond</legend>
        <p className="hint">Placés dans les deux derniers rangs, à l'abri des regards : une rose 🌹 les signale.</p>
        <div className="chips">
          {students.map((s) => (
            <button
              key={s.id}
              className="chip backstage"
              aria-pressed={back.includes(s.id)}
              onClick={() => onChange({ back: toggle(back, s.id), front: front.filter((id) => id !== s.id) })}
            >
              {s.name}
            </button>
          ))}
        </div>
      </fieldset>
    </>
  )
}
