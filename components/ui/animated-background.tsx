"use client"

import { useEffect, useRef, useState, useCallback } from "react"
import { usePageLoading } from "@/hooks/use-page-loading"

interface AnimatedBackgroundProps {
  className?: string
  intensity?: number
}

const MOBILE_BREAKPOINT = 768

export function AnimatedBackground({ className = "", intensity = 0.15 }: AnimatedBackgroundProps) {
  const ref = useRef<HTMLDivElement | null>(null)
  const { isInitialLoading } = usePageLoading()
  const [mounted, setMounted] = useState(false)
  const [shouldRender, setShouldRender] = useState(false)
  const [isMobile, setIsMobile] = useState(false)

  const checkMobile = useCallback(() => {
    return window.innerWidth < MOBILE_BREAKPOINT
  }, [])

  useEffect(() => {
    setMounted(true)
    const mobile = checkMobile()
    setIsMobile(mobile)

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
      if (checkMobile()) return
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

    const onResize = () => {
      const nowMobile = checkMobile()
      setIsMobile(nowMobile)
      if (nowMobile) {
        lastX = 50
        lastY = 50
        apply()
      }
    }

    if (!mobile) {
      window.addEventListener("pointermove", onPointerMove, { passive: true })
    }
    window.addEventListener("resize", onResize, { passive: true })

    const delayTimer = window.setTimeout(() => {
      if (!mouseMoved || mobile) {
        lastX = 50
        lastY = 50
        apply()
      }
      setShouldRender(true)
    }, 300)

    return () => {
      window.removeEventListener("pointermove", onPointerMove)
      window.removeEventListener("resize", onResize)
      window.cancelAnimationFrame(rafId)
      window.clearTimeout(delayTimer)
    }
  }, [checkMobile])

  if (!mounted || isInitialLoading || !shouldRender) return null

  const isFixed = className.includes("fixed")

  return (
    <div
      ref={ref}
      className={`inset-0 pointer-events-none ${className}`}
      style={{
        position: isFixed ? "fixed" : "absolute",
        zIndex: 0,
        background: `radial-gradient(circle at var(--x, 50%) var(--y, 50%), rgba(var(--accent-r), var(--accent-g), var(--accent-b), ${intensity}) 0%, transparent 60%)`,
        transition: "background 0.1s ease-out",
        willChange: "background",
        contain: "paint",
      }}
    />
  )
}
