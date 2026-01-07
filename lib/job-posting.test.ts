import { describe, it, expect } from 'vitest'
import { normalizeJobLink, deriveJobMetadata, isRestrictedJobSite } from './job-posting'

describe('normalizeJobLink', () => {
    it('returns empty string for undefined input', () => {
        expect(normalizeJobLink(undefined)).toBe('')
        expect(normalizeJobLink('')).toBe('')
    })

    it('normalizes valid http URLs', () => {
        expect(normalizeJobLink('https://example.com/job/123')).toBe('https://example.com/job/123')
        expect(normalizeJobLink('http://example.com/careers')).toBe('http://example.com/careers')
    })

    it('trims whitespace from URLs', () => {
        expect(normalizeJobLink('  https://example.com  ')).toBe('https://example.com/')
    })

    it('rejects non-http protocols', () => {
        expect(normalizeJobLink('ftp://example.com')).toBe('')
        expect(normalizeJobLink('javascript:alert(1)')).toBe('')
    })

    it('returns empty for invalid URLs', () => {
        expect(normalizeJobLink('not-a-url')).toBe('')
        expect(normalizeJobLink('www.example.com')).toBe('') // missing protocol
    })
})

describe('deriveJobMetadata', () => {
    it('extracts title from "Job Title:" pattern', () => {
        const text = 'Job Title: Senior Software Engineer\nCompany: TechCorp'
        const result = deriveJobMetadata(text)
        expect(result.title).toBe('Senior Software Engineer')
        expect(result.company).toBe('TechCorp')
    })

    it('extracts title from "Position:" pattern', () => {
        const text = 'Position: Frontend Developer'
        const result = deriveJobMetadata(text)
        expect(result.title).toBe('Frontend Developer')
    })

    it('extracts combined title and company from "X at Y" format', () => {
        const text = 'Software Engineer at Google'
        const result = deriveJobMetadata(text)
        expect(result.title).toBe('Software Engineer')
        expect(result.company).toBe('Google')
    })

    it('falls back to job opportunity for unrecognized text', () => {
        const text = '12345'
        const result = deriveJobMetadata(text)
        expect(result.title).toBe('Job Opportunity')
    })

    it('derives company from URL when not in text', () => {
        const text = 'Software Engineer'
        const result = deriveJobMetadata(text, 'https://careers.microsoft.com/job/123')
        expect(result.company).toBe('Microsoft')
    })

    it('handles complex job posting text', () => {
        const text = `
      Company: Acme Inc
      Role: Product Manager
      
      About the Role
      We are looking for a Product Manager to join our team.
      
      Requirements
      - 3+ years of experience
      - Strong communication skills
    `
        const result = deriveJobMetadata(text)
        expect(result.title).toBe('Product Manager')
        expect(result.company).toBe('Acme Inc')
    })
})

describe('isRestrictedJobSite', () => {
    it('returns not restricted for empty input', () => {
        expect(isRestrictedJobSite('')).toEqual({ isRestricted: false })
    })

    it('detects LinkedIn job URLs as restricted', () => {
        const result = isRestrictedJobSite('https://www.linkedin.com/jobs/view/123456789')
        expect(result.isRestricted).toBe(true)
        expect(result.message).toContain('LinkedIn')
        expect(result.message).toContain('copy and paste')
    })

    it('detects various LinkedIn URL formats', () => {
        expect(isRestrictedJobSite('https://linkedin.com/jobs/view/123').isRestricted).toBe(true)
        expect(isRestrictedJobSite('http://www.linkedin.com/jobs/collections/123').isRestricted).toBe(true)
        expect(isRestrictedJobSite('https://fr.linkedin.com/jobs/view/123').isRestricted).toBe(true)
    })

    it('detects LinkedIn URLs without protocol', () => {
        expect(isRestrictedJobSite('linkedin.com/jobs/view/123').isRestricted).toBe(true)
        expect(isRestrictedJobSite('www.linkedin.com/jobs/view/123').isRestricted).toBe(true)
    })

    it('returns not restricted for regular job sites', () => {
        expect(isRestrictedJobSite('https://example.com/jobs/123').isRestricted).toBe(false)
        expect(isRestrictedJobSite('https://greenhouse.io/job/123').isRestricted).toBe(false)
        expect(isRestrictedJobSite('https://lever.co/company/123').isRestricted).toBe(false)
    })

    it('handles invalid URLs gracefully', () => {
        expect(isRestrictedJobSite('not-a-url').isRestricted).toBe(false)
    })
})
