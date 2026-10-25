import type { ChangeEvent, ReactNode } from 'react'
import { Crown } from './ornaments.tsx'
import { exportData, importData } from './storage.ts'

function download() {
  const url = URL.createObjectURL(new Blob([exportData()], { type: 'application/json' }))
  const link = document.createElement('a')
  link.href = url
  link.download = `princess-kingdom-${new Date().toISOString().slice(0, 10)}.json`
  link.click()
  URL.revokeObjectURL(url)
}

async function upload(event: ChangeEvent<HTMLInputElement>) {
  const file = event.target.files?.[0]
  event.target.value = ''
  if (!file || !confirm("L'import remplace toutes les données actuelles (classes, plans…). Continuer ?")) return
  try {
    importData(await file.text())
    location.reload()
  } catch {
    alert("Ce fichier n'est pas une sauvegarde Princess Kingdom.")
  }
}

export function Layout({ children }: { children: ReactNode }) {
  return (
    <>
      <header className="topbar no-print">
        <a className="brand" href="#/">
          <Crown />
          Princess Kingdom
        </a>
        <nav>
          <a href="#/classes">Mes classes</a>
        </nav>
        <div className="topbar-actions">
          <button onClick={download} title="Télécharger une sauvegarde de toutes les données">
            Exporter
          </button>
          <label className="button" title="Remplacer les données par une sauvegarde">
            Importer
            <input type="file" accept=".json,application/json" hidden onChange={upload} />
          </label>
        </div>
      </header>
      <main>{children}</main>
    </>
  )
}
