import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
import { App } from './App.tsx'
import { ClassesProvider } from './shared/classes/ClassesProvider.tsx'
import '@fontsource/cinzel/latin-600.css'
import '@fontsource/cinzel/latin-700.css'
import './shared/styles.css'

createRoot(document.getElementById('root')!).render(
  <StrictMode>
    <ClassesProvider>
      <App />
    </ClassesProvider>
  </StrictMode>,
)
