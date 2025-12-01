import type { ResumeData } from "@/lib/resume-templates/types";
import { defaultResumeVariant } from "@/lib/resume-templates/variants";
import type { ResumeVariantId } from "@/lib/resume-templates/variants";

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

export async function analyzeResume(payload: AnalyzeResumePayload): Promise<AnalyzeResumeResult> {
    try {
        const response = await fetch("/api/adapt-resume", {
            method: "POST",
            headers: {
                "Content-Type": "application/json",
            },
            body: JSON.stringify({
                resumeText: payload.resumeText,
                resumeId: payload.resumeId,
                jobDescription: payload.jobDescription || "",
                jobLink: payload.jobLink,
            }),
        });

        const data = await response.json().catch(() => ({}));

        if (!response.ok) {
            const message = typeof (data as any).error === "string" ? (data as any).error : `Analysis failed with status ${response.status}`;
            throw new Error(message);
        }

        const parsedData = (data as any).resumeData as ResumeData | undefined;
        const item = (data as any).item as { id?: string; variant?: ResumeVariantId; theme?: "light" | "dark"; pdf_url?: string | null };

        if (!item?.id || !parsedData) {
            throw new Error("Failed to prepare adapted resume");
        }

        return {
            id: item.id,
            data: parsedData,
            variant: item.variant || defaultResumeVariant,
            theme: item.theme || "light",
            pdfUrl: item.pdf_url || null,
        };
    } catch (error) {
        throw error;
    }
}

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

export async function generateCoverLetter(payload: GenerateCoverLetterPayload): Promise<GenerateCoverLetterResult> {
    console.log("[Cover Letter] Sending request with payload:", {
        rewrittenResumeId: payload.rewrittenResumeId,
        hasJobDescription: !!payload.jobDescription,
        jobLink: payload.jobLink,
    });

    const response = await fetch("/api/generate-cover-letter", {
        method: "POST",
        headers: {
            "Content-Type": "application/json",
        },
        body: JSON.stringify({
            rewrittenResumeId: payload.rewrittenResumeId,
            jobDescription: payload.jobDescription || "",
            jobLink: payload.jobLink,
        }),
    });

    console.log("[Cover Letter] Response status:", response.status);
    const data = await response.json().catch(() => ({}));
    console.log("[Cover Letter] Response data:", data);

    if (!response.ok) {
        const message = typeof (data as any).error === "string" ? (data as any).error : `Cover letter failed with status ${response.status}`;
        console.error("[Cover Letter] Error:", message);
        throw new Error(message);
    }

    const content = (data as any).content;
    if (!content || typeof content !== "string") {
        throw new Error("Failed to generate cover letter");
    }

    return {
        id: ((data as any).coverLetterId ?? null) as string | null,
        content,
        analysisId: null, // No longer using analysisId
        warning: (data as any).warning || null,
        metadata: (data as any).metadata,
    };
}
