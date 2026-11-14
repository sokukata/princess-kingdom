import { categories, levelLabel, type Criterion } from '../core/criteria.ts'
import type { CriterionId, Level, Levels } from '../core/model.ts'

const levels: Level[] = [1, 2, 3, 4]

interface Props {
  criteria: Criterion[]
  values: Levels
  highlighted: CriterionId[]
  focused: number
  onFocus: (index: number) => void
  onChange: (id: CriterionId, level: Level | undefined) => void
  onHighlight: (id: CriterionId) => void
}

// What a criterion rates shows in a hint box while the mouse is on its name.
export function CriteriaList({ criteria, values, highlighted, focused, onFocus, onChange, onHighlight }: Props) {
  return (
    <div className="criteria">
      {categories.map((category) => {
        const items = criteria.filter((c) => c.category === category.id)
        if (items.length === 0) return null
        return (
          <fieldset key={category.id} className="panel">
            <legend>{category.label}</legend>
            {items.map((criterion) => {
              const index = criteria.indexOf(criterion)
              const value = values[criterion.id]
              const star = highlighted.includes(criterion.id)
              return (
                <div
                  key={criterion.id}
                  className={index === focused ? 'criterion focused' : 'criterion'}
                  onClick={() => onFocus(index)}
                >
                  <span className="criterion-label">
                    <button
                      className={star ? 'highlight on' : 'highlight'}
                      aria-pressed={star}
                      title={
                        star
                          ? 'Ne plus mettre ce critère en avant'
                          : value === undefined
                            ? 'Mettre en avant : note d’abord ce critère'
                            : 'Mettre ce critère en avant : il apparaîtra dans l’appréciation'
                      }
                      onClick={() => onHighlight(criterion.id)}
                    >
                      {star ? '★' : '☆'}
                    </button>
                    <span className="criterion-name" aria-describedby={`hint-${criterion.id}`}>
                      {criterion.label}
                      <span className="criterion-hint" id={`hint-${criterion.id}`} role="tooltip">
                        {criterion.hint}
                      </span>
                    </span>
                  </span>
                  <span className="levels" role="group" aria-label={criterion.label}>
                    {levels.map((level) => (
                      <button
                        key={level}
                        className={`chip level-${level}`}
                        aria-pressed={value === level}
                        title={levelLabel(criterion, level)}
                        onClick={() => onChange(criterion.id, value === level ? undefined : level)}
                      >
                        {levelLabel(criterion, level)}
                      </button>
                    ))}
                    <button
                      className="chip"
                      aria-pressed={value === undefined}
                      title="Non évalué"
                      onClick={() => onChange(criterion.id, undefined)}
                    >
                      —
                    </button>
                  </span>
                </div>
              )
            })}
          </fieldset>
        )
      })}
    </div>
  )
}
