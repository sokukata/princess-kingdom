export type StudentId = string

export interface Student {
  id: StudentId
  name: string
  gender?: 'F' | 'M'
}

export interface ClassRoster {
  id: string
  name: string
  students: Student[]
}

// One student per line, optionally ending with F, or G or M for a boy; cells of a row copied from a spreadsheet
// (e.g. a Pronote export) are joined by a space.
export function parseStudents(text: string): Omit<Student, 'id'>[] {
  return text
    .split('\n')
    .map((line) => line.replace(/\s+/g, ' ').trim())
    .filter(Boolean)
    .map((line) => {
      const match = /^(.+) ([FGM])$/i.exec(line)
      if (!match) return { name: line }
      return { name: match[1], gender: match[2].toUpperCase() === 'F' ? 'F' : 'M' }
    })
}
