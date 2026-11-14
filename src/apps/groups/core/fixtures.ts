import type { Student } from '../../../shared/classes/model.ts'
import { defaultConfig, type GroupsConfig } from './model.ts'

export function makeStudents(count: number, girls = Math.floor(count / 2)): Student[] {
  return Array.from({ length: count }, (_, i) => ({
    id: `s${i}`,
    name: `Élève ${i}`,
    gender: i < girls ? ('F' as const) : ('M' as const),
  }))
}

export function makeConfig(change: Partial<GroupsConfig> = {}): GroupsConfig {
  return { ...defaultConfig(), ...change }
}
