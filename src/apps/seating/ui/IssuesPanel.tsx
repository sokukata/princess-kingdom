import type { Issue } from '../core/score.ts'

const points = (value: number) => `${value.toLocaleString('fr-FR', { maximumFractionDigits: 1 })} pts`

export function IssuesPanel({ issues }: { issues: Issue[] }) {
  if (issues.length === 0) {
    return (
      <p className="message success celebrate no-print">
        <span aria-hidden="true">✨🌹 </span>Condragulations ! Toutes les règles sont respectées.
        <span aria-hidden="true"> 🌹✨</span>
      </p>
    )
  }
  return (
    <section className="panel issues no-print">
      <h2>
        Règles non respectées{' '}
        <span className="points">{points(issues.reduce((sum, issue) => sum + issue.points, 0))}</span>
      </h2>
      <ul>
        {issues.map((issue, i) => (
          <li key={i} className={issue.kind === 'mix' ? 'info' : undefined}>
            <span>{issue.message}</span>
            <span className="points">{points(issue.points)}</span>
          </li>
        ))}
      </ul>
      <p className="hint">
        Plus le total est bas, mieux c'est. Régénérer donne un autre plan, souvent aussi bon.
        {issues.some((issue) => issue.kind === 'mix') &&
          " Avec nettement plus de filles que de garçons (ou l'inverse), des tables non mixtes sont inévitables."}
      </p>
    </section>
  )
}
