import type { ReactNode } from 'react'
import { ClassesContext, useClassesStore } from './state.ts'

export function ClassesProvider({ children }: { children: ReactNode }) {
  return <ClassesContext.Provider value={useClassesStore()}>{children}</ClassesContext.Provider>
}
