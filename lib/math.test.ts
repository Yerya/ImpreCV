import { describe, it, expect } from 'vitest'
import { clamp, easeOutCubic } from './math'

describe('clamp', () => {
    it('returns value when within range', () => {
        expect(clamp(0.5, 0, 1)).toBe(0.5)
        expect(clamp(50, 0, 100)).toBe(50)
    })

    it('returns min when value is below range', () => {
        expect(clamp(-0.5, 0, 1)).toBe(0)
        expect(clamp(-100, 0, 100)).toBe(0)
    })

    it('returns max when value is above range', () => {
        expect(clamp(1.5, 0, 1)).toBe(1)
        expect(clamp(200, 0, 100)).toBe(100)
    })

    it('uses default min=0, max=1', () => {
        expect(clamp(0.5)).toBe(0.5)
        expect(clamp(-1)).toBe(0)
        expect(clamp(2)).toBe(1)
    })

    it('handles edge cases at boundaries', () => {
        expect(clamp(0, 0, 1)).toBe(0)
        expect(clamp(1, 0, 1)).toBe(1)
    })
})

describe('easeOutCubic', () => {
    it('returns 0 for t=0', () => {
        expect(easeOutCubic(0)).toBe(0)
    })

    it('returns 1 for t=1', () => {
        expect(easeOutCubic(1)).toBe(1)
    })

    it('returns value greater than linear for mid-range', () => {
        // easeOutCubic should be "faster" at the start (higher value than linear)
        const t = 0.5
        const linear = t
        const eased = easeOutCubic(t)
        expect(eased).toBeGreaterThan(linear)
    })

    it('returns expected cubic value', () => {
        // easeOutCubic(t) = 1 - (1-t)^3
        // For t=0.5: 1 - (0.5)^3 = 1 - 0.125 = 0.875
        expect(easeOutCubic(0.5)).toBe(0.875)
    })
})
