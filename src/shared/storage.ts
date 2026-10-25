import { useEffect, useState } from 'react'

const PREFIX = 'educlog:'

type KeyValueStore = Pick<Storage, 'length' | 'key' | 'getItem' | 'setItem' | 'removeItem'>

// Each module saves under its own key, "educlog:<module>", with a version number in the value so it can migrate alone.
export function usePersistentState<T>(module: string, initial: T) {
  const key = PREFIX + module
  const [value, setValue] = useState<T>(() => {
    const saved = localStorage.getItem(key)
    return saved === null ? initial : (JSON.parse(saved) as T)
  })
  useEffect(() => localStorage.setItem(key, JSON.stringify(value)), [key, value])
  return [value, setValue] as const
}

function educlogKeys(storage: KeyValueStore): string[] {
  return Array.from({ length: storage.length }, (_, i) => storage.key(i)!).filter((key) => key.startsWith(PREFIX))
}

export function exportData(storage: KeyValueStore = localStorage): string {
  const data = Object.fromEntries(educlogKeys(storage).map((key) => [key, JSON.parse(storage.getItem(key)!)]))
  return JSON.stringify(data, null, 2)
}

// Replaces all the educlog data with the content of an exported file.
export function importData(file: string, storage: KeyValueStore = localStorage): void {
  const data = JSON.parse(file) as Record<string, unknown>
  const keys = Object.keys(data).filter((key) => key.startsWith(PREFIX))
  if (keys.length === 0) throw new Error('Not an educlog backup')
  for (const key of educlogKeys(storage)) storage.removeItem(key)
  for (const key of keys) storage.setItem(key, JSON.stringify(data[key]))
}
