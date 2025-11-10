"use client"

import * as React from "react"
import { type InViewVariant, buildStyle, defaultDurationMs, easings } from "@/lib/animation/variants"
import { cn } from "@/lib/utils"

type ElementTag = keyof React.JSX.IntrinsicElements

export type AnimateInProps<T extends ElementTag = "div"> = {
  as?: T
  variant?: InViewVariant
  once?: boolean
  threshold?: number | number[]
  margin?: string
  delayMs?: number
  durationMs?: number
  ease?: string
  entrance?: "bubble" | "none"
  className?: string
  children?: React.ReactNode
  onInViewChange?: (inView: boolean) => void
} & Omit<React.JSX.IntrinsicElements[T], "ref" | "className"> & {
  className?: string
}

export function AnimateIn<T extends ElementTag = "div">(props: AnimateInProps<T>) {
  const {
    as,
    variant = "fadeUp",
    once = true,
    threshold = 0.2,
    margin = "0px 0px -10% 0px",
    delayMs = 0,
    durationMs = defaultDurationMs,
    ease = easings.springOut,
    entrance = "none",
    className,
    children,
    onInViewChange,
    ...rest
  } = props as AnimateInProps

  const Tag = (as || "div") as any
  const ref = React.useRef<HTMLElement | null>(null)
  const [inView, setInView] = React.useState(false)
  const mounted = React.useRef(false)

  React.useEffect(() => {
    mounted.current = true
    if (!ref.current) return
    if (typeof window === "undefined") return
    if ("IntersectionObserver" in window === false) {
      setInView(true)
      return
    }

    const el = ref.current
    const observer = new IntersectionObserver(
      (entries) => {
        entries.forEach((entry) => {
          const isIntersecting = entry.isIntersecting || entry.intersectionRatio > 0
          if (isIntersecting) {
            setInView(true)
            onInViewChange?.(true)
            if (once) observer.unobserve(entry.target)
          } else if (!once) {
            setInView(false)
            onInViewChange?.(false)
          }
        })
      },
      { root: null, rootMargin: margin, threshold },
    )

    observer.observe(el)
    return () => observer.disconnect()
  }, [threshold, margin, once, onInViewChange])

  const style = {
    ...buildStyle(variant, { delayMs, durationMs, ease }),
  } as React.CSSProperties

  return (
    <Tag
      ref={ref}
      data-animate={variant}
      data-inview={inView ? "true" : "false"}
      data-entrance={entrance === "bubble" ? "bubble" : undefined}
      className={cn(
        "transition-all will-change-transform transform-gpu",
        // Tailwind defaults to ~150ms; we mostly control timing via CSS vars,
        // but these utilities enable tap/hover smoothness on children.
        "duration-700 ease-out",
        className,
      )}
      style={style}
      {...(rest as any)}
    >
      {children}
    </Tag>
  )
}

export default AnimateIn

