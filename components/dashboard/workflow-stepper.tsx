"use client"

import { useState, ReactNode } from "react"
import { cn } from "@/lib/utils"
import { Check, Minus, ArrowRight } from "lucide-react"
import { Button } from "@/components/ui/button"
import {
    Accordion,
    AccordionContent,
    AccordionItem,
    AccordionTrigger,
} from "@/components/ui/accordion"

export interface WizardStep {
    id: string
    label: string
    isComplete: boolean
    content: ReactNode
    isOptional?: boolean
    /** Hint shown when step is incomplete */
    hint?: string
}

interface WizardFlowProps {
    steps: WizardStep[]
    onComplete: () => void
    completeButton: ReactNode
    isCompleteDisabled?: boolean
    className?: string
}

export function WizardFlow({
    steps,
    onComplete,
    completeButton,
    isCompleteDisabled,
    className,
}: WizardFlowProps) {
    // Find the first incomplete required step for initial state
    const firstIncomplete = steps.findIndex((s) => !s.isComplete && !s.isOptional)
    const initialStep = firstIncomplete === -1 ? steps[steps.length - 1]?.id : steps[firstIncomplete]?.id

    const [openStep, setOpenStep] = useState<string | undefined>(initialStep)

    // Check which required steps are missing
    const missingRequiredSteps = steps.filter((s) => !s.isOptional && !s.isComplete)
    const allRequiredComplete = missingRequiredSteps.length === 0

    const goToNextStep = (currentIndex: number) => {
        if (currentIndex < steps.length - 1) {
            setOpenStep(steps[currentIndex + 1].id)
        }
    }

    return (
        <div className={cn("space-y-2", className)}>
            <Accordion
                type="single"
                collapsible
                value={openStep}
                onValueChange={setOpenStep}
                className="space-y-3"
            >
                {steps.map((step, index) => {
                    const isOpen = openStep === step.id
                    const isLastStep = index === steps.length - 1
                    // Only show checkmark if actually complete (not just optional and empty)
                    const showCheckmark = step.isComplete && (!step.isOptional || step.isComplete)
                    // Show continue button if step is complete or optional
                    const canContinue = step.isComplete || step.isOptional

                    return (
                        <AccordionItem
                            key={step.id}
                            value={step.id}
                            className={cn(
                                "rounded-2xl border transition-all duration-200 overflow-hidden",
                                isOpen
                                    ? "glass-card-primary"
                                    : step.isComplete
                                        ? "glass-card"
                                        : "glass-card opacity-80"
                            )}
                        >
                            <AccordionTrigger className="px-4 py-4 hover:no-underline gap-4">
                                <div className="flex items-center gap-4 flex-1">
                                    {/* Step Indicator Circle */}
                                    <div
                                        className={cn(
                                            "h-10 w-10 rounded-full flex items-center justify-center font-semibold text-sm transition-all duration-300 shrink-0",
                                            showCheckmark
                                                ? "bg-gradient-to-br from-[var(--gradient-1)] to-[var(--gradient-2)] text-background"
                                                : isOpen
                                                    ? "ring-2 ring-[var(--gradient-2)] bg-[var(--gradient-2)]/10 text-foreground"
                                                    : step.isOptional
                                                        ? "bg-muted/50 text-muted-foreground border-2 border-dashed border-border"
                                                        : "bg-muted text-muted-foreground"
                                        )}
                                    >
                                        {showCheckmark ? (
                                            <Check className="h-5 w-5" />
                                        ) : step.isOptional && !isOpen ? (
                                            <Minus className="h-4 w-4" />
                                        ) : (
                                            <span>{index + 1}</span>
                                        )}
                                    </div>

                                    {/* Step Label */}
                                    <div className="flex items-center gap-2">
                                        <span
                                            className={cn(
                                                "font-semibold transition-colors",
                                                isOpen || step.isComplete ? "text-foreground" : "text-muted-foreground"
                                            )}
                                        >
                                            {step.label}
                                        </span>
                                        {step.isOptional && (
                                            <span className="text-xs text-muted-foreground">(optional)</span>
                                        )}
                                    </div>
                                </div>
                            </AccordionTrigger>

                            <AccordionContent className="px-4 pb-4">
                                <div className="pl-14 space-y-4">
                                    {step.content}

                                    {/* Continue / Skip button */}
                                    {!isLastStep && (
                                        <Button
                                            type="button"
                                            variant={canContinue ? "default" : "outline"}
                                            size="sm"
                                            onClick={() => goToNextStep(index)}
                                            className="gap-2"
                                        >
                                            {step.isOptional && !step.isComplete ? "Skip" : "Continue"}
                                            <ArrowRight className="h-4 w-4" />
                                        </Button>
                                    )}
                                </div>
                            </AccordionContent>
                        </AccordionItem>
                    )
                })}
            </Accordion>

            {/* Final Action Button - Always visible */}
            <div className="pt-2 space-y-2">
                <div onClick={isCompleteDisabled ? undefined : onComplete}>
                    {completeButton}
                </div>

                {/* Show what's missing */}
                {!allRequiredComplete && (
                    <p className="text-sm text-muted-foreground text-center">
                        {missingRequiredSteps[0]?.hint || `Complete: ${missingRequiredSteps.map((s) => s.label).join(", ")}`}
                    </p>
                )}
            </div>
        </div>
    )
}
