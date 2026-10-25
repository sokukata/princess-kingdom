import { describe, expect, it } from 'vitest'
import { parseStudents } from './model.ts'

describe('parseStudents', () => {
  it('reads one student per line, with an optional F or G at the end', () => {
    const pasted = 'Emma Lefebvre F\n  Lucas   Moreau g \n\nCHEVALIER\tInès\tF\r\nTom Lambert M\nJade Clément'
    expect(parseStudents(pasted)).toEqual([
      { name: 'Emma Lefebvre', gender: 'F' },
      { name: 'Lucas Moreau', gender: 'M' },
      { name: 'CHEVALIER Inès', gender: 'F' },
      { name: 'Tom Lambert', gender: 'M' },
      { name: 'Jade Clément' },
    ])
  })

  it('keeps a one-word line as a name', () => {
    expect(parseStudents('F\nGaspard')).toEqual([{ name: 'F' }, { name: 'Gaspard' }])
  })
})
