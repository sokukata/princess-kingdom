import { categories, levelLabel, type Criterion } from '../core/criteria.ts'
import type { CriterionId, Level, Levels } from '../core/model.ts'

const levels: Level[] = [1, 2, 3, 4]

interface Props {
  criteria: Criterion[]
  values: Levels
  focused: number
  onFocus: (index: number) => void
  onChange: (id: CriterionId, level: Level | undefined) => void
}

export function CriteriaList({ criteria, values, focused, onFocus, onChange }: Props) {
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
              return (
                <div
                  key={criterion.id}
                  className={index === focused ? 'criterion focused' : 'criterion'}
                  onClick={() => onFocus(index)}
                >
                  <span className="criterion-label">{criterion.label}</span>
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
