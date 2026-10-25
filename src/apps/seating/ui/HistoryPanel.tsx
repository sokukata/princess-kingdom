import type { SeatingConfig, Seating } from '../core/model.ts'

interface Props {
  history: SeatingConfig['history']
  onRestore: (seating: Seating) => void
  onDelete: (index: number) => void
}

export function HistoryPanel({ history, onRestore, onDelete }: Props) {
  if (history.length === 0) return null
  return (
    <section className="panel no-print">
      <h2>
        <span aria-hidden="true">📜 </span>Plans validés
      </h2>
      <ul className="history">
        {history
          .map((entry, index) => ({ entry, index }))
          .reverse()
          .map(({ entry, index }) => (
            <li key={index}>
              <span>{new Date(entry.date).toLocaleString('fr-FR', { dateStyle: 'long', timeStyle: 'short' })}</span>
              <button onClick={() => onRestore(entry.seating)}>Reprendre</button>
              <button
                className="icon"
                title="Supprimer de l'historique"
                onClick={() => confirm("Supprimer ce plan de l'historique ?") && onDelete(index)}
              >
                ✕
              </button>
            </li>
          ))}
      </ul>
      <p className="hint">Les 3 derniers servent à changer de voisins, le dernier à la rotation devant/fond.</p>
    </section>
  )
}
