/**
 * Structured Logger for API Routes
 * 
 * Provides JSON-formatted logging for production monitoring and debugging.
 * All logs include timestamp, correlation data, and structured metrics.
 */

export type LogLevel = "info" | "warn" | "error" | "debug"

export interface LogEntry {
    timestamp: string
    level: LogLevel
    service: string
    event: string
    userId?: string
    requestId?: string
    duration?: number
    model?: string
    usedFallback?: boolean
    tokensUsed?: number
    error?: string
    metadata?: Record<string, unknown>
}

/**
 * Generate unique request ID for tracing
 */
export function generateRequestId(): string {
    return `req_${Date.now()}_${Math.random().toString(36).slice(2, 9)}`
}

/**
 * Create structured log entry
 */
function createLogEntry(
    level: LogLevel,
    service: string,
    event: string,
    data?: Partial<Omit<LogEntry, "timestamp" | "level" | "service" | "event">>
): LogEntry {
    return {
        timestamp: new Date().toISOString(),
        level,
        service,
        event,
        ...data,
    }
}

/**
 * Output log entry to console in JSON format
 */
function outputLog(entry: LogEntry): void {
    const logString = JSON.stringify(entry)
    
    switch (entry.level) {
        case "error":
            console.error(logString)
            break
        case "warn":
            console.warn(logString)
            break
        case "debug":
            console.debug(logString)
            break
        default:
            console.log(logString)
    }
}

/**
 * Structured Logger class for API routes
 */
export class Logger {
    private service: string
    private requestId: string
    private userId?: string
    private startTime: number

    constructor(service: string, userId?: string, requestId?: string) {
        this.service = service
        this.requestId = requestId || generateRequestId()
        this.userId = userId
        this.startTime = Date.now()
    }

    private log(
        level: LogLevel,
        event: string,
        data?: Partial<Omit<LogEntry, "timestamp" | "level" | "service" | "event">>
    ): void {
        const entry = createLogEntry(level, this.service, event, {
            requestId: this.requestId,
            userId: this.userId,
            ...data,
        })
        outputLog(entry)
    }

    info(event: string, metadata?: Record<string, unknown>): void {
        this.log("info", event, { metadata })
    }

    warn(event: string, metadata?: Record<string, unknown>): void {
        this.log("warn", event, { metadata })
    }

    error(event: string, error?: Error | string, metadata?: Record<string, unknown>): void {
        this.log("error", event, {
            error: error instanceof Error ? error.message : error,
            metadata,
        })
    }

    debug(event: string, metadata?: Record<string, unknown>): void {
        this.log("debug", event, { metadata })
    }

    /**
     * Log LLM request completion with metrics
     */
    llmComplete(data: {
        model: string
        usedFallback: boolean
        tokensUsed?: number
        success: boolean
        error?: string
    }): void {
        const duration = Date.now() - this.startTime
        this.log(data.success ? "info" : "error", "llm_request_complete", {
            duration,
            model: data.model,
            usedFallback: data.usedFallback,
            tokensUsed: data.tokensUsed,
            error: data.error,
            metadata: { success: data.success },
        })
    }

    /**
     * Log API request start
     */
    requestStart(endpoint: string, metadata?: Record<string, unknown>): void {
        this.log("info", "request_start", {
            metadata: { endpoint, ...metadata },
        })
    }

    /**
     * Log API request completion
     */
    requestComplete(statusCode: number, metadata?: Record<string, unknown>): void {
        const duration = Date.now() - this.startTime
        this.log("info", "request_complete", {
            duration,
            metadata: { statusCode, ...metadata },
        })
    }

    /**
     * Get elapsed time since logger creation
     */
    getElapsedMs(): number {
        return Date.now() - this.startTime
    }

    /**
     * Get request ID for correlation
     */
    getRequestId(): string {
        return this.requestId
    }
}

/**
 * Create logger instance for API route
 */
export function createLogger(service: string, userId?: string): Logger {
    return new Logger(service, userId)
}
