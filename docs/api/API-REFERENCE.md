# CVify API Documentation

Complete API reference for the CVify resume optimization platform.

## Table of Contents

1. [Getting Started](#getting-started)
2. [Authentication](#authentication)
3. [Base URL](#base-url)
4. [Endpoints Reference](#endpoints-reference)
   - [Health Check](#health-check)
   - [Account Management](#account-management)
   - [Resume Upload](#resume-upload)
   - [Resume Adaptation](#resume-adaptation)
   - [Resume Chat](#resume-chat)
   - [Resume Export](#resume-export)
   - [Cover Letter](#cover-letter)
   - [Skill Map](#skill-map)
5. [Data Types](#data-types)
6. [Rate Limits](#rate-limits)
7. [Error Handling](#error-handling)
8. [Versioning](#versioning)
9. [Changelog](#changelog)

---

## Getting Started

### Quick Start Guide

This guide walks you through authenticating and making your first API request.

#### Step 1: Obtain Authentication

CVify uses Supabase Auth for authentication. To access the API:

1. Register or sign in at `https://cvify.app/signup`
2. After authentication, your browser receives session cookies automatically
3. For programmatic access, extract the JWT token from the `sb-access-token` cookie

#### Step 2: Make Your First Request

Check API health:

```bash
curl https://cvify.app/api/health
```

Response:
```json
{
    "status": "healthy",
    "timestamp": "2025-01-15T10:30:00.000Z",
    "uptime": 86400
}
```

#### Step 3: Upload a Resume

```bash
curl -X POST https://cvify.app/api/resumes/upload \
  -H "Cookie: sb-access-token=$TOKEN" \
  -F "file=@resume.pdf"
```

#### Step 4: Adapt Resume to Job

```bash
curl -X POST https://cvify.app/api/adapt-resume \
  -H "Content-Type: application/json" \
  -H "Cookie: sb-access-token=$TOKEN" \
  -d '{
    "resumeId": "uuid-from-step-3",
    "jobDescription": "We are looking for a Senior Developer..."
  }'
```

### Integration Tutorial

For a complete integration workflow:

1. **Upload Resume** - `POST /api/resumes/upload`
2. **Adapt to Job** - `POST /api/adapt-resume`
3. **Edit via Chat** - `POST /api/chat-resume`
4. **Generate Cover Letter** - `POST /api/generate-cover-letter`
5. **Analyze Skills** - `POST /api/generate-skill-map`
6. **Export PDF** - `POST /api/export-resume`

---

## Authentication

All endpoints except `/api/health` require authentication via Supabase Auth cookies.

### Cookie-Based Authentication

```
Cookie: sb-access-token=<jwt_token>
Cookie: sb-refresh-token=<refresh_token>
```

### How It Works

1. User authenticates via Supabase Auth (email/password or OAuth)
2. Supabase sets HTTP-only cookies in the browser
3. Cookies are automatically sent with each request
4. Server validates JWT and extracts `user_id`

### Token Lifecycle

| Token | Duration | Purpose |
|-------|----------|---------|
| Access Token | 1 hour | API authentication |
| Refresh Token | 7 days | Obtain new access tokens |

### Unauthorized Response

When authentication fails:

```json
{
    "error": "Unauthorized"
}
```

HTTP Status: `401`

---

## Base URL

| Environment | URL |
|-------------|-----|
| Production | `https://cvify.app/api` |
| Development | `http://localhost:3000/api` |

---

## Endpoints Reference

### Health Check

#### GET /api/health

Check API availability and status.

**Authentication:** Not required

**Response (200):**
```json
{
    "status": "healthy",
    "timestamp": "2025-01-15T10:30:00.000Z",
    "uptime": 86400
}
```

---

### Account Management

#### POST /api/account/delete

Permanently delete user account and all associated data.

**Authentication:** Required

**Request:** Empty body

**Response (200):**
```json
{
    "success": true
}
```

**Errors:**

| Code | Error | Description |
|------|-------|-------------|
| 401 | "Unauthorized" | Not authenticated |
| 500 | "Failed to delete account" | Server error |

**Warning:** This action is irreversible. All resumes, cover letters, and skill maps will be deleted.

---

### Resume Upload

#### POST /api/resumes/upload

Upload a resume file (PDF, DOCX, or TXT).

**Authentication:** Required

**Request:** `multipart/form-data`

| Field | Type | Required | Description |
|-------|------|----------|-------------|
| file | File | Yes | Resume file (max 5MB) |
| fileName | string | No | Override filename |

**Supported Formats:**
- PDF (`.pdf`)
- Microsoft Word (`.docx`)
- Plain Text (`.txt`)

**Response (200):**
```json
{
    "resume": {
        "id": "uuid",
        "file_name": "john_doe_resume.pdf",
        "file_url": "https://storage.supabase.co/...",
        "file_size": 125000,
        "extracted_text": "John Doe\nSoftware Engineer...",
        "created_at": "2025-01-15T10:30:00.000Z"
    },
    "preview": "John Doe\nSoftware Engineer...",
    "textLength": 2500
}
```

**Errors:**

| Code | Error | Description |
|------|-------|-------------|
| 400 | "No file provided" | Missing file in request |
| 400 | "Unsupported file type" | Invalid format |
| 400 | "File too large" | Exceeds 5MB limit |
| 400 | "Resume limit reached" | Max 3 resumes per user |
| 400 | "Duplicate resume" | Same content already exists |
| 401 | "Unauthorized" | Not authenticated |
| 500 | "Upload failed" | Storage or DB error |

---

#### DELETE /api/resumes/[id]

Delete an uploaded resume.

**Authentication:** Required (owner only)

**Response (200):**
```json
{
    "success": true
}
```

**Errors:**

| Code | Error | Description |
|------|-------|-------------|
| 401 | "Unauthorized" | Not authenticated |
| 403 | "Forbidden" | Not the owner |
| 404 | "Not found" | Resume does not exist |
| 500 | "Delete failed" | Server error |

---

### Resume Adaptation

#### POST /api/adapt-resume

Adapt a resume to match a specific job posting using AI.

**Authentication:** Required

**Request:**
```json
{
    "resumeText": "string",
    "resumeId": "uuid",
    "jobDescription": "string",
    "jobLink": "string"
}
```

| Field | Type | Required | Description |
|-------|------|----------|-------------|
| resumeText | string | Either resumeText or resumeId | Raw resume text |
| resumeId | UUID | Either resumeText or resumeId | ID of uploaded resume |
| jobDescription | string | Either jobDescription or jobLink | Job posting text |
| jobLink | string | Either jobDescription or jobLink | URL to job posting |

**Response (200):**
```json
{
    "item": {
        "id": "uuid",
        "content": "Adapted resume text...",
        "structured_data": { "...ResumeData..." },
        "resume_id": "uuid",
        "job_posting_id": "uuid",
        "variant": "tailored",
        "theme": "modern",
        "pdf_url": null,
        "job_title": "Senior Developer",
        "job_company": "TechCorp",
        "created_at": "2025-01-15T10:30:00.000Z",
        "updated_at": "2025-01-15T10:30:00.000Z"
    },
    "resumeData": { "...ResumeData..." },
    "updated": false
}
```

**Errors:**

| Code | Error | Description |
|------|-------|-------------|
| 400 | "Resume text or resumeId required" | Missing resume input |
| 400 | "Job description or link required" | Missing job input |
| 400 | "Limit reached" | Max 3 adapted resumes |
| 401 | "Unauthorized" | Not authenticated |
| 403 | "Forbidden" | Not owner of source resume |
| 404 | "Resume not found" | Invalid resumeId |
| 429 | "Rate limit" | 5-minute cooldown active |
| 500 | "Failed to adapt" | AI processing error |

---

#### GET /api/rewritten-resumes

List all adapted resumes for the authenticated user.

**Authentication:** Required

**Response (200):**
```json
{
    "items": [
        {
            "id": "uuid",
            "content": "Adapted resume text...",
            "structured_data": { "...ResumeData..." },
            "job_title": "Senior Developer",
            "job_company": "TechCorp",
            "variant": "tailored",
            "theme": "modern",
            "pdf_url": "https://...",
            "created_at": "2025-01-15T10:30:00.000Z",
            "updated_at": "2025-01-15T10:30:00.000Z"
        }
    ]
}
```

---

#### PATCH /api/resume-rewrite/[id]

Update the content of an adapted resume.

**Authentication:** Required (owner only)

**Request:**
```json
{
    "content": "Updated resume content..."
}
```

**Response (200):**
```json
{
    "success": true,
    "data": {
        "id": "uuid",
        "content": "Updated resume content...",
        "updated_at": "2025-01-15T10:35:00.000Z"
    }
}
```

**Errors:**

| Code | Error | Description |
|------|-------|-------------|
| 400 | "Content required" | Missing content |
| 401 | "Unauthorized" | Not authenticated |
| 403 | "Forbidden" | Not the owner |
| 404 | "Not found" | Resume does not exist |

---

### Resume Chat

#### POST /api/chat-resume

Interactive resume editing through natural language conversation.

**Authentication:** Required

**Request:**
```json
{
    "message": "Add Python to my skills",
    "resumeData": {
        "personalInfo": {
            "name": "John Doe",
            "title": "Software Engineer",
            "email": "john@example.com",
            "phone": "+1 555-0100",
            "location": "San Francisco, CA",
            "linkedin": "linkedin.com/in/johndoe",
            "website": "johndoe.dev"
        },
        "sections": [
            {
                "type": "skills",
                "title": "Technical Skills",
                "content": "JavaScript, TypeScript, React"
            }
        ]
    },
    "rewrittenResumeId": "uuid",
    "history": [
        { "role": "user", "content": "Previous message" },
        { "role": "assistant", "content": "Previous response" }
    ]
}
```

| Field | Type | Required | Description |
|-------|------|----------|-------------|
| message | string | Yes | User message (1-500 chars) |
| resumeData | ResumeData | Yes | Current resume state |
| rewrittenResumeId | UUID | No | Link to adapted resume |
| history | Message[] | No | Conversation history (max 6) |

**Response (200):**
```json
{
    "message": "Done. I added Python to your Skills section.",
    "modifications": [
        {
            "action": "update",
            "target": "section",
            "sectionIndex": 0,
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

**Modification Actions:**

| Action | Description |
|--------|-------------|
| update | Modify existing field |
| add | Add new item/bullet |
| delete | Remove item/bullet |

**Modification Targets:**

| Target | Description |
|--------|-------------|
| personalInfo | Contact information fields |
| section | Resume section content |
| item | Experience/education entry |
| bullet | Individual bullet point |

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

---

### Resume Export

#### POST /api/export-resume

Generate PDF export of a resume.

**Authentication:** Optional (saves to storage if authenticated)

**Request:**
```json
{
    "data": { "...ResumeData..." },
    "templateId": "modern",
    "themeConfig": {
        "mode": "light"
    },
    "resumeId": "uuid",
    "fileName": "john_doe_resume"
}
```

| Field | Type | Required | Description |
|-------|------|----------|-------------|
| data | ResumeData | Yes | Resume content |
| templateId | string | Yes | Template: modern, classic, minimal |
| themeConfig | object | No | Visual settings |
| resumeId | UUID | No | Link to save PDF URL |
| fileName | string | No | Output filename |

**Response:** Binary PDF file

**Headers:**
```
Content-Type: application/pdf
Content-Disposition: attachment; filename="resume.pdf"
x-export-url: https://storage.supabase.co/... (if saved)
```

**Errors:**

| Code | Error | Description |
|------|-------|-------------|
| 400 | "Resume data required" | Missing data field |
| 400 | "Invalid template" | Unknown templateId |
| 500 | "PDF generation failed" | Puppeteer error |

---

### Cover Letter

#### POST /api/generate-cover-letter

Generate a personalized cover letter based on adapted resume.

**Authentication:** Required

**Request:**
```json
{
    "rewrittenResumeId": "uuid",
    "jobDescription": "string",
    "jobLink": "string"
}
```

| Field | Type | Required | Description |
|-------|------|----------|-------------|
| rewrittenResumeId | UUID | Yes | Adapted resume ID |
| jobDescription | string | No | Override job text |
| jobLink | string | No | Job posting URL |

**Response (200):**
```json
{
    "coverLetterId": "uuid",
    "content": "Dear Hiring Manager,\n\nI am writing to express my interest in the Senior Developer position at TechCorp...",
    "warning": null,
    "metadata": {
        "title": "Senior Developer",
        "company": "TechCorp"
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

---

#### GET /api/cover-letter

List cover letters for the authenticated user.

**Authentication:** Required

**Query Parameters:**

| Parameter | Type | Description |
|-----------|------|-------------|
| rewrittenResumeId | UUID | Filter by adapted resume |

**Response (200):**
```json
{
    "items": [
        {
            "id": "uuid",
            "content": "Dear Hiring Manager...",
            "jobTitle": "Senior Developer",
            "jobCompany": "TechCorp",
            "rewrittenResumeId": "uuid",
            "createdAt": "2025-01-15T10:30:00.000Z",
            "updatedAt": "2025-01-15T10:30:00.000Z"
        }
    ]
}
```

---

### Skill Map

#### POST /api/generate-skill-map

Analyze skill gaps between resume and job requirements.

**Authentication:** Required

**Request:**
```json
{
    "rewrittenResumeId": "uuid"
}
```

**Response (200):**
```json
{
    "skillMap": {
        "id": "uuid",
        "user_id": "uuid",
        "rewritten_resume_id": "uuid",
        "match_score": 75,
        "adaptation_score": 85,
        "data": {
            "matchScore": 75,
            "summary": "Strong match with room for improvement...",
            "matchedSkills": [
                {
                    "name": "React",
                    "priority": "high",
                    "category": "matched",
                    "resumeEvidence": "Built React applications...",
                    "jobRequirement": "5+ years React experience",
                    "matchPercentage": 90
                }
            ],
            "transferableSkills": [...],
            "missingSkills": [
                {
                    "name": "Kubernetes",
                    "priority": "medium",
                    "category": "missing",
                    "jobRequirement": "Container orchestration experience",
                    "potentialScoreIncrease": 5
                }
            ],
            "learningRoadmap": [
                {
                    "skill": "Kubernetes",
                    "importance": "Growing demand in industry",
                    "firstStep": "Complete CKA certification course",
                    "potentialScoreIncrease": 5
                }
            ],
            "interviewTips": [
                "Prepare examples of React component optimization",
                "Be ready to discuss CI/CD pipeline experience"
            ],
            "adaptationScore": 85,
            "adaptationSummary": "Resume well-tailored to position...",
            "adaptationHighlights": [...]
        },
        "job_title": "Senior Developer",
        "job_company": "TechCorp",
        "created_at": "2025-01-15T10:30:00.000Z"
    },
    "cached": false
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

---

#### GET /api/skill-map

List skill maps for the authenticated user.

**Authentication:** Required

**Query Parameters:**

| Parameter | Type | Description |
|-----------|------|-------------|
| rewrittenResumeId | UUID | Filter by adapted resume |

**Response (200):**
```json
{
    "items": [
        {
            "id": "uuid",
            "match_score": 75,
            "adaptation_score": 85,
            "data": { "...SkillMapData..." },
            "job_title": "Senior Developer",
            "job_company": "TechCorp",
            "created_at": "2025-01-15T10:30:00.000Z"
        }
    ]
}
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

### SkillMapData

```typescript
interface SkillMapData {
    matchScore: number
    summary: string
    matchedSkills: SkillEntry[]
    transferableSkills: SkillEntry[]
    missingSkills: SkillEntry[]
    learningRoadmap: LearningStep[]
    interviewTips: string[]
    adaptationScore?: number
    adaptationSummary?: string
    adaptationHighlights?: string[]
}

interface SkillEntry {
    name: string
    priority: "high" | "medium" | "low"
    category: "matched" | "transferable" | "missing"
    resumeEvidence?: string
    jobRequirement?: string
    matchPercentage?: number
    potentialScoreIncrease?: number
}

interface LearningStep {
    skill: string
    importance: string
    firstStep: string
    potentialScoreIncrease: number
}
```

---

## Rate Limits

| Endpoint | Limit | Period | Notes |
|----------|-------|--------|-------|
| /api/resumes/upload | 3 resumes | Total | Per user account |
| /api/adapt-resume | 3 resumes | Total | Per user account |
| /api/adapt-resume | 1 request | 5 minutes | Per resume-job combo |
| /api/chat-resume | 50 modifications | 24 hours | Per user, resets daily |
| /api/generate-cover-letter | No limit | - | LLM rate limits apply |
| /api/generate-skill-map | No limit | - | Results cached |

### Rate Limit Response

When rate limited:

```json
{
    "error": "Rate limit exceeded",
    "resetAt": 1705449600000
}
```

HTTP Status: `429`

---

## Error Handling

### Error Response Format

All errors follow a consistent structure:

```json
{
    "error": "Human-readable error message",
    "details": "Additional context (optional)",
    "code": "ERROR_CODE (optional)"
}
```

### Common HTTP Status Codes

| Code | Meaning | When Used |
|------|---------|-----------|
| 200 | Success | Request completed |
| 400 | Bad Request | Invalid input, validation failed |
| 401 | Unauthorized | Missing or invalid authentication |
| 403 | Forbidden | Authenticated but not authorized |
| 404 | Not Found | Resource does not exist |
| 429 | Too Many Requests | Rate limit exceeded |
| 500 | Internal Server Error | Server-side error |

### Error Recovery

| Error Type | Recovery Action |
|------------|-----------------|
| 401 Unauthorized | Re-authenticate user |
| 429 Rate Limit | Wait until `resetAt` timestamp |
| 500 Server Error | Retry with exponential backoff |

---

## Versioning

### Current Version

API Version: **v1** (implicit in URL)

### Versioning Strategy

The API follows semantic versioning principles:

- **Breaking changes** will be introduced in new major versions
- **Backward-compatible additions** may be added without version bump
- **Deprecation notices** will be provided 30 days before removal

### Stability

| Endpoint Category | Stability |
|-------------------|-----------|
| Core CRUD operations | Stable |
| AI generation endpoints | May vary based on model updates |
| Experimental features | Subject to change |

---

## Changelog

### v1.0.0 (2025-01-15)

**Initial Release**

- Resume upload and management
- AI-powered resume adaptation
- Interactive chat editing
- Cover letter generation
- Skill gap analysis
- PDF export

### Planned Features

- Webhook notifications for async operations
- Batch processing API
- API key authentication for programmatic access

---

## Architecture Overview

```
+------------------+     +------------------+     +------------------+
|                  |     |                  |     |                  |
|   Client App     |---->|   Next.js API    |---->|   Supabase       |
|   (React)        |     |   Routes         |     |   (PostgreSQL)   |
|                  |     |                  |     |                  |
+------------------+     +--------+---------+     +------------------+
                                 |
                                 v
                         +-------+--------+
                         |                |
                         |   Google       |
                         |   Gemini AI    |
                         |                |
                         +----------------+
```

### Request Flow

1. Client sends authenticated request
2. API route validates authentication via Supabase
3. Business logic processes request
4. For AI operations: request sent to Gemini API
5. Result stored in PostgreSQL
6. Response returned to client

---

## Support

For API issues or questions:

- GitHub Issues: [github.com/cvify/cvify-app/issues](https://github.com/cvify/cvify-app/issues)
- Documentation: [docs.cvify.app](https://docs.cvify.app)
