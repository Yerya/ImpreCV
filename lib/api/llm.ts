/**
 * LLM API Wrapper - Centralized AI Model Management
 * 
 * This module provides a unified interface for interacting with Google Gemini models,
 * implementing automatic fallback between models and robust error handling.
 * 

 * 
 * Features:
 * - Automatic model fallback on errors
 * - Configurable retry logic with exponential backoff
 * - Structured logging for debugging
 * - Type-safe response extraction
 */

import { GoogleGenAI } from "@google/genai"
import type { GenerateContentResponse } from "@google/genai"

// Model configuration
export const LLM_MODELS = {
    PRIMARY: "gemini-3-flash-preview",
    FALLBACK: "gemini-2.5-flash",
} as const

export type LLMModel = typeof LLM_MODELS[keyof typeof LLM_MODELS]

// Default configuration for different use cases
export const LLM_CONFIGS = {
    chat: {
        maxOutputTokens: 8192,
        temperature: 0.2,
        responseMimeType: "application/json" as const,
        thinkingConfig: {
            thinkingLevel: "minimal" as const,
        },
    },
    creation: {
        maxOutputTokens: 8192,
        temperature: 0.2,
        responseMimeType: "application/json" as const,
        thinkingConfig: {
            thinkingLevel: "medium" as const,
        },
    },
    adaptation: {
        maxOutputTokens: 8192,
        temperature: 0.4,
        responseMimeType: "application/json" as const,
        thinkingConfig: {
            thinkingLevel: "medium" as const,
        },
    },
    coverLetter: {
        maxOutputTokens: 4096,
        temperature: 0.45,
        responseMimeType: "text/plain" as const,
        thinkingConfig: {
            thinkingLevel: "medium" as const,
        },
    },
    skillMap: {
        maxOutputTokens: 8192,
        temperature: 0.2,
        responseMimeType: "application/json" as const,
        thinkingConfig: {
            thinkingLevel: "medium" as const,
        },
    },
} as const

export type LLMConfigType = keyof typeof LLM_CONFIGS

// Error types for categorization
export type LLMErrorType =
    | "API_KEY_MISSING"
    | "RATE_LIMIT"
    | "TIMEOUT"
    | "MODEL_UNAVAILABLE"
    | "INVALID_RESPONSE"
    | "UNKNOWN"

export class LLMError extends Error {
    constructor(
        message: string,
        public type: LLMErrorType,
        public model: string,
        public originalError?: unknown
    ) {
        super(message)
        this.name = "LLMError"
    }
}

interface LLMRequestOptions {
    model?: LLMModel
    configType?: LLMConfigType
    customConfig?: {
        maxOutputTokens?: number
        temperature?: number
        responseMimeType?: "application/json" | "text/plain"
        thinkingConfig?: {
            thinkingLevel: "minimal" | "low" | "medium" | "high"
        }
    }
    enableFallback?: boolean
    maxRetries?: number
    logPrefix?: string
}

interface LLMResponse {
    text: string
    model: string
    usedFallback: boolean
}

