import type { Student, StudentId } from '../../../shared/classes/model.ts'
import type { Room, Seating, SeatKey } from '../core/model.ts'
import { range, seatKey } from '../core/room.ts'

// A custom type, so that text dragged from elsewhere is not taken for a seat.
const SEAT_TYPE = 'application/x-princess-kingdom-seat'

interface Props {
  room: Room
  seating: Seating
  students: Student[]
  pins: Record<StudentId, SeatKey>
  front: StudentId[]
  teacherView: boolean
  onSwap: (from: SeatKey, to: SeatKey) => void
  onTogglePin: (id: StudentId, seat: SeatKey) => void
}

// Students' view: board at the top. Teacher's view, from the desk: board at the bottom, left and right swapped.
export function SeatingPlan({ room, seating, students, pins, front, teacherView, onSwap, onTogglePin }: Props) {
  const names = new Map(students.map((s) => [s.id, s.name]))
  const disabled = new Set(room.disabledSeats)
  const inFront = new Set(front)
  const ordered = (count: number) => (teacherView ? range(count).reverse() : range(count))
  const sides: (0 | 1)[] = teacherView ? [1, 0] : [0, 1]
  const board = <div className="board">Tableau</div>

  const seatCell = (seat: SeatKey) => {
    const id = seating[seat]
    const name = id === undefined ? undefined : names.get(id)
    const pinned = name !== undefined && pins[id] === seat
    return (
      <div
        key={seat}
        className={`seat${name ? '' : ' empty'}${pinned ? ' pinned' : ''}`}
        draggable={name !== undefined && !pinned}
        onDragStart={(e) => e.dataTransfer.setData(SEAT_TYPE, seat)}
        onDragOver={(e) => {
          if (!pinned && e.dataTransfer.types.includes(SEAT_TYPE)) e.preventDefault()
        }}
        onDrop={(e) => {
          const from = e.dataTransfer.getData(SEAT_TYPE)
          if (from && from !== seat) onSwap(from, seat)
        }}
      >
        {name !== undefined && inFront.has(id) && (
          <span className="crown" title="À placer devant" aria-label="À placer devant">
            👑
          </span>
        )}
        <span className="name">{name}</span>
        {name !== undefined && (
          <button
            className="lock no-print"
            title={pinned ? 'Libérer cette place' : 'Sceller cet élève à cette place'}
            aria-pressed={pinned}
            onClick={() => onTogglePin(id, seat)}
          >
            {pinned ? '🔒' : '🔓'}
          </button>
        )}
      </div>
    )
  }

  return (
    <div className="plan">
      {!teacherView && board}
      {ordered(room.rows).map((row) => (
        <div key={row} className="plan-row">
          <span className="row-label">Rang {row + 1}</span>
          {ordered(room.tablesPerRow).map((table) => {
            const kept = sides.map((side) => seatKey(row, table, side)).filter((seat) => !disabled.has(seat))
            // The slot keeps the width of a two-seat table, so that columns stay aligned.
            const alignEnd = kept.length === 1 && kept[0] === seatKey(row, table, sides[1])
            return (
              <div key={table} className={alignEnd ? 'desk-slot end' : 'desk-slot'}>
                {kept.length === 0 ? (
                  <div className="desk off" />
                ) : (
                  <div className={kept.length === 1 ? 'desk single' : 'desk'}>{kept.map(seatCell)}</div>
                )}
              </div>
            )
          })}
        </div>
      ))}
      {teacherView && board}
    </div>
  )
}
