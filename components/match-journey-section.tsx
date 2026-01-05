"use client"

import { useEffect, useMemo, useRef, useState, type CSSProperties, type MutableRefObject, type RefObject } from "react"
import { Card } from "@/components/ui/card"
import { FileText, TrendingUp, Upload as UploadIcon, Wand2, Map as MapIcon, Send } from "lucide-react"
import { cn } from "@/lib/utils"
import { clamp, easeOutCubic } from "@/lib/math"
import { useMatchJourney } from "@/hooks/use-match-journey"
import { motion, useSpring } from "framer-motion"

type MatchEmphasis = "match" | "expand" | "skillmap" | "result"

type MatchStep = {
  id: number
  label: string
  title: string
  description: string
  score: number
  emphasis: MatchEmphasis
}

const MATCH_STEPS: MatchStep[] = [
  {
    id: 1,
    label: "Choose",
    title: "Choose your path",
    description: "Create from scratch, improve existing resume, or adapt to a specific job posting.",
    score: 52,
    emphasis: "match",
  },
  {
    id: 2,
    label: "Input",
    title: "Provide your details",
    description: "Upload resume, fill in your experience, or paste the job description you're targeting.",
    score: 68,
    emphasis: "expand",
  },
  {
    id: 3,
    label: "AI Magic",
    title: "Let AI work for you",
    description: "AI creates, improves, or tailors your resume with ATS-optimized content and keywords.",
    score: 82,
    emphasis: "skillmap",
  },
  {
    id: 4,
    label: "Export",
    title: "Download and apply",
    description: "Get your polished resume, cover letter, and SkillMap ready to send.",
    score: 95,
    emphasis: "result",
  },
]

type StepStyle = {
  translateY: number
  scale: number
  opacity: number
  blur: number
  isActive: boolean
}

function MatchJourneyDesktop() {
  const sectionRef = useRef<HTMLElement | null>(null)
  const journeyRef = useRef<HTMLDivElement | null>(null)

  const {
    progress,
    activeIndex,
    timelineFill,
    timelineBounds,
    stepsWrapperRef,
    stickyPanelRef,
    headingRef,
    cardRefs,
    timelineRef,
    segments,
  } = useMatchJourney({ stepsCount: MATCH_STEPS.length })

  const animProgress = progress

  const activeStep = MATCH_STEPS[activeIndex] ?? MATCH_STEPS[0]
  const nextStep = MATCH_STEPS[Math.min(activeIndex + 1, MATCH_STEPS.length - 1)] ?? activeStep

  const indicatorProgress = segments === 0 ? 1 : activeIndex / segments

  const stepStyles = useMemo(
    () =>
      MATCH_STEPS.map((_, index) => {
        const stepPosition = segments === 0 ? 0 : index / segments
        const zone = segments === 0 ? 1 : 1 / segments
        const distance = Math.abs(animProgress - stepPosition)
        const normalized = clamp(distance / (zone * 1.8))
        const emphasis = easeOutCubic(1 - normalized)
        const translateY = (1 - emphasis) * 24
        const scale = 0.985 + 0.015 * emphasis
        const opacity = 0.55 + 0.45 * emphasis
        const isActive = index === activeIndex
        const blur = isActive ? 0 : (1 - emphasis) * 6

        return {
          translateY,
          scale,
          opacity,
          blur,
          isActive,
        }
      }),
    [activeIndex, animProgress, segments],
  )
  // Avoid tiny glow dot at the very start of the timeline
  const showFillGlow = indicatorProgress > 0.02

  return (
    <section
      ref={sectionRef}
      className="relative z-10 min-h-[calc(100vh-var(--header-h))] py-12 md:py-16 lg:py-20 flex items-center"
    >
      <div className="container mx-auto px-4 relative flex min-h-full flex-col justify-center">
        <div
          ref={headingRef}
          className="max-w-4xl mx-auto mb-14 text-center transition-opacity duration-500 ease-out"
          style={{ opacity: progress > 0 ? 1 : 0.85 }}
        >
          <h2 className="text-4xl md:text-5xl font-bold mb-4">
            <span className="gradient-text">How ImpreCV Works</span>
          </h2>
          <p className="text-lg text-muted-foreground max-w-2xl mx-auto">
            From idea to interview-ready resume in four simple steps.
          </p>
        </div>

        <div ref={journeyRef} className="grid gap-10 lg:grid-cols-[minmax(0,0.82fr)_minmax(0,1.3fr)] items-start max-w-6xl mx-auto">
          <div
            ref={stickyPanelRef}
            className="hidden lg:flex lg:flex-col"
            style={{
              position: "sticky",
              top: "calc(0.5 * (100vh - 40%))",
              height: "fit-content",
              minHeight: 0,
            }}
          >
            <div className="flex flex-col">
              <MatchPanel
                step={activeStep}
                nextLabel={nextStep.label}
                score={activeStep.score}
                overallProgress={indicatorProgress}
              />
            </div>
          </div>
          <div className="space-y-6 lg:space-y-10">
            <MatchPanel
              step={activeStep}
              nextLabel={nextStep.label}
              score={activeStep.score}
              overallProgress={indicatorProgress}
              className="hidden md:block lg:hidden mb-6"
            />

            <MatchJourneyStepsColumn
              steps={MATCH_STEPS}
              stepStyles={stepStyles}
              timelineFill={timelineFill}
              indicatorProgress={indicatorProgress}
              timelineBounds={timelineBounds}
              stepsWrapperRef={stepsWrapperRef}
              timelineRef={timelineRef}
              cardRefs={cardRefs}
              showFillGlow={showFillGlow}
            />
          </div>
        </div>
      </div>
    </section>
  )
}

