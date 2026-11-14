import type { CriterionBank, CriterionId } from '../model.ts'
import { attitudeBank } from './attitude.ts'
import { resultsBank } from './results.ts'
import { workBank } from './work.ts'

export { combinations } from './combinations.ts'
export { bandOf, conclusions, encouragements, neutralOpenings, openings, type Band } from './openings.ts'

export const bank = { ...resultsBank, ...workBank, ...attitudeBank } as Record<CriterionId, CriterionBank>
