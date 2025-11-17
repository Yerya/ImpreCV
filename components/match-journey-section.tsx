"use client"

import { useEffect, useRef, useState, type CSSProperties } from "react"
import { Card } from "@/components/ui/card"
import { Brain, FileText, Target, TrendingUp } from "lucide-react"
import { cn } from "@/lib/utils"

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
    label: "Resume check",
    title: "Fix the invisibility issues",
    description:
      "CVify compares your resume with the job link to catch missing keywords, unclear bullets, and formatting mistakes that block ATS.",
    score: 52,
    emphasis: "match",
  },
  {
    id: 2,
    label: "Rewrite boost",
    title: "Let AI refresh key wins",
    description:
      "The assistant rewrites the bullets that matter with metrics and company language so recruiters instantly get what you do.",
    score: 68,
    emphasis: "expand",
  },
  {
    id: 3,
    label: "SkillMap focus",
    title: "Know what to lean into",
    description:
      "SkillMap splits strengths and gaps so you can highlight what already resonates and plan what to upskill next.",
    score: 82,
    emphasis: "skillmap",
  },
  {
    id: 4,
    label: "Launch kit",
    title: "Send a role-ready drop",
    description:
      "Export a matched resume, cover letter, and insight summary that feel written for the posting so you stay at the top of the pile.",
    score: 95,
    emphasis: "result",
  },
]

const emphasisLabel: Record<MatchEmphasis, string> = {
  match: "Get seen",
  expand: "Tell the story",
  skillmap: "Plan the focus",
  result: "Apply with confidence",
}

const emphasisHint: Record<MatchEmphasis, string> = {
  match: "Stops quick rejections by fixing obvious blockers.",
  expand: "Keeps the best proof front and center.",
  skillmap: "Shows what to highlight vs. what to build.",
  result: "Everything you send feels tailored.",
}

const clamp = (value: number, min = 0, max = 1) => Math.min(max, Math.max(min, value))
const easeOutCubic = (t: number) => 1 - Math.pow(1 - t, 3)

