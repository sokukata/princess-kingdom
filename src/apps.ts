import type { ComponentType } from 'react'

export interface Tool {
  id: string // the tool is served at #/<id>
  title: string
  icon: string // an emoji, shown on the home page
  description: string
  load: () => Promise<{ default: ComponentType }>
}

export const tools: Tool[] = [
  {
    id: 'seating',
    title: 'Plan de classe',
    icon: '👑',
    description: 'Place ta cour : bavards séparés, VIP devant, binômes, rotation…',
    load: () => import('./apps/seating/SeatingApp.tsx'),
  },
]
