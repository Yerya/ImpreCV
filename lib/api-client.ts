import type { ResumeData } from "@/lib/resume-templates/types";
import { defaultResumeVariant } from "@/lib/resume-templates/variants";
import type { ResumeVariantId } from "@/lib/resume-templates/variants";
import { AI_REFUSAL_ERROR } from "@/lib/constants";
import type { SkillMapRecord } from "@/types/skill-map";

// =============================================================================
// API Endpoints Constants
// =============================================================================

export const API_ENDPOINTS = {
    // Resume operations
    ADAPT_RESUME: "/api/adapt-resume",
    IMPROVE_RESUME: "/api/improve-resume",
    CREATE_RESUME: "/api/create-resume",
    RESUMES: "/api/resumes",
    RESUMES_UPLOAD: "/api/resumes/upload",
    REWRITTEN_RESUMES: "/api/rewritten-resumes",

    // Cover letter
    COVER_LETTER: "/api/cover-letter",
    GENERATE_COVER_LETTER: "/api/generate-cover-letter",

    // Skill map
    SKILL_MAP: "/api/skill-map",
    GENERATE_SKILL_MAP: "/api/generate-skill-map",

    // Export
    EXPORT_RESUME: "/api/export-resume",

    // Chat
    CHAT_RESUME: "/api/chat-resume",
    CHAT_RESUME_USAGE: "/api/chat-resume/usage",

    // Account
    ACCOUNT_DELETE: "/api/account/delete",
} as const;

// =============================================================================
// Error Handling
// =============================================================================

const getErrorMessage = (data: unknown, fallback: string): string => {
    if (!data || typeof data !== "object") return fallback;
    const record = data as Record<string, unknown>;

    if (typeof record.error === "string") return record.error;
    if (typeof record.message === "string") return record.message;
    if (record.error && typeof record.error === "object") {
        const nested = record.error as Record<string, unknown>;
        if (typeof nested.message === "string") return nested.message;
    }
    if (record.blocked === true) return AI_REFUSAL_ERROR;

    return fallback;
};

// =============================================================================
// Centralized Fetch Helper
// =============================================================================

interface ApiFetchOptions extends Omit<RequestInit, 'body'> {
    body?: unknown;
}

/**
 * Centralized fetch wrapper with standardized error handling.
 * Automatically sets Content-Type to JSON and parses response.
 */
export async function apiFetch<T = unknown>(
    url: string,
    options?: ApiFetchOptions
): Promise<T> {
    const { body, headers, ...rest } = options || {};

    const response = await fetch(url, {
        ...rest,
        headers: {
            "Content-Type": "application/json",
            ...headers,
        },
        body: body ? JSON.stringify(body) : undefined,
    });

    const data = await response.json().catch(() => ({}));

    if (!response.ok) {
        const message = getErrorMessage(data, `Request failed with status ${response.status}`);
        throw new Error(message);
    }

    return data as T;
}

// =============================================================================
// Resume Analysis API
// =============================================================================

interface AnalyzeResumePayload {
    resumeText?: string;
    resumeId?: string;
    jobDescription?: string;
    jobLink?: string;
}

export interface AnalyzeResumeResult {
    id: string;
    data: ResumeData;
    variant: ResumeVariantId;
    theme: "light" | "dark";
    pdfUrl?: string | null;
}

interface AnalyzeResumeResponse {
    resumeData?: ResumeData;
    item?: {
        id?: string;
        variant?: ResumeVariantId;
        theme?: "light" | "dark";
        pdf_url?: string | null;
    };
}

export async function analyzeResume(payload: AnalyzeResumePayload): Promise<AnalyzeResumeResult> {
    const data = await apiFetch<AnalyzeResumeResponse>(API_ENDPOINTS.ADAPT_RESUME, {
        method: "POST",
        body: {
            resumeText: payload.resumeText,
            resumeId: payload.resumeId,
            jobDescription: payload.jobDescription || "",
            jobLink: payload.jobLink,
        },
    });

    if (!data.item?.id || !data.resumeData) {
        throw new Error("Failed to prepare adapted resume");
    }

    return {
        id: data.item.id,
        data: data.resumeData,
        variant: data.item.variant || defaultResumeVariant,
        theme: data.item.theme || "light",
        pdfUrl: data.item.pdf_url || null,
    };
}

// =============================================================================
// Cover Letter API
// =============================================================================

export interface GenerateCoverLetterPayload {
    rewrittenResumeId: string;
    jobDescription?: string;
    jobLink?: string;
}

export interface GenerateCoverLetterResult {
    id: string | null;
    content: string;
    analysisId: string | null;
    warning?: string | null;
    metadata?: { title?: string; company?: string };
}

interface GenerateCoverLetterResponse {
    content?: string;
    coverLetterId?: string;
    warning?: string;
    metadata?: { title?: string; company?: string };
}

export async function generateCoverLetter(payload: GenerateCoverLetterPayload): Promise<GenerateCoverLetterResult> {
    const data = await apiFetch<GenerateCoverLetterResponse>(API_ENDPOINTS.GENERATE_COVER_LETTER, {
        method: "POST",
        body: {
            rewrittenResumeId: payload.rewrittenResumeId,
            jobDescription: payload.jobDescription || "",
            jobLink: payload.jobLink,
        },
    });

    if (!data.content || typeof data.content !== "string") {
        throw new Error("Failed to generate cover letter");
    }

    return {
        id: data.coverLetterId ?? null,
        content: data.content,
        analysisId: null,
        warning: data.warning || null,
        metadata: data.metadata,
    };
}

