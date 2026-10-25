import { Rose } from '../ornaments.tsx'
import { useClasses } from './state.ts'

export function ClassPicker() {
  const { classes, current, select } = useClasses()
  if (classes.length === 0) {
    return (
      <p className="empty-state">
        <Rose size={22} />
        Même la princesse d'Hyrule a besoin de sujets : commence par{' '}
        <a href="#/classes">créer une classe dans Mes classes</a>.
      </p>
    )
  }
  return (
    <label className="class-picker">
      Classe
      <select value={current?.id ?? ''} onChange={(e) => select(e.target.value)}>
        {!current && <option value="">Choisir…</option>}
        {classes.map((c) => (
          <option key={c.id} value={c.id}>
            {c.name}
          </option>
        ))}
      </select>
    </label>
  )
}
