import { NextRequest, NextResponse } from "next/server"
import { getSupabaseServerClient, isSupabaseConfigured } from "@/lib/supabase/server"
import { createLLMClient, LLMError, LLM_MODELS } from "@/lib/api/llm"
import { createLogger } from "@/lib/api/logger"
import type { ResumeData } from "@/lib/resume-templates/types"
import type { ResumeModification, ChatUsage } from "@/lib/chat"
import { MAX_MODIFICATIONS_PER_DAY, USAGE_RESET_HOURS, MAX_MESSAGE_CHARS } from "@/lib/chat"
import { MAX_CHAT_HISTORY_MESSAGES } from "@/lib/constants"
import { checkRateLimit, getClientIp, rateLimitHeaders } from "@/lib/rate-limit"

interface ChatHistoryMessage {
    role: "user" | "assistant"
    content: string
}

export async function POST(req: NextRequest) {
    const logger = createLogger("chat-resume")

    try {
        if (!isSupabaseConfigured()) {
            logger.error("supabase_not_configured")
            return NextResponse.json({ error: "Supabase is not configured" }, { status: 500 })
        }

        const supabase = await getSupabaseServerClient()

        // Rate limit by IP first
        const clientIp = getClientIp(req);
        const ipLimit = await checkRateLimit(supabase, `ip:${clientIp}`);
        if (!ipLimit.allowed) {
            logger.warn("ip_rate_limit_exceeded", { ip: clientIp });
            return NextResponse.json(
                { error: "Too many requests. Please try again later." },
                { status: 429, headers: rateLimitHeaders(ipLimit.remaining, ipLimit.resetAt) }
            );
        }

        const { data: { user } } = await supabase.auth.getUser()

        if (!user) {
            logger.warn("unauthorized_request")
            return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
        }

        // Rate limit by user
        const userLimit = await checkRateLimit(supabase, `user:${user.id}`);
        if (!userLimit.allowed) {
            logger.warn("user_rate_limit_exceeded", { userId: user.id });
            return NextResponse.json(
                { error: "Rate limit exceeded." },
                { status: 429, headers: rateLimitHeaders(userLimit.remaining, userLimit.resetAt) }
            );
        }

        // Update logger with user context
        const userLogger = createLogger("chat-resume", user.id)
        userLogger.requestStart("/api/chat-resume")

        const body = await req.json()
        const {
            message,
            resumeData,
            history = []
        } = body as {
            message: string
            resumeData: ResumeData
            history?: ChatHistoryMessage[]
        }

        if (!message || typeof message !== "string" || message.trim().length === 0) {
            return NextResponse.json({ error: "Message is required" }, { status: 400 })
        }

        if (message.length > MAX_MESSAGE_CHARS) {
            return NextResponse.json({
                error: `Message too long. Maximum ${MAX_MESSAGE_CHARS} characters allowed.`
            }, { status: 400 })
        }

        if (!resumeData || !resumeData.personalInfo) {
            return NextResponse.json({ error: "Resume data is required" }, { status: 400 })
        }

        // Check usage limits (global per user, not per resume)
        const { data: usageData } = await supabase
            .from("chat_usage")
            .select("count, reset_at")
            .eq("user_id", user.id)
            .eq("resume_id", "global")
            .maybeSingle()

        const now = new Date()
        let currentCount = 0
        let resetAt = new Date(now.getTime() + USAGE_RESET_HOURS * 60 * 60 * 1000)

        if (usageData) {
            const usageResetAt = new Date(usageData.reset_at)
            if (usageResetAt > now) {
                currentCount = usageData.count
                resetAt = usageResetAt
            }
        }

        if (currentCount >= MAX_MODIFICATIONS_PER_DAY) {
            const hoursRemaining = Math.ceil((resetAt.getTime() - now.getTime()) / (1000 * 60 * 60))
            return NextResponse.json({
                error: `Daily limit reached (${MAX_MODIFICATIONS_PER_DAY} modifications). Resets in ${hoursRemaining} hours.`,
                usage: {
                    count: currentCount,
                    maxCount: MAX_MODIFICATIONS_PER_DAY,
                    resetAt: resetAt.getTime()
                }
            }, { status: 429 })
        }

        // Initialize LLM client with fallback support
        let llmClient
        try {
            llmClient = createLLMClient("[Chat]")
        } catch (error) {
            if (error instanceof LLMError && error.type === "API_KEY_MISSING") {
                return NextResponse.json({ error: "AI service not configured" }, { status: 500 })
            }
            throw error
        }

        // Build compact resume context (only essential fields to save tokens)
        const compactResume = {
            personalInfo: resumeData.personalInfo,
            sections: resumeData.sections.map((s, i) => ({
                idx: i,
                type: s.type,
                title: s.title,
                contentPreview: typeof s.content === "string"
                    ? s.content.slice(0, 200) + (s.content.length > 200 ? "..." : "")
                    : Array.isArray(s.content)
                        ? `[${s.content.length} items]`
                        : s.content
            }))
        }

        // Build system instruction
        const systemInstruction = buildSystemPrompt()

        // Build conversation contents with native multi-turn format
        const contents: Array<{ role: "user" | "model"; parts: Array<{ text: string }> }> = []

        // System prompt as first user message (Gemini pattern)
        contents.push({ role: "user", parts: [{ text: systemInstruction }] })
        contents.push({ role: "model", parts: [{ text: "Understood. I will follow these instructions." }] })

        // Add context message (resume data)
        const contextMessage = `[RESUME]\n${JSON.stringify(compactResume, null, 1)}\n\n[SECTIONS]\n${JSON.stringify(resumeData.sections, null, 1)}`

        contents.push({ role: "user", parts: [{ text: contextMessage }] })
        contents.push({ role: "model", parts: [{ text: '{"message": "Ready to help you edit. What would you like to change?"}' }] })

        // Add conversation history as native multi-turn messages (limit to save tokens)
        const recentHistory = history.slice(-MAX_CHAT_HISTORY_MESSAGES)
        for (const msg of recentHistory) {
            contents.push({
                role: msg.role === "user" ? "user" : "model",
                parts: [{ text: msg.content }]
            })
        }

        // Add current user message
        contents.push({ role: "user", parts: [{ text: message }] })

        // Call LLM with automatic fallback (gemini-2.5-flash → gemini-2.0-flash)
        let rawText = ""
        let usedFallback = false
        let modelUsed: string = LLM_MODELS.PRIMARY
        try {
            const response = await llmClient.generate(contents, {
                model: LLM_MODELS.PRIMARY,
                configType: "chat",
                enableFallback: true,
                logPrefix: "[Chat]"
            })
            rawText = response.text
            usedFallback = response.usedFallback
            modelUsed = response.model

            userLogger.llmComplete({
                model: modelUsed,
                usedFallback,
                success: true
            })
        } catch (error) {
            userLogger.llmComplete({
                model: modelUsed,
                usedFallback: false,
                success: false,
                error: error instanceof Error ? error.message : "Unknown error"
            })

            if (error instanceof LLMError) {
                if (error.type === "RATE_LIMIT") {
                    userLogger.requestComplete(429, { reason: "rate_limit" })
                    return NextResponse.json({
                        error: "AI service is temporarily overloaded. Please try again in a few moments."
                    }, { status: 429 })
                }
            }
            userLogger.requestComplete(500, { reason: "llm_failed" })
            return NextResponse.json({ error: "Failed to process AI response" }, { status: 500 })
        }

        let parsed: { message: string; modifications?: ResumeModification[]; action?: string }
        try {
            // Try to extract JSON from response (may have extra text)
            let jsonText = rawText?.trim() || ""
            const jsonStart = jsonText.indexOf("{")
            const jsonEnd = jsonText.lastIndexOf("}")
            if (jsonStart !== -1 && jsonEnd > jsonStart) {
                jsonText = jsonText.slice(jsonStart, jsonEnd + 1)
            }
            parsed = JSON.parse(jsonText)
        } catch {
            userLogger.warn("json_parse_failed", { responseLength: rawText?.length, preview: rawText?.slice(0, 100) })
            // AI returned invalid JSON - wrap as message
            const cleanText = rawText?.replace(/```json?|```/g, "").trim() || ""
            if (cleanText.length > 0 && cleanText.length < 500) {
                userLogger.requestComplete(200, { parseMode: "fallback_text" })
                return NextResponse.json({
                    message: cleanText,
                    modifications: []
                })
            }
            userLogger.requestComplete(200, { parseMode: "error_message" })
            return NextResponse.json({
                message: "Не удалось обработать запрос. Попробуйте переформулировать или очистить историю чата.",
                modifications: []
            })
        }

        const modifications = parsed.modifications || []
        const hasChanges = modifications.length > 0 || parsed.action === "reset"
        const newCount = currentCount + (hasChanges ? 1 : 0)

        // Update usage if modifications were made
        if (hasChanges) {
            const { error: upsertError } = await supabase
                .from("chat_usage")
                .upsert({
                    user_id: user.id,
                    resume_id: "global",
                    count: newCount,
                    reset_at: resetAt.toISOString(),
                    updated_at: now.toISOString()
                }, {
                    onConflict: "user_id,resume_id"
                })

            if (upsertError) {
                userLogger.error("usage_update_failed", upsertError.message)
            }
        }

        const usage: ChatUsage = {
            count: newCount,
            maxCount: MAX_MODIFICATIONS_PER_DAY,
            resetAt: resetAt.getTime()
        }

        userLogger.requestComplete(200, {
            modificationsCount: modifications.length,
            hasAction: !!parsed.action,
            usageCount: newCount
        })

        return NextResponse.json({
            message: parsed.message,
            modifications,
            action: parsed.action,
            usage
        })

    } catch (error) {
        logger.error("unhandled_error", error instanceof Error ? error : String(error))
        return NextResponse.json(
            { error: "Failed to process chat message" },
            { status: 500 }
        )
    }
}

