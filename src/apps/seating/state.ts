import { useCallback, useMemo } from 'react'
import { usePersistentState } from '../../shared/storage.ts'
import { defaultConfig, type SeatingConfig } from './core/model.ts'

interface SeatingData {
  version: 1
  byClass: Record<string, SeatingConfig>
}

export type ConfigChange = Partial<SeatingConfig> | ((config: SeatingConfig) => Partial<SeatingConfig>)

export function useSeatingConfig(classId: string) {
  const [data, setData] = usePersistentState<SeatingData>('seating', { version: 1, byClass: {} })
  const config = useMemo(() => data.byClass[classId] ?? defaultConfig(), [data, classId])
  const update = useCallback(
    (change: ConfigChange) =>
      setData((d) => {
        const old = d.byClass[classId] ?? defaultConfig()
        const patch = typeof change === 'function' ? change(old) : change
        return { ...d, byClass: { ...d.byClass, [classId]: { ...old, ...patch } } }
      }),
    [classId, setData],
  )
  return [config, update] as const
}
