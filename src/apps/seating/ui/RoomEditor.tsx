import type { Room, SeatKey } from '../core/model.ts'
import { range, seatKey } from '../core/room.ts'

const MAX_ROWS = 10
const MAX_TABLES_PER_ROW = 6

export function RoomEditor({ room, onChange }: { room: Room; onChange: (room: Room) => void }) {
  const disabled = new Set(room.disabledSeats)
  const toggle = (key: SeatKey) => {
    const next = new Set(disabled)
    if (next.has(key)) next.delete(key)
    else next.add(key)
    onChange({ ...room, disabledSeats: [...next] })
  }

  return (
    <fieldset className="panel">
      <legend>Salle</legend>
      <div className="room-size">
        <label>
          Rangs
          <select value={room.rows} onChange={(e) => onChange({ ...room, rows: Number(e.target.value) })}>
            {range(MAX_ROWS).map((i) => (
              <option key={i}>{i + 1}</option>
            ))}
          </select>
        </label>
        <label>
          Tables de 2 par rang
          <select value={room.tablesPerRow} onChange={(e) => onChange({ ...room, tablesPerRow: Number(e.target.value) })}>
            {range(MAX_TABLES_PER_ROW).map((i) => (
              <option key={i}>{i + 1}</option>
            ))}
          </select>
        </label>
      </div>
      <div className="mini-room">
        <div className="board">Tableau</div>
        {range(room.rows).map((row) => (
          <div key={row} className="mini-row">
            {range(room.tablesPerRow).map((table) => (
              <div key={table} className="mini-table">
                {([0, 1] as const).map((side) => {
                  const key = seatKey(row, table, side)
                  return (
                    <button
                      key={side}
                      className={disabled.has(key) ? 'mini-seat off' : 'mini-seat'}
                      aria-label={`Rang ${row + 1}, table ${table + 1}, place de ${side === 0 ? 'gauche' : 'droite'}`}
                      aria-pressed={!disabled.has(key)}
                      onClick={() => toggle(key)}
                    />
                  )
                })}
              </div>
            ))}
          </div>
        ))}
      </div>
      <p className="hint">
        Clique sur une place pour la retirer ou la remettre : table à une place, pilier, table cassée… Une table sans
        place disparaît du plan.
      </p>
    </fieldset>
  )
}
