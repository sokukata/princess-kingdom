import { describe, expect, it } from 'vitest'
import { exportData, importData } from './storage.ts'

class MemoryStorage {
  private items = new Map<string, string>()
  get length() {
    return this.items.size
  }
  key(index: number) {
    return [...this.items.keys()][index] ?? null
  }
  getItem(key: string) {
    return this.items.get(key) ?? null
  }
  setItem(key: string, value: string) {
    this.items.set(key, value)
  }
  removeItem(key: string) {
    this.items.delete(key)
  }
}

describe('export and import', () => {
  it('restores exactly the exported educlog data and leaves other data alone', () => {
    const storage = new MemoryStorage()
    const classes = JSON.stringify({ version: 1, classes: [{ id: 'c1', name: '2nde 3', students: [] }] })
    const seating = JSON.stringify({ version: 1, byClass: { c1: { front: ['s1'] } } })
    storage.setItem('educlog:classes', classes)
    storage.setItem('educlog:seating', seating)
    storage.setItem('other-app', 'untouched')
    const file = exportData(storage)

    storage.setItem('educlog:classes', JSON.stringify({ version: 1, classes: [] }))
    storage.setItem('educlog:later', '{}')
    importData(file, storage)

    expect(storage.getItem('educlog:classes')).toBe(classes)
    expect(storage.getItem('educlog:seating')).toBe(seating)
    expect(storage.getItem('educlog:later')).toBeNull()
    expect(storage.getItem('other-app')).toBe('untouched')
  })

  it('rejects a file that is not an educlog backup', () => {
    const storage = new MemoryStorage()
    storage.setItem('educlog:classes', '{}')
    expect(() => importData('{"something": 1}', storage)).toThrow()
    expect(() => importData('not json', storage)).toThrow()
    expect(storage.getItem('educlog:classes')).toBe('{}')
  })
})