function MatchJourneyDesktop() {
  const sectionRef = useRef<HTMLElement | null>(null)
  const journeyRef = useRef<HTMLDivElement | null>(null)
  const stepsWrapperRef = useRef<HTMLDivElement | null>(null)
  const stickyPanelRef = useRef<HTMLDivElement | null>(null)
  const headingRef = useRef<HTMLDivElement | null>(null)
  const [progress, setProgress] = useState(0)
  const [activeIndex, setActiveIndex] = useState(0)
  const [displayScore, setDisplayScore] = useState(MATCH_STEPS[0]?.score ?? 0)
  const scoreAnimFrameRef = useRef<number | null>(null)
  const scoreFromRef = useRef(MATCH_STEPS[0]?.score ?? 0)
  const scoreToRef = useRef(MATCH_STEPS[0]?.score ?? 0)
  const scoreStartTimeRef = useRef<number | null>(null)
  const activeIndexRef = useRef(0)
  const [stickyTop, setStickyTop] = useState<number | null>(null)
  const [timelineFill, setTimelineFill] = useState(0)
  const [timelineBounds, setTimelineBounds] = useState<{ top: number; height: number } | null>(null)
  const progressTargetRef = useRef(0)
  const cardRefs = useRef<(HTMLDivElement | null)[]>([])
  const timelineRef = useRef<HTMLDivElement | null>(null)
  const stepsCount = MATCH_STEPS.length
  const segments = Math.max(stepsCount - 1, 1)

  useEffect(() => {
    const updateStickyTop = () => {
      if (typeof window === "undefined") return
      const headingEl = headingRef.current
      let headingBlock = 0
      if (headingEl) {
        const styles = window.getComputedStyle(headingEl)
        const mb = parseFloat(styles.marginBottom || "0") || 0
        headingBlock = headingEl.offsetHeight + mb
      }
      const targetTop = Math.max(24, headingBlock + 8)
      setStickyTop(targetTop)
    }

    updateStickyTop()
    window.addEventListener("resize", updateStickyTop)
    return () => window.removeEventListener("resize", updateStickyTop)
  }, [])

  useEffect(() => {
    const updateTimelineBounds = () => {
      const wrapper = stepsWrapperRef.current
      const cards = cardRefs.current.filter(Boolean)
      if (!wrapper || cards.length === 0) return

      const wrapperRect = wrapper.getBoundingClientRect()
      const firstRect = cards[0].getBoundingClientRect()
      const lastRect = cards[cards.length - 1].getBoundingClientRect()

      const startWithinWrapper = Math.max(0, firstRect.top - wrapperRect.top - 10)
      const endWithinWrapper = Math.max(startWithinWrapper + 16, lastRect.bottom - wrapperRect.top)
      setTimelineBounds({ top: startWithinWrapper, height: endWithinWrapper - startWithinWrapper })
    }

    const rafId = requestAnimationFrame(updateTimelineBounds)
    window.addEventListener("resize", updateTimelineBounds)
    return () => {
      cancelAnimationFrame(rafId)
      window.removeEventListener("resize", updateTimelineBounds)
    }
  }, [])

  useEffect(() => {
    let rafId = 0
    const handleScroll = () => {
      cancelAnimationFrame(rafId)
      rafId = requestAnimationFrame(() => {
        if (typeof window === "undefined") return
        const hero = document.getElementById("hero-anchor")
        const heroRect = hero?.getBoundingClientRect()
        if (heroRect && heroRect.bottom > 0) {
          progressTargetRef.current = 0
          if (activeIndexRef.current !== 0) {
            activeIndexRef.current = 0
            setActiveIndex(0)
          }
          return
        }

        const cards = cardRefs.current.filter(Boolean)
        if (cards.length === 0) return

        const scrollY = window.scrollY || window.pageYOffset
        const stickyRect = stickyPanelRef.current?.getBoundingClientRect()
        const focalY =
          stickyRect && stickyRect.height > 0
            ? stickyRect.top + stickyRect.height * 0.5 + scrollY
            : scrollY + (window.innerHeight || 0) * 0.45

        const centers = cards.map((card) => {
          const rect = card.getBoundingClientRect()
          return rect.top + rect.height * 0.5 + scrollY
        })

        const firstCenter = centers[0]
        const lastCenter = centers[centers.length - 1]
        const span = Math.max(1, lastCenter - firstCenter)
        progressTargetRef.current = clamp((focalY - firstCenter) / span, 0, 1)

        let nearestIndex = 0
        let nearestDelta = Math.abs(centers[0] - focalY)
        for (let i = 1; i < centers.length; i += 1) {
          const delta = Math.abs(centers[i] - focalY)
          if (delta < nearestDelta) {
            nearestDelta = delta
            nearestIndex = i
          }
        }

        if (nearestIndex !== activeIndexRef.current) {
          activeIndexRef.current = nearestIndex
          setActiveIndex(nearestIndex)
        }

        const timelineEl = timelineRef.current
        const activeCard = cardRefs.current[activeIndexRef.current]
        if (timelineEl && activeCard) {
          const lineRect = timelineEl.getBoundingClientRect()
          const cardRect = activeCard.getBoundingClientRect()
          const fillRatio = clamp((cardRect.bottom + 12 - lineRect.top) / lineRect.height, 0, 1)
          setTimelineFill(fillRatio)
        }
      })
    }

    handleScroll()
    window.addEventListener("scroll", handleScroll, { passive: true })
    window.addEventListener("resize", handleScroll)
    return () => {
      window.removeEventListener("scroll", handleScroll)
      window.removeEventListener("resize", handleScroll)
      cancelAnimationFrame(rafId)
    }
  }, [])

  useEffect(() => {
    let rafId = 0
    const tick = () => {
      setProgress((prev) => {
        const target = progressTargetRef.current
        const delta = target - prev
        if (Math.abs(delta) < 0.001) {
          return target
        }
        const segmentUnit = 1 / segments
        const maxStep = segmentUnit * 0.03
        const step = Math.sign(delta) * Math.min(Math.abs(delta), maxStep)
        return prev + step
      })
      rafId = requestAnimationFrame(tick)
    }
    rafId = requestAnimationFrame(tick)
    return () => cancelAnimationFrame(rafId)
  }, [segments])

  useEffect(() => {
    const targetScore = MATCH_STEPS[activeIndex]?.score ?? MATCH_STEPS[0]?.score ?? 0

    if (scoreAnimFrameRef.current !== null) {
      cancelAnimationFrame(scoreAnimFrameRef.current)
      scoreAnimFrameRef.current = null
    }

    setDisplayScore((current) => {
      scoreFromRef.current = current
      scoreToRef.current = targetScore
      scoreStartTimeRef.current = typeof performance !== "undefined" ? performance.now() : null
      return current
    })

    const duration = 450
    const animate = (now: number) => {
      const start = scoreStartTimeRef.current
      if (start === null) return

      const rawT = (now - start) / duration
      if (rawT >= 1) {
        setDisplayScore(scoreToRef.current)
        scoreAnimFrameRef.current = null
        return
      }

      const t = easeOutCubic(clamp(rawT, 0, 1))
      const value = scoreFromRef.current + (scoreToRef.current - scoreFromRef.current) * t
      setDisplayScore(value)
      scoreAnimFrameRef.current = requestAnimationFrame(animate)
    }

    scoreAnimFrameRef.current = requestAnimationFrame(animate)

    return () => {
      if (scoreAnimFrameRef.current !== null) {
        cancelAnimationFrame(scoreAnimFrameRef.current)
        scoreAnimFrameRef.current = null
      }
    }
  }, [activeIndex])

  const animProgress = progress

  const activeStep = MATCH_STEPS[activeIndex] ?? MATCH_STEPS[0]
  const nextStep = MATCH_STEPS[Math.min(activeIndex + 1, stepsCount - 1)] ?? activeStep

  const indicatorProgress = segments === 0 ? 1 : activeIndex / segments
  // Avoid tiny glow dot at the very start of the timeline
  const showFillGlow = indicatorProgress > 0.02

  return (
    <section
      ref={sectionRef}
      className="relative z-10 min-h-[calc(100vh-var(--header-h))] py-12 md:py-16 lg:py-20 flex items-center"
    >
      <div className="absolute inset-0 pointer-events-none">
        <div
          className="absolute -left-32 top-10 h-72 w-72 rounded-full blur-[140px]"
          style={{ background: "radial-gradient(circle, rgba(var(--accent-r),var(--accent-g),var(--accent-b),0.35), transparent 70%)" }}
        />
        <div
          className="absolute right-0 top-1/2 h-[28rem] w-[28rem] -translate-y-1/2 rounded-full blur-[160px]"
          style={{ background: "radial-gradient(circle, rgba(var(--accent-r),var(--accent-g),var(--accent-b),0.18), transparent 75%)" }}
        />
      </div>
      <div className="container mx-auto px-4 relative flex min-h-full flex-col justify-center">
        <div
          ref={headingRef}
          className="max-w-4xl mx-auto mb-14 text-center transition-opacity duration-500 ease-out"
          style={{ opacity: progress > 0 ? 1 : 0.85 }}
        >
          <h2 className="text-4xl md:text-5xl font-bold mb-4">
            <span className="gradient-text">CVify Match Journey</span>
          </h2>
          <p className="text-xl text-muted-foreground max-w-2xl mx-auto">From raw resume to SkillMap</p>
        </div>

        <div ref={journeyRef} className="grid gap-10 lg:grid-cols-[minmax(0,0.82fr)_minmax(0,1.3fr)] items-start max-w-6xl mx-auto">
          <div
            ref={stickyPanelRef}
            className="hidden lg:flex lg:flex-col"
            style={{
              position: "sticky",
              top: "calc(0.5 * (100vh - 410px))",
              height: "fit-content",
              minHeight: 0,
            }}
          >
            <div className="flex flex-col">
              <MatchPanel
                step={activeStep}
                nextLabel={nextStep.label}
                score={displayScore}
                overallProgress={indicatorProgress}
              />
            </div>
          </div>
          <div className="space-y-6 lg:space-y-10">
            <MatchPanel
              step={activeStep}
              nextLabel={nextStep.label}
              score={displayScore}
              overallProgress={indicatorProgress}
              className="hidden md:block lg:hidden mb-6"
            />

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

              {MATCH_STEPS.map((step, index) => {
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

                return (
                  <div
                    key={step.id}
                    className="relative transition-transform duration-400 ease-out will-change-transform"
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
                        {null}
                      </div>

                      <Card
                        className={cn(
                          "glass-card rounded-[28px] p-0 transition-all duration-500 h-auto md:h-[248px] lg:h-[260px]",
                          isActive ? "shadow-[0_30px_80px_-40px_rgba(0,0,0,0.9)]" : "opacity-80",
                        )}
                      >
                        <div className="flex h-full flex-col gap-4 p-5 md:p-6">
                          <div className="flex items-center justify-between gap-3">
                            <div>
                              <p className="text-[0.7rem] uppercase tracking-[0.3em] text-muted-foreground/70">
                                {emphasisLabel[step.emphasis]}
                              </p>
                              <h3 className="text-base md:text-lg font-semibold md:line-clamp-1">{step.title}</h3>
                            </div>
                            <div className="flex items-center gap-2 text-xs md:text-sm text-muted-foreground">
                              <TrendingUp className="h-4 w-4 text-primary" />
                              <span className="font-medium tabular-nums">{step.score}% match</span>
                            </div>
                          </div>
                          <p className="text-sm md:text-[0.94rem] text-muted-foreground leading-relaxed md:line-clamp-2">
                            {step.description}
                          </p>
                          <div className="flex flex-wrap items-center gap-2 pt-2">
                            <TagChip emphasis={step.emphasis} />
                            <span className="text-xs text-muted-foreground/80">{emphasisHint[step.emphasis]}</span>
                          </div>
                        </div>
                      </Card>
                    </div>
                  </div>
                )
              })}
            </div>
          </div>
        </div>
      </div>
    </section>
  )
}

