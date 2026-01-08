"use client"

import { memo, useMemo } from "react"
import { Card } from "@/components/ui/card"
import { TrendingUp, Sparkles, CheckCircle2, ArrowRight } from "lucide-react"
import { cn } from "@/lib/utils"

interface ATSScoreCardProps {
    scoreBefore: number | null | undefined
    scoreAfter: number | null | undefined
    className?: string
    variant?: "default" | "compact" | "mobile"
}

function getScoreLabel(score: number): string {
    if (score >= 80) return "Excellent"
    if (score >= 60) return "Good"
    if (score >= 40) return "Fair"
    return "Needs Work"
}

interface ScoreCircleProps {
    score: number
    label: string
    size?: "large" | "small" | "tiny"
    isGood: boolean
}

function ScoreCircle({ score, label, size = "large", isGood }: ScoreCircleProps) {
    const isTiny = size === "tiny"
    const isSmall = size === "small"
    const isLarge = size === "large"
    const radius = isTiny ? 20 : isSmall ? 28 : 40
    const circumference = 2 * Math.PI * radius
    const strokeDashoffset = circumference - (score / 100) * circumference

    // Good score uses accent color, bad uses muted gray
    const colorStyle = isGood
        ? { color: "rgb(var(--accent-r), var(--accent-g), var(--accent-b))" }
        : { color: "rgb(156, 163, 175)" } // gray-400

    return (
        <div className="flex flex-col items-center gap-0.5">
            <div className={cn(
                "relative", 
                isTiny ? "w-11 h-11" : isSmall ? "w-16 h-16" : "w-24 h-24"
            )}>
                <svg className="w-full h-full transform -rotate-90">
                    <circle
                        cx="50%"
                        cy="50%"
                        r={radius}
                        stroke="currentColor"
                        strokeWidth={isTiny ? 3 : isLarge ? 6 : 4}
                        fill="none"
                        className="text-muted/20"
                    />
                    <circle
                        cx="50%"
                        cy="50%"
                        r={radius}
                        strokeWidth={isTiny ? 3 : isLarge ? 6 : 4}
                        fill="none"
                        strokeLinecap="round"
                        className="transition-all duration-1000 ease-out"
                        style={{
                            stroke: isGood 
                                ? "rgb(var(--accent-r), var(--accent-g), var(--accent-b))" 
                                : "rgb(156, 163, 175)",
                            strokeDasharray: circumference,
                            strokeDashoffset: strokeDashoffset,
                        }}
                    />
                </svg>
                <div className="absolute inset-0 flex items-center justify-center">
                    <span 
                        className={cn(
                            "font-bold", 
                            isTiny ? "text-sm" : isSmall ? "text-lg" : "text-2xl"
                        )}
                        style={colorStyle}
                    >
                        {score}
                    </span>
                </div>
            </div>
            <span className={cn(
                "text-muted-foreground", 
                isTiny ? "text-[10px]" : isSmall ? "text-xs" : "text-sm"
            )}>
                {label}
            </span>
        </div>
    )
}

export const ATSScoreCard = memo(function ATSScoreCard({
    scoreBefore,
    scoreAfter,
    className,
    variant = "default"
}: ATSScoreCardProps) {
    const improvement = useMemo(() => {
        if (scoreBefore == null || scoreAfter == null) return null
        return scoreAfter - scoreBefore
    }, [scoreBefore, scoreAfter])

    // Don't render if no scores available
    if (scoreBefore == null && scoreAfter == null) {
        return null
    }

    const isCompact = variant === "compact" || variant === "mobile"
    const isMobile = variant === "mobile"
    const isAfterGood = (scoreAfter ?? 0) >= 60

    return (
        <Card className={cn("glass-card overflow-hidden", className)}>
            {/* Header */}
            <div className={cn(
                "flex items-center gap-2 border-b border-border/50",
                isMobile ? "px-3 py-1.5" : isCompact ? "px-4 py-2" : "px-6 py-3"
            )}>
                <Sparkles 
                    className={cn(isMobile ? "h-3.5 w-3.5" : isCompact ? "h-4 w-4" : "h-5 w-5")} 
                    style={{ color: "rgb(var(--accent-r), var(--accent-g), var(--accent-b))" }}
                />
                <h3 className={cn("font-semibold", isMobile ? "text-xs" : isCompact ? "text-sm" : "text-base")}>
                    ATS Score
                </h3>
                {improvement != null && improvement > 0 && (
                    <div 
                        className={cn("ml-auto flex items-center gap-1 font-medium", isMobile ? "text-xs" : "text-sm")}
                        style={{ color: "rgb(var(--accent-r), var(--accent-g), var(--accent-b))" }}
                    >
                        <TrendingUp className={cn(isMobile ? "h-3 w-3" : "h-4 w-4")} />
                        <span>+{improvement}%</span>
                    </div>
                )}
            </div>

            {/* Scores */}
            <div className={cn(isMobile ? "p-3" : isCompact ? "p-4" : "p-6")}>
                <div className={cn(
                    "flex items-center justify-center",
                    isMobile ? "gap-3" : isCompact ? "gap-4" : "gap-8"
                )}>
                    {scoreBefore != null && (
                        <ScoreCircle 
                            score={scoreBefore} 
                            label="Before" 
                            size={isMobile ? "tiny" : isCompact ? "small" : "large"}
                            isGood={false}
                        />
                    )}
                    
                    {scoreBefore != null && scoreAfter != null && (
                        <div className="flex flex-col items-center justify-center">
                            <ArrowRight 
                                className={cn(
                                    "text-muted-foreground/50",
                                    isMobile ? "h-4 w-4" : isCompact ? "h-5 w-5" : "h-6 w-6"
                                )} 
                            />
                        </div>
                    )}
                    
                    {scoreAfter != null && (
                        <ScoreCircle 
                            score={scoreAfter} 
                            label="After" 
                            size={isMobile ? "tiny" : isCompact ? "small" : "large"}
                            isGood={isAfterGood}
                        />
                    )}
                </div>

                {/* Status message - hide on mobile */}
                {scoreAfter != null && !isMobile && (
                    <div 
                        className={cn(
                            "flex items-center justify-center gap-2 mt-4 rounded-lg",
                            isCompact ? "p-2" : "p-3"
                        )}
                        style={isAfterGood 
                            ? { backgroundColor: "rgba(var(--accent-r), var(--accent-g), var(--accent-b), 0.1)" }
                            : { backgroundColor: "rgba(156, 163, 175, 0.1)" }
                        }
                    >
                        <CheckCircle2 
                            className="h-4 w-4"
                            style={isAfterGood 
                                ? { color: "rgb(var(--accent-r), var(--accent-g), var(--accent-b))" }
                                : { color: "rgb(156, 163, 175)" }
                            }
                        />
                        <span 
                            className={cn("font-medium", isCompact ? "text-xs" : "text-sm")}
                            style={isAfterGood 
                                ? { color: "rgb(var(--accent-r), var(--accent-g), var(--accent-b))" }
                                : { color: "rgb(156, 163, 175)" }
                            }
                        >
                            {getScoreLabel(scoreAfter)} — {scoreAfter >= 70 
                                ? "Your resume is well-optimized for ATS" 
                                : "Consider further improvements for better ATS results"
                            }
                        </span>
                    </div>
                )}
            </div>
        </Card>
    )
})
