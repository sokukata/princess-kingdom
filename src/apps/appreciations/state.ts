import { useCallback, useMemo } from 'react'
import type { StudentId } from '../../shared/classes/model.ts'
import { usePersistentState } from '../../shared/storage.ts'
import {
  defaultClassAppreciations,
  previousPeriod,
  type ClassAppreciations,
  type CriterionId,
  type Level,
  type StudentEntry,
} from './core/model.ts'

interface AppreciationsData {
  version: 1
  byClass: Record<string, ClassAppreciations>
}

export function useAppreciations(classId: string) {
  const [data, setData] = usePersistentState<AppreciationsData>('appreciations', { version: 1, byClass: {} })
  const config = useMemo(() => data.byClass[classId] ?? defaultClassAppreciations(), [data, classId])

  const update = useCallback(
    (change: (c: ClassAppreciations) => Partial<ClassAppreciations>) =>
      setData((d) => {
        const old = d.byClass[classId] ?? defaultClassAppreciations()
        return { ...d, byClass: { ...d.byClass, [classId]: { ...old, ...change(old) } } }
      }),
    [classId, setData],
  )

  return useMemo(() => {
    const entries = config.periods[config.period] ?? {}
    const editEntry = (id: StudentId, change: (e: StudentEntry) => StudentEntry) =>
      update((c) => {
        const period = c.periods[c.period] ?? {}
        const entry = change(period[id] ?? { levels: {} })
        return { periods: { ...c.periods, [c.period]: { ...period, [id]: entry } } }
      })
    const previous = previousPeriod(config.period)

    return {
      config,
      entries,
      entry: (id: StudentId): StudentEntry => entries[id] ?? { levels: {} },
      setPeriod: (period: ClassAppreciations['period']) => update(() => ({ period })),
      setMaxLength: (maxLength: number) => update(() => ({ maxLength })),
      toggleHidden: (id: CriterionId) =>
        update((c) => ({ hidden: c.hidden.includes(id) ? c.hidden.filter((h) => h !== id) : [...c.hidden, id] })),
      setLevel: (id: StudentId, criterion: CriterionId, level: Level | undefined) =>
        editEntry(id, (e) => {
          const levels = { ...e.levels }
          if (level) levels[criterion] = level
          else delete levels[criterion]
          return { ...e, levels }
        }),
      reroll: (id: StudentId, reroll: number) => editEntry(id, (e) => ({ ...e, reroll, text: undefined })),
      setText: (id: StudentId, text: string) => editEntry(id, (e) => ({ ...e, text })),
      regenerate: (id: StudentId) => editEntry(id, (e) => ({ ...e, text: undefined })),
      // Levels only, for the students not rated yet: the texts of the previous period are not about this one.
      copyPrevious:
        previous && config.periods[previous]
          ? () =>
              update((c) => {
                const before = c.periods[previous] ?? {}
                const period = { ...c.periods[c.period] }
                for (const [id, entry] of Object.entries(before)) {
                  if (Object.keys(period[id]?.levels ?? {}).length > 0) continue
                  period[id] = { ...period[id], levels: { ...entry.levels } }
                }
                return { periods: { ...c.periods, [c.period]: period } }
              })
          : undefined,
    }
  }, [config, update])
}

export type AppreciationsStore = ReturnType<typeof useAppreciations>
