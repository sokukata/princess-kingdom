import type { GroupsConfig, Grouping } from '../core/model.ts'

interface Props {
  history: GroupsConfig['history']
  onRestore: (grouping: Grouping) => void
  onDelete: (index: number) => void
}

export function HistoryPanel({ history, onRestore, onDelete }: Props) {
  if (history.length === 0) return null
  return (
    <section className="panel no-print">
      <h2>
        <span aria-hidden="true">📜 </span>Tirages validés
      </h2>
      <ul className="history">
        {history
          .map((entry, index) => ({ entry, index }))
          .reverse()
          .map(({ entry, index }) => (
            <li key={index}>
              <span>{new Date(entry.date).toLocaleString('fr-FR', { dateStyle: 'long', timeStyle: 'short' })}</span>
              <button onClick={() => onRestore(entry.grouping)}>Reprendre</button>
              <button
                className="icon"
                title="Supprimer de l'historique"
                onClick={() => confirm("Supprimer ce tirage de l'historique ?") && onDelete(index)}
              >
                ✕
              </button>
            </li>
          ))}
      </ul>
      <p className="hint">Les 3 derniers servent à changer de groupes.</p>
    </section>
  )
}
