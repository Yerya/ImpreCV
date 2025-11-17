import { useEffect, useRef, useState } from "react"
import { clamp } from "@/lib/math"

type TimelineBounds = {
  top: number
  height: number
}

type UseMatchJourneyParams = {
  stepsCount: number
}

export function useMatchJourney({ stepsCount }: UseMatchJourneyParams) {
  const stepsWrapperRef = useRef<HTMLDivElement | null>(null)
  const stickyPanelRef = useRef<HTMLDivElement | null>(null)
  const headingRef = useRef<HTMLDivElement | null>(null)
  const cardRefs = useRef<(HTMLDivElement | null)[]>([])
  const timelineRef = useRef<HTMLDivElement | null>(null)

  const [progress, setProgress] = useState(0)
  const [activeIndex, setActiveIndex] = useState(0)
  const [timelineFill, setTimelineFill] = useState(0)
  const [timelineBounds, setTimelineBounds] = useState<TimelineBounds | null>(null)

  const progressTargetRef = useRef(0)
  const progressRef = useRef(0)
  const activeIndexRef = useRef(0)
  const timelineFillRef = useRef(0)

  const segments = Math.max(stepsCount - 1, 1)

  useEffect(() => {
    const updateTimelineBounds = () => {
      const wrapper = stepsWrapperRef.current
      const cards = cardRefs.current as HTMLDivElement[]
      if (!wrapper || !cards.length || !cards[0]) return

      const wrapperRect = wrapper.getBoundingClientRect()
      const firstRect = cards[0].getBoundingClientRect()
      const lastRect = cards[cards.length - 1].getBoundingClientRect()

      const startWithinWrapper = Math.max(0, firstRect.top - wrapperRect.top - 10)
      const endWithinWrapper = Math.max(startWithinWrapper + 16, lastRect.bottom - wrapperRect.top)
      setTimelineBounds({ top: startWithinWrapper, height: endWithinWrapper - startWithinWrapper })
    }

    const rafId = requestAnimationFrame(updateTimelineBounds)
    return () => {
      cancelAnimationFrame(rafId)
    }
  }, [])

  useEffect(() => {
    let rafId = 0
    const handleScroll = () => {
      cancelAnimationFrame(rafId)
      rafId = requestAnimationFrame(() => {
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

        const cards = cardRefs.current as HTMLDivElement[]
        if (!cards.length || !cards[0]) return

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
        const activeCard = cardRefs.current[activeIndexRef.current] as HTMLDivElement | null
        if (timelineEl && activeCard) {
          const lineRect = timelineEl.getBoundingClientRect()
          const cardRect = activeCard.getBoundingClientRect()
          const fillRatio = clamp((cardRect.bottom + 12 - lineRect.top) / lineRect.height, 0, 1)
          timelineFillRef.current = fillRatio
        }
      })
    }

    handleScroll()
    window.addEventListener("scroll", handleScroll, { passive: true })
    return () => {
      window.removeEventListener("scroll", handleScroll)
      cancelAnimationFrame(rafId)
    }
  }, [])

  useEffect(() => {
    let rafId = 0
    const tick = () => {
      const target = progressTargetRef.current
      const current = progressRef.current
      const delta = target - current

      if (Math.abs(delta) >= 0.001) {
        const segmentUnit = 1 / segments
        const maxStep = segmentUnit * 0.03
        const step = Math.sign(delta) * Math.min(Math.abs(delta), maxStep)
        progressRef.current = current + step
      }

      // Push to React state less frequently to avoid excessive re-renders.
      setProgress(progressRef.current)
      setTimelineFill(timelineFillRef.current)

      rafId = requestAnimationFrame(tick)
    }
    rafId = requestAnimationFrame(tick)
    return () => cancelAnimationFrame(rafId)
  }, [segments])

  return {
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
  }
}
