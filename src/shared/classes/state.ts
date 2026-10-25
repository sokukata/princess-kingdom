import { createContext, useContext, useMemo } from 'react'
import { usePersistentState } from '../storage.ts'
import { parseStudents, type ClassRoster, type Student } from './model.ts'

interface ClassesData {
  version: 1
  classes: ClassRoster[]
  currentClassId?: string
}

// Not crypto.randomUUID(): browsers only provide it over HTTPS or on localhost, and the app is also served over plain HTTP.
const newId = () => Array.from(crypto.getRandomValues(new Uint8Array(16)), (b) => b.toString(16).padStart(2, '0')).join('')

// Called once, by ClassesProvider; tools read the store with useClasses().
export function useClassesStore() {
  const [data, setData] = usePersistentState<ClassesData>('classes', { version: 1, classes: [] })
  return useMemo(() => {
    const edit = (classId: string, change: (roster: ClassRoster) => ClassRoster) =>
      setData((d) => ({ ...d, classes: d.classes.map((c) => (c.id === classId ? change(c) : c)) }))
    return {
      classes: data.classes,
      current: data.classes.find((c) => c.id === data.currentClassId),
      select: (classId: string) => setData((d) => ({ ...d, currentClassId: classId })),
      create(name: string) {
        const roster = { id: newId(), name, students: [] }
        setData((d) => ({ ...d, classes: [...d.classes, roster], currentClassId: roster.id }))
      },
      rename: (classId: string, name: string) => edit(classId, (c) => ({ ...c, name })),
      remove: (classId: string) =>
        setData((d) => ({
          ...d,
          classes: d.classes.filter((c) => c.id !== classId),
          currentClassId: d.currentClassId === classId ? undefined : d.currentClassId,
        })),
      addStudents(classId: string, text: string) {
        const added = parseStudents(text).map((student) => ({ id: newId(), ...student }))
        edit(classId, (c) => ({ ...c, students: [...c.students, ...added] }))
      },
      updateStudent: (classId: string, student: Student) =>
        edit(classId, (c) => ({ ...c, students: c.students.map((s) => (s.id === student.id ? student : s)) })),
      removeStudent: (classId: string, studentId: string) =>
        edit(classId, (c) => ({ ...c, students: c.students.filter((s) => s.id !== studentId) })),
    }
  }, [data, setData])
}

export const ClassesContext = createContext<ReturnType<typeof useClassesStore> | null>(null)

export function useClasses() {
  const store = useContext(ClassesContext)
  if (!store) throw new Error('useClasses must be called under ClassesProvider')
  return store
}