export function MatchJourneySection() {
  return <MatchJourneyDesktop />
}

type MatchPanelProps = {
  step: MatchStep
  nextLabel?: string
  score: number
  overallProgress: number
  className?: string
  style?: CSSProperties
}

function MatchPanel({ step, nextLabel, score, overallProgress, className, style }: MatchPanelProps) {
  return (
    <Card
      className={cn(
        "glass-card relative overflow-hidden rounded-[32px] p-0 shadow-[0_35px_120px_-65px_rgba(0,0,0,0.9)] min-h-[420px] md:min-h-[480px]",
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
        
        <div className="flex items-center gap-2 text-xs font-semibold uppercase tracking-[0.2em] text-muted-foreground">
          <Brain className="h-4 w-4" />
          <span>AI visibility journey</span>
        </div>

        <div className="flex flex-col gap-4 md:flex-row md:items-end md:justify-between">
          <div>
            <p className="text-xs font-medium text-muted-foreground">{step.label}</p>
            <h3 className="text-2xl md:text-3xl font-semibold leading-snug">{step.title}</h3>
          </div>
          <div className="text-right">
            <div className="text-4xl md:text-5xl font-semibold gradient-text leading-none tabular-nums">
              {Math.round(score)}%
            </div>
            <p className="mt-1 text-xs text-muted-foreground">Current match</p>
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

        <div className="space-y-2">
          <div className="flex items-center justify-between gap-3 text-[0.7rem] font-medium text-muted-foreground uppercase tracking-[0.18em]">
            <span className="max-w-[48%] truncate">{emphasisLabel[step.emphasis]}</span>
            <span className="max-w-[48%] truncate text-right">{nextLabel ? `Next: ${nextLabel}` : "Final step"}</span>
          </div>
          <div className="h-1.5 w-full rounded-full bg-white/10 overflow-hidden">
            <div
              className="h-full bg-gradient-to-r from-[var(--gradient-1)] via-[var(--gradient-2)] to-[var(--gradient-3)] transition-all duration-500"
              style={{ width: `${Math.min(Math.max(overallProgress, 0), 1) * 100}%` }}
            />
          </div>
        </div>

        <div className="flex flex-wrap items-center gap-2 text-[0.7rem] text-muted-foreground">
          <div className="inline-flex items-center gap-1.5 rounded-full bg-white/10 px-2.5 py-1 font-medium backdrop-blur">
            <Target className="h-3.5 w-3.5 text-primary" />
            <span>{emphasisLabel[step.emphasis]}</span>
          </div>
          <span className="text-muted-foreground/80">Scroll to watch your visibility climb.</span>
        </div>

      </div>
    </Card>
  )
}




type TagChipProps = {
  emphasis: MatchEmphasis
}

function TagChip({ emphasis }: TagChipProps) {
  const labels: Record<MatchEmphasis, string> = {
    match: "Stay visible",
    expand: "Sell impact",
    skillmap: "Know the gap",
    result: "Ship the kit",
  }

  const colorClasses: Record<MatchEmphasis, string> = {
    match: "bg-emerald-400/10 text-emerald-400",
    expand: "bg-sky-400/10 text-sky-400",
    skillmap: "bg-amber-400/10 text-amber-400",
    result: "bg-violet-400/10 text-violet-400",
  }

  return (
    <span
      className={cn(
        "inline-flex items-center rounded-full px-2.5 py-1 text-[0.68rem] font-semibold uppercase tracking-[0.18em]",
        colorClasses[emphasis],
      )}
    >
      {labels[emphasis]}
    </span>
  )
}

export default MatchJourneySection