// Helper function to build system prompt

function buildSystemPrompt(): string {
    return `You are ImpreCV Chat Assistant — a proactive resume editor. 

CRITICAL: ALWAYS respond with valid JSON. Never plain text. Never markdown.

CORE BEHAVIOR:
- BE PROACTIVE: When user says "improve", "expand", "make bigger", "enhance" — DO IT immediately using the resume context.
- TAKE ACTION: Generate new content yourself based on existing resume data.
- Match response language to user's message language.
- Keep resume content in its original language.

EXAMPLES OF PROACTIVE BEHAVIOR:
- "make my summary bigger" → Expand summary with details from experience
- "improve my skills" → Rewrite skills more professionally
- "отмени/undo/reset" → {"message": "Готово! Резюме сброшено.", "action": "reset"}

RESPONSE FORMAT — ALWAYS JSON:
{"message": "your response text", "modifications": [...], "action": "reset"}

- message: always required, short confirmation in user's language
- modifications: array of changes (optional)
- action: "reset" only for undo/cancel requests (optional)

MODIFICATION FORMAT:
{"action": "update|delete|add", "target": "personalInfo|section|item|bullet", "sectionIndex": N, "field": "...", "value": "..."}

personalInfo fields: name, title, email, phone, location, linkedin, website

NEVER output anything except valid JSON object starting with { and ending with }`
}