const REFUSAL_SAMPLE_LENGTH = 1200
const REFUSAL_PATTERNS: RegExp[] = [
    /\b(as an ai|as a language model)\b/i,
    /\b(i(?:'|\u2019)?m sorry|i am sorry)\b[^.]{0,120}\b(can(?:not|'t)|unable|not able)\b/i,
    /\b(can(?:not|'t)|unable|not able)\b[^.]{0,120}\b(help|assist|comply|fulfill|provide|do that|with that request)\b/i,
    /\b(not allowed|not permitted|disallowed|prohibited|forbidden)\b/i,
    /\b(violat\w*|breach\w*)\b[^.]{0,120}\b(policy|policies|guidelines|safety)\b/i,
    /(?:\u043d\u0435 \u043c\u043e\u0433\u0443|\u043d\u0435 \u0432 \u0441\u043e\u0441\u0442\u043e\u044f\u043d\u0438\u0438)[^.]{0,120}(?:\u043f\u043e\u043c\u043e\u0447\u044c|\u0432\u044b\u043f\u043e\u043b\u043d\u0438\u0442\u044c|\u0441\u0434\u0435\u043b\u0430\u0442\u044c|\u043f\u0440\u0435\u0434\u043e\u0441\u0442\u0430\u0432\u0438\u0442\u044c)/i,
    /(?:\u043c\u043d\u0435 \u043d\u0435\u043b\u044c\u0437\u044f|\u043d\u0435 \u0440\u0430\u0437\u0440\u0435\u0448\u0435\u043d\u043e|\u0437\u0430\u043f\u0440\u0435\u0449\u0435\u043d\u043e)/i,
]

export function isLikelyRefusalResponse(text: string): boolean {
    if (!text || typeof text !== "string") return false
    const sample = text.slice(0, REFUSAL_SAMPLE_LENGTH).replace(/\s+/g, " ").trim()
    if (!sample) return false
    return REFUSAL_PATTERNS.some((pattern) => pattern.test(sample))
}

export interface RefusalInfo {
    message?: string
    refusalReason?: string
}

export function getRefusalInfo(data: unknown): RefusalInfo | null {
    if (!data || typeof data !== "object") return null
    const record = data as Record<string, unknown>
    if (record.status !== "refused") return null
    const message = typeof record.message === "string" ? record.message : undefined
    const refusalReason = typeof record.refusalReason === "string"
        ? record.refusalReason
        : typeof record.reason === "string"
            ? record.reason
            : undefined
    return { message, refusalReason }
}

export function parseRefusalInfo(text: string): RefusalInfo | null {
    if (!text || typeof text !== "string") return null
    const trimmed = cleanJsonResponse(text)
    if (!trimmed.startsWith("{") || !trimmed.endsWith("}")) return null
    try {
        const parsed = JSON.parse(trimmed)
        return getRefusalInfo(parsed)
    } catch {
        return null
    }
}

/**
 * Extract text from Gemini API response
 * Handles multiple response formats for compatibility
 */
export function extractResponseText(response: GenerateContentResponse | Record<string, unknown>): string {
    try {
        // Method 1: response.text property (string or getter)
        // For Gemini 3 with thinking, .text should aggregate all text parts
        if (typeof response?.text === "string" && response.text.length > 0) {
            return response.text
        }

        // Method 2: response.text() function (SDK v1+)
        if (typeof response?.text === "function") {
            const textOutput = response.text()
            if (textOutput && textOutput.length > 0) {
                return textOutput
            }
        }

        // Method 3: candidates array (raw API response or fallback)
        // For thinking models, we need to find the text parts (not thought parts)
        const candidates = response?.candidates as Array<{
            content?: {
                parts?: Array<{
                    text?: string
                    thought?: boolean
                }>
            }
        }> | undefined

        if (candidates && candidates.length > 0) {
            const parts = candidates[0]?.content?.parts
            if (parts && parts.length > 0) {
                // Filter out thought parts, only get text parts
                // In thinking models, regular output has thought: false or no thought field
                const textParts = parts
                    .filter(part => !part.thought && part.text)
                    .map(part => part.text)
                    .join("")

                if (textParts.length > 0) {
                    return textParts
                }

                if (textParts.length > 0) {
                    return textParts
                }

                // Fallback: concatenate ALL text parts if filtering resulted in empty string
                // Sometimes the SDK might not flag 'thought' correctly or we want to capture everything
                const allTextParts = parts
                    .filter(part => part.text)
                    .map(part => part.text)
                    .join("")

                if (allTextParts.length > 0) {
                    return allTextParts
                }
            }
        }

        console.warn("[LLM] Could not extract text from response. Response keys:", Object.keys(response || {}))
        return ""
    } catch (error) {
        console.error("[LLM] Error extracting response text:", error)
        return ""
    }
}

/**
 * Clean JSON response from markdown code blocks
 */
export function cleanJsonResponse(text: string): string {
    let cleaned = text.trim()

    if (cleaned.startsWith("```json")) {
        cleaned = cleaned.slice(7)
    } else if (cleaned.startsWith("```")) {
        cleaned = cleaned.slice(3)
    }

    if (cleaned.endsWith("```")) {
        cleaned = cleaned.slice(0, -3)
    }

    return cleaned.trim()
}

/**
 * Determine if error is retryable
 */
function isRetryableError(error: unknown): boolean {
    if (error instanceof Error) {
        const message = error.message.toLowerCase()
        return (
            message.includes("rate limit") ||
            message.includes("quota") ||
            message.includes("timeout") ||
            message.includes("503") ||
            message.includes("429") ||
            message.includes("overloaded")
        )
    }
    return false
}

/**
 * Categorize error type for logging and handling
 */
function categorizeError(error: unknown): LLMErrorType {
    if (error instanceof Error) {
        const message = error.message.toLowerCase()

        if (message.includes("rate limit") || message.includes("429") || message.includes("quota")) {
            return "RATE_LIMIT"
        }
        if (message.includes("timeout")) {
            return "TIMEOUT"
        }
        if (message.includes("not found") || message.includes("unavailable") || message.includes("503")) {
            return "MODEL_UNAVAILABLE"
        }
    }
    return "UNKNOWN"
}

/**
 * Sleep utility for retry backoff
 */
function sleep(ms: number): Promise<void> {
    return new Promise(resolve => setTimeout(resolve, ms))
}

/**
 * Main LLM API class with fallback support
 */
export class LLMClient {
    private ai: GoogleGenAI
    private logPrefix: string

    constructor(apiKey?: string, logPrefix = "[LLM]") {
        const key = apiKey || process.env.GEMINI_API_KEY

        if (!key) {
            throw new LLMError(
                "GEMINI_API_KEY is not configured",
                "API_KEY_MISSING",
                "none"
            )
        }

        this.ai = new GoogleGenAI({ apiKey: key })
        this.logPrefix = logPrefix
    }

    /**
     * Generate content with automatic fallback
     */
    async generate(
        prompt: string | Array<{ role: "user" | "model"; parts: Array<{ text: string }> }>,
        options: LLMRequestOptions = {}
    ): Promise<LLMResponse> {
        const {
            model = LLM_MODELS.PRIMARY,
            configType = "chat",
            customConfig,
            enableFallback = true,
            maxRetries = 2,
            logPrefix = this.logPrefix,
        } = options

        const rawConfig = customConfig || LLM_CONFIGS[configType]
        const contents = typeof prompt === "string"
            ? [{ role: "user" as const, parts: [{ text: prompt }] }]
            : prompt

        // Check if the model supports thinkingConfig (only Gemini 3 series and certain preview models)
        const supportsThinking = model.includes("gemini-3") || model.includes("gemini-2.5-flash-preview")

        // Strip thinkingConfig for models that don't support it
        const config = supportsThinking
            ? rawConfig
            : (() => {
                // eslint-disable-next-line @typescript-eslint/no-unused-vars
                const { thinkingConfig, ...rest } = rawConfig as Record<string, unknown>
                return rest
            })()

        // Try primary model
        try {
            const response = await this.callWithRetry(model, contents, config, maxRetries, logPrefix)
            console.log(`${logPrefix} ✓ Success with model: ${model} (thinking: ${supportsThinking ? "enabled" : "disabled"})`)
            return {
                text: extractResponseText(response),
                model,
                usedFallback: false,
            }
        } catch (primaryError) {
            console.error(`${logPrefix} Primary model (${model}) failed:`, primaryError)

            // Attempt fallback if enabled
            if (enableFallback && model !== LLM_MODELS.FALLBACK) {
                console.log(`${logPrefix} Attempting fallback to ${LLM_MODELS.FALLBACK}`)

                // Ensure thinkingConfig is removed for fallback (gemini-2.5-flash doesn't support it)
                // eslint-disable-next-line @typescript-eslint/no-unused-vars
                const { thinkingConfig, ...fallbackConfig } = config as Record<string, unknown>

                try {
                    const response = await this.callWithRetry(
                        LLM_MODELS.FALLBACK,
                        contents,
                        fallbackConfig,
                        maxRetries,
                        logPrefix
                    )

                    console.log(`${logPrefix} ✓ Fallback success with model: ${LLM_MODELS.FALLBACK} (thinking: disabled)`)
                    return {
                        text: extractResponseText(response),
                        model: LLM_MODELS.FALLBACK,
                        usedFallback: true,
                    }
                } catch (fallbackError) {
                    console.error(`${logPrefix} Fallback model also failed:`, fallbackError)
                    throw new LLMError(
                        "All models failed to generate content",
                        categorizeError(fallbackError),
                        LLM_MODELS.FALLBACK,
                        fallbackError
                    )
                }
            }

            throw new LLMError(
                "Failed to generate content",
                categorizeError(primaryError),
                model,
                primaryError
            )
        }
    }

    /**
     * Call API with retry logic
     */
    private async callWithRetry(
        model: string,
        contents: Array<{ role: "user" | "model"; parts: Array<{ text: string }> }>,
        config: {
            maxOutputTokens?: number
            temperature?: number
            responseMimeType?: "application/json" | "text/plain"
            thinkingConfig?: {
                thinkingLevel: "minimal" | "low" | "medium" | "high"
            }
        },
        maxRetries: number,
        logPrefix: string
    ): Promise<GenerateContentResponse> {
        let lastError: unknown

        for (let attempt = 0; attempt <= maxRetries; attempt++) {
            try {
                if (attempt > 0) {
                    const backoffMs = Math.min(1000 * Math.pow(2, attempt - 1), 8000)
                    console.log(`${logPrefix} Retry ${attempt}/${maxRetries} after ${backoffMs}ms`)
                    await sleep(backoffMs)
                }

                const response = await this.ai.models.generateContent({
                    model,
                    contents,
                    // eslint-disable-next-line @typescript-eslint/no-explicit-any
                    config: config as any,
                })

                return response
            } catch (error) {
                lastError = error

                if (!isRetryableError(error) || attempt === maxRetries) {
                    throw error
                }

                console.warn(`${logPrefix} Attempt ${attempt + 1} failed, will retry:`, error)
            }
        }

        throw lastError
    }

    /**
     * Parse JSON response with validation
     */
    async generateJSON<T = unknown>(
        prompt: string | Array<{ role: "user" | "model"; parts: Array<{ text: string }> }>,
        options: LLMRequestOptions = {}
    ): Promise<{ data: T; model: string; usedFallback: boolean }> {
        const response = await this.generate(prompt, {
            ...options,
            customConfig: {
                ...options.customConfig,
                responseMimeType: "application/json",
            },
        })

        const cleanedText = cleanJsonResponse(response.text)

        try {
            const data = JSON.parse(cleanedText) as T
            return {
                data,
                model: response.model,
                usedFallback: response.usedFallback,
            }
        } catch (parseError) {
            console.error(`${this.logPrefix} Failed to parse JSON response:`, cleanedText.slice(0, 200))
            throw new LLMError(
                "Invalid JSON response from model",
                "INVALID_RESPONSE",
                response.model,
                parseError
            )
        }
    }
}

/**
 * Create LLM client instance
 * Use this factory function in API routes
 */
export function createLLMClient(logPrefix?: string): LLMClient {
    return new LLMClient(undefined, logPrefix)
}

/**
 * Quick helper for simple text generation
 */
export async function generateText(
    prompt: string,
    options: LLMRequestOptions = {}
): Promise<string> {
    const client = createLLMClient(options.logPrefix)
    const response = await client.generate(prompt, options)
    return response.text
}

/**
 * Quick helper for JSON generation
 */
export async function generateJSON<T = unknown>(
    prompt: string,
    options: LLMRequestOptions = {}
): Promise<T> {
    const client = createLLMClient(options.logPrefix)
    const response = await client.generateJSON<T>(prompt, options)
    return response.data
}