export function MatchJourneySection() {
  return <MatchJourneyDesktop />
}

type MatchJourneyStepsColumnProps = {
  steps: MatchStep[]
  stepStyles: StepStyle[]
  timelineFill: number
  indicatorProgress: number
  timelineBounds: { top: number; height: number } | null
  stepsWrapperRef: RefObject<HTMLDivElement | null>
  timelineRef: RefObject<HTMLDivElement | null>
  cardRefs: MutableRefObject<(HTMLDivElement | null)[]>
  showFillGlow: boolean
}

function MatchJourneyStepsColumn({
  steps,
  stepStyles,
  timelineFill,
  indicatorProgress,
  timelineBounds,
  stepsWrapperRef,
  timelineRef,
  cardRefs,
  showFillGlow,
}: MatchJourneyStepsColumnProps) {
  return (
    <div
      ref={stepsWrapperRef}
      className="relative space-y-10 lg:space-y-14 md:pl-6 lg:min-h-[60vh] lg:flex lg:flex-col lg:justify-center"
    >
      <div
        className={cn(
          "pointer-events-none absolute left-[52px] md:left-[60px] lg:left-[66px] xl:left-[80px] hidden md:block overflow-visible",
          !timelineBounds && "top-6 bottom-6",
        )}
        style={timelineBounds ? { top: timelineBounds.top, height: timelineBounds.height } : undefined}
      >
        <div ref={timelineRef} className="relative h-full w-px">
          <div className="absolute inset-0 bg-gradient-to-b from-transparent via-white/20 to-transparent opacity-70 blur-[0.5px]" />
          <div
            className={cn(
              "absolute inset-x-0 top-0 w-full bg-gradient-to-b from-[var(--gradient-1)] via-[var(--gradient-2)] to-transparent transition-[height] duration-500 ease-out",
              showFillGlow && "shadow-[0_0_25px_rgba(var(--accent-r),var(--accent-g),var(--accent-b),0.35)]",
            )}
            style={{ height: `${Math.max(0, timelineFill || indicatorProgress) * 100}%` }}
          />
          <div className="absolute -bottom-8 left-1/2 h-8 w-[2px] -translate-x-1/2 bg-gradient-to-t from-transparent via-white/30 to-white/60 opacity-80 blur-[14px] z-10" />
        </div>
      </div>

      {steps.map((step, index) => {
        const { translateY, scale, opacity, blur, isActive } = stepStyles[index]

        return (
          <div
            key={step.id}
            className="relative will-change-transform"
            ref={(el) => {
              cardRefs.current[index] = el
            }}
            style={{
              opacity,
              transform: `translate3d(0, ${translateY}px, 0) scale(${scale})`,
              filter: `blur(${blur}px)`,
            }}
          >
            <div className="grid grid-cols-[92px_minmax(0,1fr)] md:grid-cols-[104px_minmax(0,1fr)] lg:grid-cols-[120px_minmax(0,1fr)] gap-4 md:gap-8 items-start">
              <div className="relative flex flex-col items-center md:items-end pt-1 gap-0 w-[92px] md:w-[104px] lg:w-[120px]">
                <div
                  className={cn(
                    "flex h-11 w-11 items-center justify-center rounded-full text-[0.8rem] font-semibold tracking-[0.18em] transition-all duration-300",
                    isActive
                      ? "bg-gradient-to-br from-[var(--gradient-1)] to-[var(--gradient-2)] text-white shadow-[0_30px_80px_-40px_rgba(0,0,0,0.9)] shadow-pulse scale-105"
                      : "bg-white/10 text-white/60 backdrop-blur-sm",
                  )}
                >
                  {String(step.id).padStart(2, "0")}
                </div>
              </div>

              <Card
                className={cn(
                  "glass-card rounded-[28px] p-0 transition-all duration-500",
                  isActive ? "shadow-[0_30px_80px_-40px_rgba(0,0,0,0.9)]" : "opacity-80",
                )}
              >
                <div className="flex h-full flex-col gap-4 p-5 md:p-6">
                  <div className="flex items-center justify-between gap-3">
                    <div>
                      <h3 className="text-lg md:text-xl font-semibold">{step.title}</h3>
                    </div>
                    <div className="flex items-center gap-2 text-xs md:text-sm text-muted-foreground">
                      <TrendingUp className="h-4 w-4 text-primary" />
                      <span className="font-medium tabular-nums">{step.score}% fit</span>
                    </div>
                  </div>
                  <p className="text-sm md:text-base text-muted-foreground leading-relaxed">{step.description}</p>
                  <div className="flex flex-wrap items-center gap-2 pt-2">
                    <TagChip emphasis={step.emphasis} />
                  </div>
                </div>
              </Card>
            </div>
          </div>
        )
      })}
    </div>
  )
}

