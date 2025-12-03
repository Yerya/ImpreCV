# CVify API Documentation

This document provides detailed API reference for all CVify AI endpoints.

---

## Base URL

```
Production: https://cvify.app/api
Development: http://localhost:3000/api
```

## Authentication

All endpoints require authentication via Supabase Auth cookies.

```
Cookie: sb-access-token=<jwt_token>
Cookie: sb-refresh-token=<refresh_token>
```

---

## Endpoints

### 1. POST /api/chat-resume

Interactive resume editing through natural language chat.

#### Request

**Headers:**
```
Content-Type: application/json
```

**Body:**
```typescript
{
    // Required: User's message (1-500 characters)
    "message": string,
    
    // Required: Current resume state
    "resumeData": {
        "personalInfo": {
            "name": string,
            "title": string,
            "email": string,
            "phone": string,
            "location": string,
            "linkedin": string,
            "website": string
        },
        "sections": [
            {
                "type": "summary" | "experience" | "education" | "skills" | "custom",
                "title": string,
                "content": string | ResumeItem[]
            }
        ]
    },
    
    // Optional: ID of adapted resume for context
    "rewrittenResumeId": string,
    
    // Optional: Chat history for context (max 6 messages)
    "history": [
        {
            "role": "user" | "assistant",
            "content": string
        }
    ]
}
```

#### Response

**Success (200):**
```typescript
{
    // AI response message
    "message": string,
    
    // Optional: Changes to apply to resume
    "modifications": [
        {
            "action": "update" | "add" | "delete",
            "target": "personalInfo" | "section" | "item" | "bullet",
            "sectionIndex": number,     // For section/item/bullet targets
            "itemIndex": number,        // For item/bullet targets
            "bulletIndex": number,      // For bullet targets
            "field": string,            // Field to update
            "value": any                // New value
        }
    ],
    
    // Optional: Reset to original resume
    "action": "reset",
    
    // Usage tracking
    "usage": {
        "count": number,      // Modifications used today
        "maxCount": number,   // Daily limit (50)
        "resetAt": number     // Timestamp when limit resets
    }
}
```

**Errors:**
| Code | Error | Description |
|------|-------|-------------|
| 400 | "Message is required" | Empty message |
| 400 | "Message too long" | Exceeds 500 characters |
| 400 | "Resume data is required" | Missing resumeData |
| 401 | "Unauthorized" | Not authenticated |
| 429 | "Daily limit reached" | Exceeded 50 modifications |
| 429 | "Rate limit exceeded" | LLM rate limit |
| 500 | "Server error" | Internal error |

#### Example

**Request:**
```bash
curl -X POST https://cvify.app/api/chat-resume \
  -H "Content-Type: application/json" \
  -b "sb-access-token=$TOKEN" \
  -d '{
    "message": "Add Python to my skills",
    "resumeData": {
      "personalInfo": { "name": "John Doe", ... },
      "sections": [...]
    }
  }'
```

**Response:**
```json
{
    "message": "Done. I added Python to your Skills section.",
    "modifications": [
        {
            "action": "update",
            "target": "section",
            "sectionIndex": 3,
            "field": "content",
            "value": "JavaScript, TypeScript, React, Python"
        }
    ],
    "usage": {
        "count": 5,
        "maxCount": 50,
        "resetAt": 1705449600000
    }
}
```

---

### 2. POST /api/adapt-resume

Adapt resume to a specific job posting using AI.

#### Request

**Body:**
```typescript
{
    // Either resumeText or resumeId required
    "resumeText": string,           // Raw resume text
    "resumeId": string,             // ID of uploaded resume
    
    // Either jobDescription or jobLink required
    "jobDescription": string,       // Job posting text
    "jobLink": string               // URL to job posting
}
```

#### Response

**Success (200):**
```typescript
{
    // Saved adapted resume
    "item": {
        "id": string,
        "content": string,
        "structured_data": ResumeData,
        "resume_id": string | null,
        "job_posting_id": string,
        "variant": string,
        "theme": string,
        "pdf_url": string | null,
        "created_at": string,
        "updated_at": string,
        "file_name": string,
        "job_title": string,        // Derived from job posting
        "job_company": string       // Derived from job posting
    },
    
    // Parsed resume data
    "resumeData": ResumeData,
    
    // True if updating existing adaptation
    "updated": boolean
}
```

**Errors:**
| Code | Error | Description |
|------|-------|-------------|
| 400 | "Resume text or resumeId required" | Missing resume |
| 400 | "Job description or link required" | Missing job info |
| 400 | "Limit reached" | Max 3 adapted resumes |
| 401 | "Unauthorized" | Not authenticated |
| 403 | "Forbidden" | Not owner of resume |
| 404 | "Resume not found" | Invalid resumeId |
| 429 | "Rate limit" | 5-minute cooldown |
| 500 | "Failed to adapt" | AI error |

#### Example

**Request:**
```bash
curl -X POST https://cvify.app/api/adapt-resume \
  -H "Content-Type: application/json" \
  -b "sb-access-token=$TOKEN" \
  -d '{
    "resumeId": "uuid-of-resume",
    "jobDescription": "We are looking for a Senior Developer..."
  }'
```

---

### 3. POST /api/generate-cover-letter

Generate a personalized cover letter based on adapted resume.

#### Request

