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
