export interface Row {
  name: string
  text: string
}

// One line per student, name and comment separated by a tab, ready to paste in a spreadsheet or Pronote.
export const toTabs = (rows: Row[]) => rows.map((r) => `${r.name}\t${r.text}`).join('\n')

const cell = (value: string) => `"${value.replaceAll('"', '""')}"`

// The BOM makes Excel read the file as UTF-8, and the semicolon is its separator in French.
export const toCsv = (rows: Row[]) =>
  '﻿' + ['Élève;Appréciation', ...rows.map((r) => `${cell(r.name)};${cell(r.text)}`)].join('\r\n') + '\r\n'
