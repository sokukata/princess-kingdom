import { useCallback, useMemo } from 'react'
import { usePersistentState } from '../../shared/storage.ts'
import { defaultConfig, type GroupsConfig } from './core/model.ts'

interface GroupsData {
  version: 1
  byClass: Record<string, GroupsConfig>
}

export type ConfigChange = Partial<GroupsConfig> | ((config: GroupsConfig) => Partial<GroupsConfig>)

export function useGroupsConfig(classId: string) {
  const [data, setData] = usePersistentState<GroupsData>('groups', { version: 1, byClass: {} })
  const config = useMemo(() => ({ ...defaultConfig(), ...data.byClass[classId] }), [data, classId])
  const update = useCallback(
    (change: ConfigChange) =>
      setData((d) => {
        const old = { ...defaultConfig(), ...d.byClass[classId] }
        const patch = typeof change === 'function' ? change(old) : change
        return { ...d, byClass: { ...d.byClass, [classId]: { ...old, ...patch } } }
      }),
    [classId, setData],
  )
  return [config, update] as const
}
