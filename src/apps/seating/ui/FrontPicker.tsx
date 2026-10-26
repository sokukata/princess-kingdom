import type { Student, StudentId } from '../../../shared/classes/model.ts'

interface Props {
  students: Student[]
  front: StudentId[]
  onChange: (front: StudentId[]) => void
}

export function FrontPicker({ students, front, onChange }: Props) {
  const selected = new Set(front)
  return (
    <fieldset className="panel">
      <legend>Élèves à placer devant</legend>
      <p className="hint">Placés dans les deux premiers rangs, les VIP : une couronne 👑 les signale sur le plan.</p>
      <div className="chips">
        {students.map((s) => (
          <button
            key={s.id}
            className="chip vip"
            aria-pressed={selected.has(s.id)}
            onClick={() => onChange(selected.has(s.id) ? front.filter((id) => id !== s.id) : [...front, s.id])}
          >
            {s.name}
          </button>
        ))}
      </div>
    </fieldset>
  )
}
