import type { Student, StudentId } from '../../../shared/classes/model.ts'
import type { Room, Seating, SeatKey } from '../core/model.ts'
import { range, seatKey, tableSides } from '../core/room.ts'

// A custom type, so that text dragged from elsewhere is not taken for a seat.
const SEAT_TYPE = 'application/x-princess-kingdom-seat'

interface Props {
  room: Room
  seating: Seating
  students: Student[]
  pins: Record<StudentId, SeatKey>
  emptyPins: SeatKey[]
  front: StudentId[]
  back: StudentId[]
  teacherView: boolean
  onSwap: (from: SeatKey, to: SeatKey) => void
  onTogglePin: (id: StudentId, seat: SeatKey) => void
  onToggleEmptyPin: (seat: SeatKey) => void
}

// Students' view: board at the top. Teacher's view, from the desk: board at the bottom, left and right swapped.
export function SeatingPlan(props: Props) {
  const { room, seating, students, pins, emptyPins, front, back, teacherView, onSwap, onTogglePin, onToggleEmptyPin } =
    props
  const names = new Map(students.map((s) => [s.id, s.name]))
  const disabled = new Set(room.disabledSeats)
  const keptEmpty = new Set(emptyPins)
  const inFront = new Set(front)
  const atBack = new Set(back)
  const ordered = (count: number) => (teacherView ? range(count).reverse() : range(count))
  const sides = teacherView ? tableSides(room).reverse() : tableSides(room)
  const board = <div className="board">Tableau</div>

  const seatCell = (seat: SeatKey) => {
    const id = seating[seat]
    const name = id === undefined ? undefined : names.get(id)
    const locked = name === undefined ? keptEmpty.has(seat) : pins[id] === seat
    return (
      <div
        key={seat}
        className={`seat${name ? '' : ' empty'}${locked ? ' pinned' : ''}`}
        draggable={name !== undefined && !locked}
        onDragStart={(e) => e.dataTransfer.setData(SEAT_TYPE, seat)}
        onDragOver={(e) => {
          if (!locked && e.dataTransfer.types.includes(SEAT_TYPE)) e.preventDefault()
        }}
        onDrop={(e) => {
          const from = e.dataTransfer.getData(SEAT_TYPE)
          if (from && from !== seat) onSwap(from, seat)
        }}
      >
        {name !== undefined && inFront.has(id) && (
          <span className="badge" title="À placer devant" aria-label="À placer devant">
            👑
          </span>
        )}
        {name !== undefined && atBack.has(id) && (
          <span className="badge" title="À placer au fond" aria-label="À placer au fond">
            🌹
          </span>
        )}
        <span className="name">{name}</span>
        <button
          className="lock no-print"
          title={lockTitle(name !== undefined, locked)}
          aria-pressed={locked}
          onClick={() => (id !== undefined && name !== undefined ? onTogglePin(id, seat) : onToggleEmptyPin(seat))}
        >
          {locked ? '🔒' : '🔓'}
        </button>
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
            // The slot keeps the width of a full table, so that columns stay aligned.
            const alignEnd = sides.length === 2 && kept.length === 1 && kept[0] === seatKey(row, table, sides[1])
            return (
              <div
                key={table}
                className={`desk-slot${sides.length === 1 ? ' solo' : ''}${alignEnd ? ' end' : ''}`}
              >
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

function lockTitle(occupied: boolean, locked: boolean): string {
  if (occupied) return locked ? 'Libérer cette place' : 'Sceller cet élève à cette place'
  return locked ? 'Rendre cette place utilisable' : 'Garder cette place vide'
}
