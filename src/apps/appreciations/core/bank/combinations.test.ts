import { describe, expect, it } from 'vitest'
import type { Levels } from '../model.ts'
import { expectCleanSentences } from './checkBank.ts'
import { combinations } from './combinations.ts'

const matching = (levels: Levels) => combinations.filter((c) => c.matches(levels)).map((c) => c.id)

describe('combinations', () => {
  it('are clean sentences', () => {
    for (const combination of combinations) {
      expect(combination.variants.length).toBeGreaterThanOrEqual(2)
      expectCleanSentences(combination.variants, combination.id)
      expectCleanSentences(combination.conclusions, `${combination.id} conclusions`)
    }
  })

  it('match the profiles they describe', () => {
    expect(matching({ abilities: 4, homework: 1 })).toEqual(['capableButNotWorking'])
    expect(matching({ results: 2, involvement: 4 })).toEqual(['effortsToPursue'])
    expect(matching({ results: 1, evolution: 4 })).toEqual(['progressToConfirm'])
    expect(matching({ results: 3, behaviour: 2 })).toEqual(['goodButDisruptive'])
    expect(matching({ results: 4, evolution: 1 })).toEqual(['goodButDeclining'])
    expect(matching({ behaviour: 1, attention: 2 })).toEqual(['chattyAndDistracted'])
  })

  it('ignore unrated criteria', () => {
    expect(matching({ abilities: 4 })).toEqual([])
    expect(matching({ results: 1 })).toEqual([])
    expect(matching({ behaviour: 1 })).toEqual([])
  })
})
