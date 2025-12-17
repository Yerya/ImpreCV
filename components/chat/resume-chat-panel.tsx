"use client"

import React, { useState, useRef, useCallback, useEffect, useMemo, memo } from "react"
import { Button } from "@/components/ui/button"
import { cn } from "@/lib/utils"
import {
    MessageSquare,
    Send,
    X,
    Loader2,
    Sparkles,
    AlertCircle,
    RotateCcw,
    ChevronDown,
    Bot
} from "lucide-react"
import type { ResumeData } from "@/lib/resume-templates/types"
import {
    ChatMessage,
    ChatUsage,
    ResumeModification,
    generateMessageId,
    applyModifications,
    CHAT_EXAMPLES,
    MAX_CHAT_MESSAGES,
    CHAT_STORAGE_KEY,
    MAX_MESSAGE_CHARS
} from "@/lib/chat"

interface ResumeChatPanelProps {
    resumeData: ResumeData
    resumeId: string | null
    onApplyModifications: (newData: ResumeData) => void
    onResetToBaseline?: () => void
    className?: string
}

interface ChatHistoryMessage {
    role: "user" | "assistant"
    content: string
}

// Strip markdown formatting from AI responses
function cleanMarkdown(text: string): string {
    return text
        .replace(/\*\*([^*]+)\*\*/g, '$1')  // **bold** → bold
        .replace(/\*([^*]+)\*/g, '$1')      // *italic* → italic
        .replace(/__([^_]+)__/g, '$1')      // __bold__ → bold
        .replace(/_([^_]+)_/g, '$1')        // _italic_ → italic
        .replace(/#{1,6}\s/g, '')           // # headers → remove
        .replace(/`([^`]+)`/g, '$1')        // `code` → code
        .trim()
}

const MessageBubble = memo(function MessageBubble({
    message,
    isUser
}: {
    message: ChatMessage
    isUser: boolean
}) {
    return (
        <div
            className={cn(
                "flex w-full gap-2",
                isUser ? "justify-end" : "justify-start"
            )}
        >
            {!isUser && (
                <div className="flex-shrink-0 h-8 w-8 rounded-full bg-primary/10 flex items-center justify-center self-center">
                    <Bot className="h-4 w-4 text-primary" />
                </div>
            )}
            <div
                className={cn(
                    "max-w-[85%] rounded-2xl px-3 py-2 text-[13px] leading-relaxed",
                    isUser
                        ? "bg-primary text-primary-foreground rounded-br-sm"
                        : "glass-chat-bubble rounded-bl-sm",
                    message.pending && "opacity-70"
                )}
            >
                {message.pending ? (
                    <div className="flex items-center gap-2">
                        <Loader2 className="h-3.5 w-3.5 animate-spin" />
                        <span>Thinking...</span>
                    </div>
                ) : (
                    <p className="whitespace-pre-wrap break-words overflow-wrap-anywhere">{cleanMarkdown(message.content)}</p>
                )}
            </div>
        </div>
    )
})

const ExampleChips = memo(function ExampleChips({
    examples,
    onSelect
}: {
    examples: string[]
    onSelect: (example: string) => void
}) {
    return (
        <div className="flex flex-wrap gap-2 p-4 border-t border-border/30">
            <p className="w-full text-xs text-muted-foreground mb-1">Try saying:</p>
            {examples.slice(0, 3).map((example) => (
                <button
                    key={example}
                    onClick={() => onSelect(example)}
                    className="text-xs px-3 py-1.5 rounded-full bg-secondary/50 hover:bg-secondary text-secondary-foreground transition-colors"
                >
                    {example}
                </button>
            ))}
        </div>
    )
})

const CharacterCounter = memo(function CharacterCounter({
    current,
    max
}: {
    current: number
    max: number
}) {
    const percentage = (current / max) * 100
    const isNearLimit = percentage >= 80
    const isOverLimit = current > max

    return (
        <span className={cn(
            "text-[10px] tabular-nums",
            isOverLimit ? "text-destructive font-medium" :
                isNearLimit ? "text-amber-500" :
                    "text-muted-foreground"
        )}>
            {current}/{max}
        </span>
    )
})

const UsageIndicator = memo(function UsageIndicator({
    usage
}: {
    usage: ChatUsage | null
}) {
    if (!usage) return null

    const percentage = (usage.count / usage.maxCount) * 100
    const isLow = percentage >= 80

    return (
        <div className="flex items-center gap-2 text-xs text-muted-foreground">
            <div className="flex-1 h-1 bg-secondary rounded-full overflow-hidden">
                <div
                    className={cn(
                        "h-full transition-all duration-300",
                        isLow ? "bg-destructive" : "bg-primary"
                    )}
                    style={{ width: `${percentage}%` }}
                />
            </div>
            <span className={cn(isLow && "text-destructive")}>
                {usage.count}/{usage.maxCount}
            </span>
        </div>
    )
})

export function ResumeChatPanel({
    resumeData,
    resumeId,
    onApplyModifications,
    onResetToBaseline,
    className
}: ResumeChatPanelProps) {
    const [isOpen, setIsOpen] = useState(false)
    const [messages, setMessages] = useState<ChatMessage[]>([])
    const [inputValue, setInputValue] = useState("")
    const [isLoading, setIsLoading] = useState(false)
    const [error, setError] = useState<string | null>(null)
    const [usage, setUsage] = useState<ChatUsage | null>(null)

    const scrollRef = useRef<HTMLDivElement>(null)
    const messagesEndRef = useRef<HTMLDivElement>(null)
    const inputRef = useRef<HTMLTextAreaElement>(null)
    const abortControllerRef = useRef<AbortController | null>(null)

    const charCount = inputValue.length
    const isOverLimit = charCount > MAX_MESSAGE_CHARS

    // Load messages from storage on mount
    useEffect(() => {
        if (!resumeId) return

        try {
            const stored = localStorage.getItem(`${CHAT_STORAGE_KEY}:${resumeId}`)
            if (stored) {
                const parsed = JSON.parse(stored) as ChatMessage[]
                setMessages(parsed.slice(-MAX_CHAT_MESSAGES))
            } else {
                setMessages([])
            }
        } catch {
            // Ignore storage errors
        }
    }, [resumeId])

    // Save messages to storage
    useEffect(() => {
        if (!resumeId || messages.length === 0) return

        try {
            const toStore = messages.filter(m => !m.pending).slice(-MAX_CHAT_MESSAGES)
            localStorage.setItem(`${CHAT_STORAGE_KEY}:${resumeId}`, JSON.stringify(toStore))
        } catch {
            // Ignore storage errors
        }
    }, [messages, resumeId])

    // Scroll to bottom when messages change
    useEffect(() => {
        // Use requestAnimationFrame to ensure DOM is updated
        requestAnimationFrame(() => {
            messagesEndRef.current?.scrollIntoView({ behavior: "smooth" })
        })
    }, [messages])

    // Fetch usage when panel opens
    useEffect(() => {
        if (!isOpen) return

        const fetchUsage = async () => {
            try {
                const response = await fetch("/api/chat-resume/usage")
                if (response.ok) {
                    const data = await response.json()
                    if (data.usage) {
                        setUsage(data.usage)
                    }
                }
            } catch {
                // Ignore errors fetching usage
            }
        }

        fetchUsage()
        inputRef.current?.focus()
    }, [isOpen])

    // Cleanup on unmount
    useEffect(() => {
        return () => {
            abortControllerRef.current?.abort()
        }
    }, [])

    const chatHistory = useMemo((): ChatHistoryMessage[] => {
        return messages
            .filter(m => !m.pending)
            .map(m => ({ role: m.role, content: m.content }))
    }, [messages])

    const sendMessage = useCallback(async (text: string) => {
        if (!text.trim() || isLoading || isOverLimit) return

        setError(null)
        setInputValue("")

        const userMessage: ChatMessage = {
            id: generateMessageId(),
            role: "user",
            content: text.trim(),
            timestamp: Date.now()
        }

        const pendingMessage: ChatMessage = {
            id: generateMessageId(),
            role: "assistant",
            content: "",
            timestamp: Date.now(),
            pending: true
        }

        setMessages(prev => [...prev.slice(-MAX_CHAT_MESSAGES + 2), userMessage, pendingMessage])
        setIsLoading(true)

        abortControllerRef.current?.abort()
        const controller = new AbortController()
        abortControllerRef.current = controller

        try {
            const response = await fetch("/api/chat-resume", {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({
                    message: text.trim(),
                    resumeData,
                    rewrittenResumeId: resumeId,
                    history: chatHistory
                }),
                signal: controller.signal
            })

            const data = await response.json()

            if (!response.ok) {
                throw new Error(data.error || "Failed to send message")
            }

            // Debug logging
            if (process.env.NODE_ENV === "development") {
                console.log("[Chat] API Response:", {
                    message: data.message,
                    modifications: data.modifications,
                    action: data.action
                })
            }

            if (data.usage) {
                setUsage(data.usage)
            }

            const assistantMessage: ChatMessage = {
                id: generateMessageId(),
                role: "assistant",
                content: data.message,
                timestamp: Date.now()
            }

            setMessages(prev =>
                prev.filter(m => m.id !== pendingMessage.id).concat(assistantMessage)
            )

            // Handle reset action
            if (data.action === "reset" && onResetToBaseline) {
                onResetToBaseline()
            }
            // Apply resume modifications
            else if (data.modifications && data.modifications.length > 0) {
                if (process.env.NODE_ENV === "development") {
                    console.log("[Chat] Applying modifications:", data.modifications)
                }
                const newData = applyModifications(resumeData, data.modifications as ResumeModification[])
                if (process.env.NODE_ENV === "development") {
                    console.log("[Chat] Result after apply:", newData.personalInfo)
                }
                onApplyModifications(newData)
            }

        } catch (err) {
            if ((err as Error).name === "AbortError") return

            const errorMessage = err instanceof Error ? err.message : "Something went wrong"
            setError(errorMessage)
            setMessages(prev => prev.filter(m => m.id !== pendingMessage.id))
        } finally {
            setIsLoading(false)
            // Keep focus on input
            requestAnimationFrame(() => {
                inputRef.current?.focus()
            })
        }
    }, [resumeData, resumeId, chatHistory, isLoading, isOverLimit, onApplyModifications, onResetToBaseline])

    const handleSubmit = useCallback((e: React.FormEvent) => {
        e.preventDefault()
        sendMessage(inputValue)
    }, [inputValue, sendMessage])

    const handleKeyDown = useCallback((e: React.KeyboardEvent<HTMLTextAreaElement>) => {
        if (e.key === "Enter" && !e.shiftKey) {
            e.preventDefault()
            sendMessage(inputValue)
        }
    }, [inputValue, sendMessage])

    const handleClearHistory = useCallback(() => {
        setMessages([])
        setError(null)
        if (resumeId) {
            localStorage.removeItem(`${CHAT_STORAGE_KEY}:${resumeId}`)
        }
    }, [resumeId])

    const handleExampleSelect = useCallback((example: string) => {
        setInputValue(example)
        inputRef.current?.focus()
    }, [])

    if (!isOpen) {
        return (
            <Button
                onClick={() => setIsOpen(true)}
                className={cn(
                    "fixed z-40 h-12 w-12 md:h-14 md:w-14 rounded-full shadow-lg",
                    "bottom-32 right-4 md:bottom-24 md:right-6",
                    "bg-primary hover:bg-primary/90 text-primary-foreground",
                    "transition-transform hover:scale-105",
                    className
                )}
                size="icon"
            >
                <MessageSquare className="h-5 w-5 md:h-6 md:w-6" />
            </Button>
        )
    }

    return (
        <div
            className={cn(
                "fixed z-40 rounded-2xl shadow-2xl overflow-hidden",
                "flex flex-col bg-background/80 backdrop-blur-xl backdrop-saturate-125",
                "border border-border/50",
                // Mobile: full width, bottom sheet style
                "inset-x-3 bottom-32 h-[60vh] max-h-[500px]",
                // Desktop: fixed width, positioned right
                "md:inset-x-auto md:bottom-24 md:right-6 md:w-[380px] md:h-[500px] md:max-h-[70vh]",
                className
            )}
        >
            {/* Header */}
            <div className="flex items-center justify-between p-3 md:p-4 border-b border-border/30 bg-background/50">
                <div className="flex items-center gap-2">
                    <div className="h-7 w-7 md:h-8 md:w-8 rounded-full bg-primary/10 flex items-center justify-center">
                        <Sparkles className="h-3.5 w-3.5 md:h-4 md:w-4 text-primary" />
                    </div>
                    <div>
                        <h3 className="text-sm font-semibold">AI Assistant</h3>
                        <p className="text-[11px] md:text-xs text-muted-foreground">Edit with commands</p>
                    </div>
                </div>
                <div className="flex items-center gap-1">
                    {messages.length > 0 && (
                        <Button
                            variant="ghost"
                            size="icon"
                            className="h-8 w-8"
                            onClick={handleClearHistory}
                            title="Clear history"
                        >
                            <RotateCcw className="h-4 w-4" />
                        </Button>
                    )}
                    <Button
                        variant="ghost"
                        size="icon"
                        className="h-8 w-8"
                        onClick={() => setIsOpen(false)}
                    >
                        <ChevronDown className="h-4 w-4" />
                    </Button>
                </div>
            </div>

            {/* Usage */}
            {usage && (
                <div className="px-4 py-2 border-b border-border/30">
                    <UsageIndicator usage={usage} />
                </div>
            )}

            {/* Messages */}
            <div
                ref={scrollRef}
                className={cn(
                    "flex-1 min-h-0 p-4 space-y-3",
                    messages.length > 0 && "overflow-y-auto scroll-smooth"
                )}
                style={messages.length > 0 ? { scrollbarGutter: "stable" } : undefined}
            >
                {messages.length === 0 ? (
                    <div className="text-center py-8">
                        <Sparkles className="h-8 w-8 mx-auto mb-3 text-muted-foreground/50" />
                        <p className="text-sm text-muted-foreground">
                            Ask me about the resume or CVify platform
                        </p>
                    </div>
                ) : (
                    <>
                        {messages.map((message) => (
                            <MessageBubble
                                key={message.id}
                                message={message}
                                isUser={message.role === "user"}
                            />
                        ))}
                        <div ref={messagesEndRef} aria-hidden="true" />
                    </>
                )}
            </div>

            {/* Error */}
            {error && (
                <div className="px-4 py-2 flex items-center gap-2 text-xs text-destructive bg-destructive/10">
                    <AlertCircle className="h-3.5 w-3.5 flex-shrink-0" />
                    <span className="line-clamp-2">{error}</span>
                    <Button
                        variant="ghost"
                        size="icon"
                        className="h-5 w-5 ml-auto flex-shrink-0"
                        onClick={() => setError(null)}
                    >
                        <X className="h-3 w-3" />
                    </Button>
                </div>
            )}

            {/* Examples */}
            {messages.length === 0 && (
                <ExampleChips examples={CHAT_EXAMPLES} onSelect={handleExampleSelect} />
            )}

            {/* Input */}
            <form
                onSubmit={handleSubmit}
                className="p-2 md:p-3 border-t border-border/30 bg-background/50"
            >
                <div className="flex items-center gap-2">
                    <div className="flex-1 relative">
                        <textarea
                            ref={inputRef}
                            value={inputValue}
                            onChange={(e) => setInputValue(e.target.value)}
                            onKeyDown={handleKeyDown}
                            placeholder="Type a command..."
                            rows={1}
                            maxLength={MAX_MESSAGE_CHARS + 50}
                            className={cn(
                                "w-full resize-none rounded-xl border-0 bg-secondary/50 px-3 md:px-4 py-2 md:py-2.5 pr-12 md:pr-16",
                                "text-sm placeholder:text-muted-foreground leading-5",
                                "focus:outline-none focus:ring-2 focus:ring-primary/30",
                                "h-9 md:h-10",
                                isOverLimit && "ring-2 ring-destructive/50"
                            )}
                            disabled={isLoading}
                        />
                        <div className="absolute right-2 md:right-3 top-1/2 -translate-y-1/2">
                            <CharacterCounter current={charCount} max={MAX_MESSAGE_CHARS} />
                        </div>
                    </div>
                    <Button
                        type="submit"
                        size="icon"
                        className="h-9 w-9 md:h-10 md:w-10 rounded-xl flex-shrink-0"
                        disabled={!inputValue.trim() || isLoading || isOverLimit}
                    >
                        {isLoading ? (
                            <Loader2 className="h-4 w-4 animate-spin" />
                        ) : (
                            <Send className="h-4 w-4" />
                        )}
                    </Button>
                </div>
            </form>
        </div>
    )
}
