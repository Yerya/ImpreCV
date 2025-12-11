/**
 * Application-wide constants
 * Centralized configuration for limits, timeouts, and other settings
 */

// ==================== RESUME LIMITS ====================
/** Maximum number of original resumes a user can upload */
export const MAX_RESUMES_PER_USER = 3

/** Maximum number of adapted resumes a user can save */
export const MAX_ADAPTED_RESUMES = 3

/** Error message shown when adapted resume limit is reached */
export const ADAPTED_RESUME_LIMIT_ERROR = "You can keep up to 3 adapted resumes. Please delete one from the Resume Editor."

/** Maximum content length for resume/job description (characters) */
export const MAX_CONTENT_LENGTH = 50000

// ==================== RATE LIMITS ====================
/** Minutes to wait before re-adapting the same resume */
export const RESUME_ADAPT_COOLDOWN_MINUTES = 5

/** Error message shown when adaptation rate limit is hit */
export const ADAPT_RATE_LIMIT_ERROR = "Please wait a few minutes before re-adapting this resume."

// ==================== CHAT LIMITS ====================
/** Maximum AI chat modifications per day */
export const MAX_CHAT_MODIFICATIONS_PER_DAY = 50

/** Hours until chat usage limit resets */
export const CHAT_USAGE_RESET_HOURS = 24

/** Maximum character length for chat messages */
export const MAX_CHAT_MESSAGE_CHARS = 500

/** Maximum chat history messages to keep in context */
export const MAX_CHAT_HISTORY_MESSAGES = 6

/** Maximum chat messages to store locally */
export const MAX_CHAT_MESSAGES_STORED = 20

/** Local storage key for chat history */
export const CHAT_STORAGE_KEY = "cvify:chat-history"

// ==================== API DEFAULTS ====================
/** Default limit for list queries */
export const DEFAULT_LIST_LIMIT = 10
