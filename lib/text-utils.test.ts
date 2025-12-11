import { describe, it, expect } from 'vitest'
import { sanitizePlainText, isMeaningfulText } from './text-utils'

describe('sanitizePlainText', () => {
    it('returns empty string for null/undefined input', () => {
        expect(sanitizePlainText('')).toBe('')
        expect(sanitizePlainText(null as unknown as string)).toBe('')
        expect(sanitizePlainText(undefined as unknown as string)).toBe('')
    })

    it('normalizes line endings', () => {
        expect(sanitizePlainText('line1\r\nline2')).toBe('line1\nline2')
    })

    it('converts tabs to spaces', () => {
        expect(sanitizePlainText('col1\tcol2')).toBe('col1 col2')
    })

    it('strips markdown formatting', () => {
        const input = '**bold** and __underline__ and `code`'
        const result = sanitizePlainText(input)
        expect(result).not.toContain('**')
        expect(result).not.toContain('__')
        expect(result).not.toContain('`')
    })

    it('removes markdown headers', () => {
        const input = '# Header\n## Subheader\n### Third'
        const result = sanitizePlainText(input)
        expect(result).not.toContain('#')
    })

    it('collapses multiple newlines', () => {
        const input = 'line1\n\n\n\nline2'
        expect(sanitizePlainText(input)).toBe('line1\n\nline2')
    })
})

describe('isMeaningfulText', () => {
    it('returns false for empty string', () => {
        expect(isMeaningfulText('')).toBe(false)
    })

    it('returns false for very short text', () => {
        expect(isMeaningfulText('Hello')).toBe(false)
    })

    it('returns false for text with too few words', () => {
        expect(isMeaningfulText('One two three')).toBe(false)
    })

    it('returns true for meaningful resume-like text', () => {
        const resumeText = `
      John Doe
      Software Engineer with 5 years of experience in building web applications.
      Proficient in TypeScript, React, Node.js, and PostgreSQL.
      Led development of multiple enterprise applications serving thousands of users.
    `
        expect(isMeaningfulText(resumeText)).toBe(true)
    })

    it('returns false for text with high digit ratio', () => {
        const numericText = '123456789012345678901234567890123456789012345678901234567890123456789012345678901234567890'
        expect(isMeaningfulText(numericText)).toBe(false)
    })
})
