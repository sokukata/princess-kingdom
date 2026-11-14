import { categories, criteria } from '../core/criteria.ts'
import { defaultMaxLength } from '../core/model.ts'
import type { AppreciationsStore } from '../state.ts'

export function Settings({ store }: { store: AppreciationsStore }) {
  const { config } = store
  return (
    <section className="panel appreciations-settings">
      <label className="toggle">
        Longueur maximale
        <input
          type="number"
          min={80}
          max={1000}
          step={10}
          defaultValue={config.maxLength}
          onBlur={(e) => {
            const value = Math.max(80, Number(e.target.value) || defaultMaxLength)
            e.target.value = String(value)
            store.setMaxLength(value)
          }}
        />
        caractères
      </label>
      <p className="hint">Critères utilisés dans cette classe (clique pour masquer ou afficher) :</p>
      {categories.map((category) => (
        <div key={category.id} className="settings-category">
          <strong>{category.label}</strong>
          <div className="chips">
            {criteria
              .filter((c) => c.category === category.id)
              .map((c) => (
                <button
                  key={c.id}
                  className="chip"
                  aria-pressed={!config.hidden.includes(c.id)}
                  onClick={() => store.toggleHidden(c.id)}
                >
                  {c.label}
                </button>
              ))}
          </div>
        </div>
      ))}
    </section>
  )
}
