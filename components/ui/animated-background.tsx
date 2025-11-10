"use client"

import { useEffect, useRef, useState } from "react"
import { useTheme } from "next-themes"
import { usePageLoading } from "@/hooks/use-page-loading"

interface AnimatedBackgroundProps {
  className?: string
  intensity?: number
}

export function AnimatedBackground({ className = "", intensity = 0.15 }: AnimatedBackgroundProps) {
  const ref = useRef<HTMLDivElement | null>(null)
  const { theme } = useTheme()
  const { isInitialLoading } = usePageLoading()
  const [mounted, setMounted] = useState(false)
  const [shouldRender, setShouldRender] = useState(false)

  // Theme colors
  const isLightTheme = theme === "light"
  const r = isLightTheme ? 99 : 249
  const g = isLightTheme ? 102 : 115
  const b = isLightTheme ? 241 : 22

  useEffect(() => {
    setMounted(true)
    let rafId = 0
    let pending = false
    let lastX = 50
    let lastY = 50
    let mouseMoved = false

    const apply = () => {
      pending = false
      const el = ref.current
      if (!el) return
      el.style.setProperty("--x", `${lastX}%`)
      el.style.setProperty("--y", `${lastY}%`)
    }

    const onPointerMove = (e: PointerEvent) => {
      const x = (e.clientX / window.innerWidth) * 100
      const y = (e.clientY / window.innerHeight) * 100
      lastX = x
      lastY = y
      mouseMoved = true
      if (!pending) {
        pending = true
        rafId = window.requestAnimationFrame(apply)
      }
    }

    window.addEventListener("pointermove", onPointerMove, { passive: true })

    const delayTimer = window.setTimeout(() => {
      if (!mouseMoved) {
        lastX = 50
        lastY = 50
        apply()
      }
      setShouldRender(true)
    }, 300)

    return () => {
      window.removeEventListener("pointermove", onPointerMove)
      window.cancelAnimationFrame(rafId)
      window.clearTimeout(delayTimer)
    }
  }, [])

  if (!mounted || isInitialLoading || !shouldRender) return null

  const isFixed = className.includes("fixed")

  return (
    <div
      ref={ref}
      className={`inset-0 pointer-events-none ${className}`}
      style={{
        position: isFixed ? "fixed" : "absolute",
        zIndex: 0,
        background: `radial-gradient(circle at var(--x, 50%) var(--y, 50%), rgba(${r}, ${g}, ${b}, ${intensity}) 0%, transparent 60%)`,
        transition: "background 0.1s ease-out",
        willChange: "background",
        contain: "paint",
      }}
    />
  )
}
