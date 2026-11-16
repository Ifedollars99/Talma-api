import { describe, expect, it } from 'vitest'
import { videoPeriodLabel } from './videoPeriod'

describe('videoPeriodLabel', () => {
  it('labels a lesson in a multi-part series', () => {
    expect(videoPeriodLabel({ periodNumber: 2, periodTotal: 4 })).toBe('Period 2 of 4')
  })

  it('stays hidden for standalone lessons and legacy videos', () => {
    expect(videoPeriodLabel({ periodNumber: 1, periodTotal: 1 })).toBeNull()
    expect(videoPeriodLabel({})).toBeNull()
  })
})
