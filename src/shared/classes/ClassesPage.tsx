import { useState } from 'react'
import { useClasses } from './state.ts'

const GENDERS = [
  { value: 'F', label: 'F', title: 'Fille' },
  { value: 'M', label: 'G', title: 'Garçon' },
] as const

export function ClassesPage() {
  const { classes, current, select, create, rename, remove, addStudents, updateStudent, removeStudent } = useClasses()
  const [newName, setNewName] = useState('')
  const [pasted, setPasted] = useState('')

  return (
    <div className="classes-page">
      <aside className="panel">
        <h1>Mes classes</h1>
        {classes.length === 0 && <p className="hint">Ton royaume attend ses sujets : crée ta première classe 🌹</p>}
        <ul className="class-list">
          {classes.map((c) => (
            <li key={c.id}>
              <button className={c.id === current?.id ? 'selected' : ''} onClick={() => select(c.id)}>
                {c.name} <small>{c.students.length} élèves</small>
              </button>
            </li>
          ))}
        </ul>
        <form
          className="inline-form"
          onSubmit={(e) => {
            e.preventDefault()
            if (!newName.trim()) return
            create(newName.trim())
            setNewName('')
          }}
        >
          <input value={newName} onChange={(e) => setNewName(e.target.value)} placeholder="Nouvelle classe (ex. 2nde 3)" />
          <button>Créer</button>
        </form>
      </aside>

      {current && (
        <section className="panel">
          <div className="class-header">
            <input
              className="class-name"
              aria-label="Nom de la classe"
              value={current.name}
              onChange={(e) => rename(current.id, e.target.value)}
            />
            <button
              className="danger"
              onClick={() =>
                confirm(`Sashay away ? La classe ${current.name} et ses élèves seront supprimés.`) && remove(current.id)
              }
            >
              Supprimer la classe
            </button>
          </div>

          {current.students.length > 0 && (
            <table className="students">
              <thead>
                <tr>
                  <th>Élève ({current.students.length})</th>
                  <th>F/G</th>
                  <th />
                </tr>
              </thead>
              <tbody>
                {current.students.map((s) => (
                  <tr key={s.id}>
                    <td>
                      <input
                        aria-label="Nom"
                        value={s.name}
                        onChange={(e) => updateStudent(current.id, { ...s, name: e.target.value })}
                      />
                    </td>
                    <td className="genders">
                      {GENDERS.map(({ value, label, title }) => (
                        <button
                          key={value}
                          className="chip"
                          title={title}
                          aria-pressed={s.gender === value}
                          onClick={() =>
                            updateStudent(current.id, { ...s, gender: s.gender === value ? undefined : value })
                          }
                        >
                          {label}
                        </button>
                      ))}
                    </td>
                    <td>
                      <button className="icon" title="Retirer de la classe (sashay away)" onClick={() => removeStudent(current.id, s.id)}>
                        ✕
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          )}

          <form
            className="paste-form"
            onSubmit={(e) => {
              e.preventDefault()
              addStudents(current.id, pasted)
              setPasted('')
            }}
          >
            <label htmlFor="paste">Ajouter des élèves</label>
            <textarea
              id="paste"
              rows={6}
              value={pasted}
              onChange={(e) => setPasted(e.target.value)}
              placeholder={
                "Un élève par ligne, avec F ou G à la fin si tu veux (ex. « Emma Lefebvre F »).\n" +
                "Tu peux aussi coller deux colonnes d'un tableur ou d'un export Pronote : le nom, puis F ou G."
              }
            />
            <button disabled={!pasted.trim()}>Ajouter</button>
          </form>
        </section>
      )}
    </div>
  )
}