**Body:**
```typescript
{
    // Required: ID of adapted resume
    "rewrittenResumeId": string,
    
    // Optional: Override job description
    "jobDescription": string,
    
    // Optional: Job posting URL
    "jobLink": string
}
```

#### Response

**Success (200):**
```typescript
{
    // ID of saved cover letter (null if save failed)
    "coverLetterId": string | null,
    
    // Generated cover letter text
    "content": string,
    
    // Warning if save failed
    "warning": string | null,
    
    // Job metadata
    "metadata": {
        "title": string,
        "company": string
    }
}
```

**Errors:**
| Code | Error | Description |
|------|-------|-------------|
| 400 | "rewrittenResumeId required" | Missing ID |
| 400 | "No job description" | No job data available |
| 401 | "Unauthorized" | Not authenticated |
| 403 | "Forbidden" | Not owner of resume |
| 404 | "Resume not found" | Invalid ID |
| 429 | "Rate limit" | LLM overloaded |
| 500 | "Failed to generate" | AI error |

#### Example

**Request:**
```bash
curl -X POST https://cvify.app/api/generate-cover-letter \
  -H "Content-Type: application/json" \
  -b "sb-access-token=$TOKEN" \
  -d '{
    "rewrittenResumeId": "uuid-of-adapted-resume"
  }'
```

**Response:**
```json
{
    "coverLetterId": "uuid-of-cover-letter",
    "content": "Dear Hiring Manager,\n\nI am writing to express my interest in the Senior Developer position at TechCorp...",
    "metadata": {
        "title": "Senior Developer",
        "company": "TechCorp"
    }
}
```

---

### 4. POST /api/generate-skill-map

Analyze skill gaps between resume and job requirements.

#### Request

**Body:**
```typescript
{
    // Required: ID of adapted resume
    "rewrittenResumeId": string
}
```

#### Response

**Success (200):**
```typescript
{
    "skillMap": {
        "id": string,
        "user_id": string,
        "resume_id": string | null,
        "rewritten_resume_id": string,
        "match_score": number,          // 0-100
        "adaptation_score": number,     // 0-100 (optional)
        "data": {
            "matchScore": number,
            "summary": string,
            "matchedSkills": [
                {
                    "name": string,
                    "priority": "high" | "medium" | "low",
                    "category": "matched",
                    "resumeEvidence": string,
                    "jobRequirement": string,
                    "matchPercentage": number
                }
            ],
            "transferableSkills": [...],
            "missingSkills": [
                {
                    "name": string,
                    "priority": "high" | "medium" | "low",
                    "category": "missing",
                    "jobRequirement": string,
                    "potentialScoreIncrease": number
                }
            ],
            "learningRoadmap": [
                {
                    "skill": string,
                    "importance": string,
                    "firstStep": string,
                    "potentialScoreIncrease": number
                }
            ],
            "interviewTips": string[],
            "adaptationScore": number,
            "adaptationSummary": string,
            "adaptationHighlights": [...]
        },
        "job_title": string,
        "job_company": string,
        "created_at": string
    },
    
    // True if returning cached result
    "cached": boolean
}
```

**Errors:**
| Code | Error | Description |
|------|-------|-------------|
| 400 | "rewrittenResumeId required" | Missing ID |
| 400 | "No job description" | No job data available |
| 401 | "Unauthorized" | Not authenticated |
| 403 | "Forbidden" | Not owner of resume |
| 404 | "Resume not found" | Invalid ID |
| 429 | "Rate limit" | LLM overloaded |
| 500 | "Failed to analyze" | AI error |

#### Example

**Request:**
```bash
curl -X POST https://cvify.app/api/generate-skill-map \
  -H "Content-Type: application/json" \
  -b "sb-access-token=$TOKEN" \
  -d '{
    "rewrittenResumeId": "uuid-of-adapted-resume"
  }'
```

---

## Data Types

### ResumeData

```typescript
interface ResumeData {
    personalInfo: {
        name: string
        title: string
        email: string
        phone: string
        location: string
        linkedin: string
        website: string
    }
    sections: ResumeSection[]
}
```

### ResumeSection

```typescript
interface ResumeSection {
    type: "summary" | "experience" | "education" | "skills" | "custom"
    title: string
    content: string | ResumeItem[]
}
```

### ResumeItem

```typescript
interface ResumeItem {
    title: string
    subtitle?: string
    date?: string
    description?: string
    bullets?: string[]
}
```

### ResumeModification

```typescript
interface ResumeModification {
    action: "update" | "add" | "delete"
    target: "personalInfo" | "section" | "item" | "bullet"
    sectionIndex?: number
    itemIndex?: number
    bulletIndex?: number
    field?: string
    value?: any
}
```

---

## Rate Limits

| Endpoint | Limit | Period | Notes |
|----------|-------|--------|-------|
| /api/chat-resume | 50 modifications | 24 hours | Per user |
| /api/adapt-resume | 1 request | 5 minutes | Per resume-job combo |
| /api/generate-cover-letter | No limit | - | LLM rate limits apply |
| /api/generate-skill-map | No limit | - | Results cached |

---

## Error Response Format

All errors follow this format:

```typescript
{
    "error": string,           // Human-readable error message
    "details"?: string,        // Additional details (optional)
    "code"?: string            // Error code (optional)
}
```

---

## Webhook Events (Future)

Reserved for future implementation:

- `resume.adapted` - Resume adaptation completed
- `cover_letter.generated` - Cover letter generated
- `skill_map.analyzed` - Skill analysis completed

---

