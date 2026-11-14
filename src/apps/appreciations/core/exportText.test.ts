import { describe, expect, it } from 'vitest'
import { toCsv, toTabs } from './exportText.ts'

const rows = [
  { name: 'Léa Martin', text: 'Bon trimestre. Il faut continuer ainsi.' },
  { name: 'Hugo "Le Grand"', text: 'Trimestre fragile; des efforts.' },
]

describe('export', () => {
  it('copies one tab-separated line per student', () => {
    expect(toTabs(rows)).toBe(
      'Léa Martin\tBon trimestre. Il faut continuer ainsi.\nHugo "Le Grand"\tTrimestre fragile; des efforts.',
    )
  })

  it('writes a CSV with a BOM, semicolons and escaped quotes', () => {
    expect(toCsv(rows)).toBe(
      '﻿Élève;Appréciation\r\n' +
        '"Léa Martin";"Bon trimestre. Il faut continuer ainsi."\r\n' +
        '"Hugo ""Le Grand""";"Trimestre fragile; des efforts."\r\n',
    )
  })
})