type MatchPanelProps = {
  step: MatchStep
  nextLabel?: string
  score: number
  overallProgress: number
  className?: string
  style?: CSSProperties
}

function MatchPanel({ step, score, overallProgress, className, style }: MatchPanelProps) {
  return (
    <Card
      className={cn(
        "glass-card relative overflow-hidden rounded-[32px] p-0 shadow-[0_35px_120px_-65px_rgba(0,0,0,0.9)]",
        className,
      )}
      style={style}
    >
      <div
        className="pointer-events-none absolute inset-0 opacity-70"
        style={{
          background:
            "radial-gradient(circle at 30% 20%, rgba(var(--accent-r),var(--accent-g),var(--accent-b),0.25), transparent 50%), radial-gradient(circle at 80% 10%, rgba(var(--accent-r),var(--accent-g),var(--accent-b),0.18), transparent 60%)",
        }}
      />
      <div className="relative z-10 flex flex-col gap-5 p-6 md:p-8">

        <div className="flex flex-col gap-4 md:flex-row md:items-end md:justify-between">
          <div>
            <h3 className="text-2xl md:text-3xl font-semibold leading-snug">{step.title}</h3>
          </div>
          <div className="text-right">
            <MatchScore value={score} />
            <p className="mt-1 text-xs text-muted-foreground">Resume – job fit</p>
          </div>
        </div>

        <p className="text-sm md:text-base text-muted-foreground leading-relaxed">{step.description}</p>

        <div className="flex flex-wrap items-center gap-2">
          <TagChip emphasis={step.emphasis} />
          <div className="inline-flex items-center gap-2 rounded-full bg-background/70 px-2.5 py-1 text-[0.7rem] font-medium text-muted-foreground">
            <FileText className="h-3.5 w-3.5" />
            <span>CV, cover letter, SkillMap</span>
          </div>
        </div>

        <div className="h-1.5 w-full rounded-full bg-white/10 overflow-hidden">
          <div
            className="h-full bg-gradient-to-r from-[var(--gradient-1)] via-[var(--gradient-2)] to-[var(--gradient-3)] transition-all duration-500"
            style={{ width: `${Math.min(Math.max(overallProgress, 0), 1) * 100}%` }}
          />
        </div>

      </div>
    </Card>
  )
}

type MatchScoreProps = {
  value: number
}

function MatchScore({ value }: MatchScoreProps) {
  const [display, setDisplay] = useState(value)
  const spring = useSpring(value, {
    stiffness: 120,
    damping: 20,
    mass: 0.4,
  })

  useEffect(() => {
    const unsubscribe = spring.on("change", (latest) => {
      setDisplay(latest)
    })
    return unsubscribe
  }, [spring])

  useEffect(() => {
    spring.set(value)
  }, [spring, value])

  return (
    <motion.div
      className="text-4xl md:text-5xl font-semibold gradient-text leading-none tabular-nums"
      aria-label={`${Math.round(display)}% match`}
    >
      {Math.round(display)}%
    </motion.div>
  )
}




type TagChipProps = {
  emphasis: MatchEmphasis
}

function TagChip({ emphasis }: TagChipProps) {
  const colorClasses: Record<MatchEmphasis, string> = {
    match: "bg-emerald-400/10 text-emerald-400",
    expand: "bg-sky-400/10 text-sky-400",
    skillmap: "bg-amber-400/10 text-amber-400",
    result: "bg-violet-400/10 text-violet-400",
  }

  const Icon = {
    match: UploadIcon,
    expand: Wand2,
    skillmap: MapIcon,
    result: Send,
  }[emphasis]

  return (
    <span
      className={cn(
        "inline-flex items-center gap-1.5 rounded-full px-2.5 py-1 text-[0.68rem]",
        colorClasses[emphasis],
      )}
    >
      <Icon className="h-3.5 w-3.5" aria-hidden="true" />
    </span>
  )
}

export default MatchJourneySection
