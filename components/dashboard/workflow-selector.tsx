"use client"

import * as React from "react"
import { Card } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import {
    DropdownMenu,
    DropdownMenuContent,
    DropdownMenuItem,
    DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu"
import { Accordion, AccordionContent, AccordionItem, AccordionTrigger } from "@/components/ui/accordion"
import { cn } from "@/lib/utils"
import { Sparkles, Target, PenTool, Check, FileText, Zap, Brain, TrendingUp, Wand2, BookOpen, ChevronDown } from "lucide-react"

export type WorkflowMode = "adapt" | "improve" | "create"

interface WorkflowOption {
    id: WorkflowMode
    title: string
    subtitle: string
    description: string
    icon: React.ReactNode
    iconBg: string
    iconBgActive: string
    features: { icon: React.ReactNode; text: string }[]
}

const WORKFLOW_OPTIONS: WorkflowOption[] = [
    {
        id: "adapt",
        title: "Adapt to Job",
        subtitle: "Best for specific applications",
        description: "Upload your resume and paste a job posting. AI will tailor your resume to match requirements, optimize keywords, and generate a cover letter.",
        icon: <Target className="h-6 w-6" />,
        iconBg: "from-muted-foreground/20 to-muted-foreground/5 text-muted-foreground",
        iconBgActive: "from-[var(--gradient-2)]/30 to-[var(--gradient-3)]/10 text-[var(--gradient-2)]",
        features: [
            { icon: <TrendingUp className="h-3.5 w-3.5" />, text: "Match score analysis" },
            { icon: <Zap className="h-3.5 w-3.5" />, text: "Keyword optimization" },
            { icon: <FileText className="h-3.5 w-3.5" />, text: "Cover letter generation" },
        ],
    },
    {
        id: "improve",
        title: "Improve Resume",
        subtitle: "Best for general optimization",
        description: "Make your existing resume ATS-friendly. AI will enhance bullet points, improve formatting, and add industry keywords.",
        icon: <Sparkles className="h-6 w-6" />,
        iconBg: "from-muted-foreground/20 to-muted-foreground/5 text-muted-foreground",
        iconBgActive: "from-[var(--gradient-2)]/30 to-[var(--gradient-3)]/10 text-[var(--gradient-2)]",
        features: [
            { icon: <Brain className="h-3.5 w-3.5" />, text: "ATS optimization" },
            { icon: <Wand2 className="h-3.5 w-3.5" />, text: "Stronger bullet points" },
            { icon: <Zap className="h-3.5 w-3.5" />, text: "Professional formatting" },
        ],
    },
    {
        id: "create",
        title: "Create from Scratch",
        subtitle: "Best for new job seekers",
        description: "No resume yet? Fill in your experience and target role. AI will write professional content tailored to your industry.",
        icon: <PenTool className="h-6 w-6" />,
        iconBg: "from-muted-foreground/20 to-muted-foreground/5 text-muted-foreground",
        iconBgActive: "from-[var(--gradient-2)]/30 to-[var(--gradient-3)]/10 text-[var(--gradient-2)]",
        features: [
            { icon: <Brain className="h-3.5 w-3.5" />, text: "AI-powered writing" },
            { icon: <BookOpen className="h-3.5 w-3.5" />, text: "Industry-specific content" },
            { icon: <FileText className="h-3.5 w-3.5" />, text: "Professional templates" },
        ],
    },
]

interface WorkflowSelectorProps {
    selectedMode: WorkflowMode
    onModeChange: (mode: WorkflowMode) => void
    className?: string
}

export function WorkflowSelector({ selectedMode, onModeChange, className }: WorkflowSelectorProps) {
    return (
        <div className={className}>
            {/* Desktop: Grid layout */}
            <div className="hidden md:grid md:grid-cols-3 gap-4">
                {WORKFLOW_OPTIONS.map((option) => {
                    const isSelected = selectedMode === option.id
                    return (
                        <Card
                            key={option.id}
                            className={cn(
                                "group relative cursor-pointer p-6 transition-all flex flex-col",
                                isSelected
                                    ? "glass-card-primary ring-2 ring-primary/50"
                                    : "glass-card hover:border-primary/30"
                            )}
                            onClick={() => onModeChange(option.id)}
                        >
                            {isSelected && (
                                <div className="absolute top-4 right-4 h-6 w-6 rounded-full bg-primary flex items-center justify-center">
                                    <Check className="h-3.5 w-3.5 text-primary-foreground" />
                                </div>
                            )}
                            <div className="flex items-start gap-4">
                                <div
                                    className={cn(
                                        "h-12 w-12 rounded-xl bg-gradient-to-br flex items-center justify-center shrink-0 transition-all duration-200",
                                        isSelected
                                            ? option.iconBgActive
                                            : cn(option.iconBg, "group-hover:from-[var(--gradient-2)]/30 group-hover:to-[var(--gradient-3)]/10 group-hover:text-[var(--gradient-2)]")
                                    )}
                                >
                                    {option.icon}
                                </div>
                                <div className="min-w-0 flex-1 pr-6">
                                    <h3 className="text-lg font-semibold">{option.title}</h3>
                                    <p className="text-xs text-muted-foreground/70 mt-0.5">
                                        {option.subtitle}
                                    </p>
                                </div>
                            </div>
                            <p className="text-sm text-muted-foreground mt-4 leading-relaxed flex-1">
                                {option.description}
                            </p>
                            <div className="mt-5 space-y-2">
                                {option.features.map((feature, idx) => (
                                    <div
                                        key={idx}
                                        className="flex items-center gap-2 text-sm text-muted-foreground"
                                    >
                                        <span className={cn(
                                            "opacity-70 transition-all duration-200",
                                            isSelected
                                                ? "text-primary opacity-100"
                                                : "group-hover:text-[var(--gradient-2)] group-hover:opacity-100"
                                        )}>
                                            {feature.icon}
                                        </span>
                                        {feature.text}
                                    </div>
                                ))}
                            </div>
                        </Card>
                    )
                })}
            </div>

            {/* Mobile: Accordion layout */}
            <div className="md:hidden">
                <Accordion
                    type="single"
                    defaultValue={selectedMode}
                    collapsible
                    className="space-y-3"
                    onValueChange={(value) => {
                        if (value) onModeChange(value as WorkflowMode)
                    }}
                >
                    {WORKFLOW_OPTIONS.map((option) => {
                        const isSelected = selectedMode === option.id
                        return (
                            <AccordionItem
                                key={option.id}
                                value={option.id}
                                className={cn(
                                    "border rounded-2xl px-4 overflow-hidden transition-all",
                                    isSelected
                                        ? "glass-card-primary ring-2 ring-primary/50"
                                        : "glass-card"
                                )}
                            >
                                <AccordionTrigger className="py-4 hover:no-underline gap-3">
                                    <div className="flex items-center gap-3 flex-1">
                                        <div className={cn(
                                            "h-10 w-10 rounded-xl bg-gradient-to-br flex items-center justify-center shrink-0",
                                            isSelected ? option.iconBgActive : option.iconBg
                                        )}>
                                            {option.icon}
                                        </div>
                                        <div className="text-left flex-1">
                                            <div className="flex items-center gap-2">
                                                <span className="font-semibold">{option.title}</span>
                                            </div>
                                            <p className="text-xs text-muted-foreground/70 mt-0.5">
                                                {option.subtitle}
                                            </p>
                                        </div>
                                        {isSelected && (
                                            <div className="h-6 w-6 rounded-full bg-primary flex items-center justify-center shrink-0 mr-2">
                                                <Check className="h-3.5 w-3.5 text-primary-foreground" />
                                            </div>
                                        )}
                                    </div>
                                </AccordionTrigger>
                                <AccordionContent className="pb-4">
                                    <div className="space-y-4">
                                        <p className="text-sm text-muted-foreground leading-relaxed">
                                            {option.description}
                                        </p>
                                        <div className="space-y-2">
                                            {option.features.map((feature, idx) => (
                                                <div
                                                    key={idx}
                                                    className="flex items-center gap-2 text-sm text-muted-foreground"
                                                >
                                                    <span className={cn(
                                                        "transition-all duration-200",
                                                        isSelected ? "text-primary" : "opacity-70"
                                                    )}>
                                                        {feature.icon}
                                                    </span>
                                                    {feature.text}
                                                </div>
                                            ))}
                                        </div>
                                    </div>
                                </AccordionContent>
                            </AccordionItem>
                        )
                    })}
                </Accordion>
            </div>
        </div>
    )
}

interface WorkflowHeaderProps {
    mode: WorkflowMode
}

export function WorkflowHeader({ mode }: WorkflowHeaderProps) {
    const option = WORKFLOW_OPTIONS.find((o) => o.id === mode)
    if (!option) return null

    return (
        <div className="flex items-center gap-2.5">
            <div className={cn(
                "h-8 w-8 rounded-lg bg-gradient-to-br flex items-center justify-center",
                option.iconBg
            )}>
                {option.icon}
            </div>
            <div>
                <h2 className="text-lg font-semibold leading-tight">{option.title}</h2>
            </div>
        </div>
    )
}

interface InlineModePickerProps {
    selectedMode: WorkflowMode
    onModeChange: (mode: WorkflowMode) => void
}

export function InlineModePicker({ selectedMode, onModeChange }: InlineModePickerProps) {
    const [open, setOpen] = React.useState(false)
    const currentOption = WORKFLOW_OPTIONS.find((o) => o.id === selectedMode)
    const scrollStartRef = React.useRef<{ x: number; y: number } | null>(null)
    const wheelAccumulatorRef = React.useRef(0)

    // Close dropdown after scrolling past threshold (100px)
    React.useEffect(() => {
        if (!open) return

        const SCROLL_THRESHOLD = 100
        wheelAccumulatorRef.current = 0

        // Desktop: wheel event
        const handleWheel = (e: WheelEvent) => {
            wheelAccumulatorRef.current += Math.abs(e.deltaY) + Math.abs(e.deltaX)
            if (wheelAccumulatorRef.current > SCROLL_THRESHOLD) {
                setOpen(false)
            }
        }

        // Mobile: touch events
        const handleTouchStart = (e: TouchEvent) => {
            const touch = e.touches[0]
            scrollStartRef.current = { x: touch.clientX, y: touch.clientY }
        }

        const handleTouchMove = (e: TouchEvent) => {
            if (!scrollStartRef.current) return

            const touch = e.touches[0]
            const deltaX = Math.abs(touch.clientX - scrollStartRef.current.x)
            const deltaY = Math.abs(touch.clientY - scrollStartRef.current.y)

            if (deltaX > SCROLL_THRESHOLD || deltaY > SCROLL_THRESHOLD) {
                setOpen(false)
                scrollStartRef.current = null
            }
        }

        const handleTouchEnd = () => {
            scrollStartRef.current = null
        }

        document.addEventListener('wheel', handleWheel, { passive: true })
        document.addEventListener('touchstart', handleTouchStart, { passive: true })
        document.addEventListener('touchmove', handleTouchMove, { passive: true })
        document.addEventListener('touchend', handleTouchEnd, { passive: true })

        return () => {
            document.removeEventListener('wheel', handleWheel)
            document.removeEventListener('touchstart', handleTouchStart)
            document.removeEventListener('touchmove', handleTouchMove)
            document.removeEventListener('touchend', handleTouchEnd)
        }
    }, [open])

    if (!currentOption) return null

    return (
        <DropdownMenu open={open} onOpenChange={setOpen} modal={false}>
            <DropdownMenuTrigger asChild>
                <Button
                    variant="ghost"
                    size="lg"
                    className="gap-3 px-4 h-12 text-base glass-card-primary hover:opacity-90"
                >
                    <div className={cn(
                        "h-8 w-8 rounded-lg bg-gradient-to-br flex items-center justify-center",
                        currentOption.iconBgActive
                    )}>
                        {currentOption.icon}
                    </div>
                    <span className="font-semibold text-lg">{currentOption.title}</span>
                    <ChevronDown className="h-5 w-5 text-muted-foreground" />
                </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent
                align="center"
                sideOffset={8}
                className="w-[min(16rem,calc(100vw-2rem))] bg-white/60 dark:bg-background/80 backdrop-blur-xl backdrop-saturate-150 border-border/30 shadow-lg rounded-xl"
            >
                {WORKFLOW_OPTIONS.map((option) => {
                    const isSelected = selectedMode === option.id
                    return (
                        <DropdownMenuItem
                            key={option.id}
                            onClick={() => onModeChange(option.id)}
                            className={cn(
                                "gap-3 py-3 px-3 rounded-lg mx-1 my-0.5",
                                isSelected && "glass-card-primary !bg-transparent focus:!bg-transparent"
                            )}
                        >
                            <div className={cn(
                                "h-9 w-9 rounded-lg bg-gradient-to-br flex items-center justify-center shrink-0",
                                isSelected ? option.iconBgActive : option.iconBg
                            )}>
                                {option.icon}
                            </div>
                            <div className="flex-1 min-w-0">
                                <div className="font-medium truncate">{option.title}</div>
                                <div className="text-xs text-muted-foreground truncate">{option.subtitle}</div>
                            </div>
                            {isSelected && (
                                <Check className="h-5 w-5 text-primary shrink-0" />
                            )}
                        </DropdownMenuItem>
                    )
                })}
            </DropdownMenuContent>
        </DropdownMenu>
    )
}
