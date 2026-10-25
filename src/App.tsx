import { lazy, Suspense, useEffect, useState, type ReactElement } from 'react'
import { tools } from './apps.ts'
import { ClassesPage } from './shared/classes/ClassesPage.tsx'
import { Layout } from './shared/Layout.tsx'
import { RoseDivider } from './shared/ornaments.tsx'

const toolPages = new Map<string, ReactElement>(
  tools.map((tool) => {
    const Page = lazy(tool.load)
    return [tool.id, <Page key={tool.id} />]
  }),
)

const routeOf = (hash: string) => hash.replace(/^#\/?/, '')

function useRoute() {
  const [route, setRoute] = useState(() => routeOf(location.hash))
  useEffect(() => {
    const onChange = () => setRoute(routeOf(location.hash))
    window.addEventListener('hashchange', onChange)
    return () => window.removeEventListener('hashchange', onChange)
  }, [])
  return route
}

const ROYAL_WORDS = [
  "Que ta cour soit sage aujourd'hui, Princesse 👑",
  "Que la sagesse de Zelda guide ta classe aujourd'hui ✨",
  'Zelda a scellé Ganon ; toi, scelle les bavards du fond 🔒',
  'Bavards du fond : sashay away 💅',
  'Shantay, tu restes au premier rang 🌹',
  "Par l'or de l'Arbre sacré, que le calme règne sur la classe ✨",
  'The library is open… mais seulement après la sonnerie 📚',
  'Chaque rose a ses épines, chaque classe ses bavards 🌹',
  'Category is : silence royal 👑',
]
const royalWordOfTheDay = ROYAL_WORDS[Math.floor(Date.now() / 86_400_000) % ROYAL_WORDS.length]

function Home() {
  return (
    <div className="home">
      <h1>Bienvenue au royaume, Princesse</h1>
      <RoseDivider />
      <p className="royal-word">{royalWordOfTheDay}</p>
      <div className="tiles">
        <a className="tile" href="#/classes">
          <span className="tile-icon" aria-hidden="true">
            📜
          </span>
          <h2>Mes classes</h2>
          <p>Les sujets du royaume : classes et élèves, saisis une fois pour tous les outils.</p>
        </a>
        {tools.map((tool) => (
          <a key={tool.id} className="tile" href={`#/${tool.id}`}>
            <span className="tile-icon" aria-hidden="true">
              {tool.icon}
            </span>
            <h2>{tool.title}</h2>
            <p>{tool.description}</p>
          </a>
        ))}
      </div>
    </div>
  )
}

export function App() {
  const route = useRoute()
  return (
    <Layout>
      <Suspense>{route === 'classes' ? <ClassesPage /> : (toolPages.get(route) ?? <Home />)}</Suspense>
    </Layout>
  )
}