// =============================================================================
// Skill Map API
// =============================================================================

export interface GenerateSkillMapPayload {
    rewrittenResumeId: string;
    jobDescription?: string;
    jobLink?: string;
}

export interface GenerateSkillMapResult {
    skillMap: SkillMapRecord;
    cached: boolean;
    warning?: string | null;
}

interface GenerateSkillMapResponse {
    skillMap?: SkillMapRecord;
    cached?: boolean;
    warning?: string;
}

export async function generateSkillMap(payload: GenerateSkillMapPayload): Promise<GenerateSkillMapResult> {
    const data = await apiFetch<GenerateSkillMapResponse>(API_ENDPOINTS.GENERATE_SKILL_MAP, {
        method: "POST",
        body: {
            rewrittenResumeId: payload.rewrittenResumeId,
            jobDescription: payload.jobDescription || "",
            jobLink: payload.jobLink || "",
        },
    });

    if (!data.skillMap) {
        throw new Error("Failed to generate skill map");
    }

    return {
        skillMap: data.skillMap,
        cached: data.cached || false,
        warning: data.warning || null,
    };
}

export async function getSkillMap(id: string): Promise<SkillMapRecord> {
    const data = await apiFetch<{ skillMap: SkillMapRecord }>(`${API_ENDPOINTS.SKILL_MAP}/${id}`, {
        method: "GET",
    });
    return data.skillMap;
}

export async function deleteSkillMap(id: string): Promise<void> {
    await apiFetch(`${API_ENDPOINTS.SKILL_MAP}/${id}`, {
        method: "DELETE",
    });
}

// =============================================================================
// Resume Improvement API
// =============================================================================

export interface ImproveResumePayload {
    resumeText?: string;
    resumeId?: string;
    targetRole?: string;
    improvements?: string[];
}

export interface ImproveResumeResult {
    id: string;
    data: ResumeData;
    variant: ResumeVariantId;
    theme: "light" | "dark";
    name?: string;
    mode: "improved";
    atsScoreBefore?: number | null;
    atsScoreAfter?: number | null;
}

interface ImproveResumeResponse {
    resumeData?: ResumeData;
    item?: {
        id?: string;
        variant?: ResumeVariantId;
        theme?: "light" | "dark";
        name?: string;
        atsScoreBefore?: number | null;
        atsScoreAfter?: number | null;
    };
}

export async function improveResume(payload: ImproveResumePayload): Promise<ImproveResumeResult> {
    const data = await apiFetch<ImproveResumeResponse>(API_ENDPOINTS.IMPROVE_RESUME, {
        method: "POST",
        body: {
            resumeText: payload.resumeText,
            resumeId: payload.resumeId,
            targetRole: payload.targetRole || "",
            improvements: payload.improvements || [],
        },
    });

    if (!data.item?.id || !data.resumeData) {
        throw new Error("Failed to prepare improved resume");
    }

    return {
        id: data.item.id,
        data: data.resumeData,
        variant: data.item.variant || defaultResumeVariant,
        theme: data.item.theme || "light",
        name: data.item.name,
        mode: "improved",
        atsScoreBefore: data.item.atsScoreBefore ?? null,
        atsScoreAfter: data.item.atsScoreAfter ?? null,
    };
}

// =============================================================================
// Resume Creation from Scratch API
// =============================================================================

export interface CreateResumeExperience {
    title: string;
    company: string;
    location?: string;
    startDate: string;
    endDate?: string;
    current?: boolean;
    responsibilities?: string;
}

export interface CreateResumeEducation {
    degree: string;
    institution: string;
    location?: string;
    graduationDate?: string;
    gpa?: string;
}

export interface CreateResumePayload {
    fullName: string;
    email?: string;
    phone?: string;
    location?: string;
    linkedin?: string;
    website?: string;
    targetRole: string;
    yearsOfExperience?: string;
    experience?: CreateResumeExperience[];
    education?: CreateResumeEducation[];
    skills?: string;
    certifications?: string;
    languages?: string;
    additionalInfo?: string;
}

export interface CreateResumeResult {
    id: string;
    data: ResumeData;
    variant: ResumeVariantId;
    theme: "light" | "dark";
    name?: string;
    mode: "created";
}

interface CreateResumeResponse {
    resumeData?: ResumeData;
    item?: {
        id?: string;
        variant?: ResumeVariantId;
        theme?: "light" | "dark";
        name?: string;
    };
}

export async function createResumeFromScratch(payload: CreateResumePayload): Promise<CreateResumeResult> {
    const data = await apiFetch<CreateResumeResponse>(API_ENDPOINTS.CREATE_RESUME, {
        method: "POST",
        body: payload,
    });

    if (!data.item?.id || !data.resumeData) {
        throw new Error("Failed to create resume");
    }

    return {
        id: data.item.id,
        data: data.resumeData,
        variant: data.item.variant || defaultResumeVariant,
        theme: data.item.theme || "light",
        name: data.item.name,
        mode: "created",
    };
}

