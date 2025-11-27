interface AnalyzeResumePayload {
    resumeText?: string;
    resumeId?: string;
    jobDescription?: string;
    jobLink?: string;
}

export async function analyzeResume(payload: AnalyzeResumePayload): Promise<string> {
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

        if (!response.ok) {
            const errorData = await response.json().catch(() => ({}));
            throw new Error(errorData.error || `Analysis failed with status ${response.status}`);
        }

        const data = await response.json();
        return data.adaptedResume;
    } catch (error) {
        console.error("Error calling adapt-resume API:", error);
        throw error;
    }
}
