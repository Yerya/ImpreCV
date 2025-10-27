"use client"

import { useEffect, useState } from "react"
import { useTheme } from "next-themes"
import { usePageLoading } from "@/hooks/use-page-loading"

interface AnimatedBackgroundProps {
  className?: string
  intensity?: number
}

export function AnimatedBackground({ className = "", intensity = 0.15 }: AnimatedBackgroundProps) {
  const [mousePosition, setMousePosition] = useState({ x: 50, y: 50 })
  const [hasDetectedCursor, setHasDetectedCursor] = useState(false)
  const { theme } = useTheme()
  const [mounted, setMounted] = useState(false)
  const { isInitialLoading } = usePageLoading()

  // Light theme: Blue gradient (#6366f1)
  // Dark theme: Orange gradient (#fbbf24, #f97316, #ef4444)
  const isLightTheme = theme === "light"
  
  // For light theme: use indigo (#6366f1 = rgb(99, 102, 241))
  // For dark theme: use orange (#f97316 = rgb(249, 115, 22))
  const r = isLightTheme ? 99 : 249
  const g = isLightTheme ? 102 : 115
  const b = isLightTheme ? 241 : 22

  useEffect(() => {
    setMounted(true)
    
    const handleMouseMove = (e: MouseEvent) => {
      const x = (e.clientX / window.innerWidth) * 100
      const y = (e.clientY / window.innerHeight) * 100
      setMousePosition({ x, y })
      
      // Устанавливаем флаг, что курсор был обнаружен
      if (!hasDetectedCursor) {
        setHasDetectedCursor(true)
      }
    }

    const handleMouseEnter = () => {
      if (!hasDetectedCursor) {
        setHasDetectedCursor(true)
      }
    }

    const handleMouseOver = () => {
      if (!hasDetectedCursor) {
        setHasDetectedCursor(true)
      }
    }

    // Добавляем обработчики для различных событий мыши
    window.addEventListener("mousemove", handleMouseMove)
    window.addEventListener("mouseenter", handleMouseEnter)
    window.addEventListener("mouseover", handleMouseOver)
    
    // Fallback таймаут - если через 1 секунду курсор так и не был обнаружен,
    // показываем овал в центре экрана
    const fallbackTimer = setTimeout(() => {
      if (!hasDetectedCursor) {
        setHasDetectedCursor(true)
      }
    }, 1000)
    
    return () => {
      window.removeEventListener("mousemove", handleMouseMove)
      window.removeEventListener("mouseenter", handleMouseEnter)
      window.removeEventListener("mouseover", handleMouseOver)
      clearTimeout(fallbackTimer)
    }
  }, [hasDetectedCursor])

  if (!mounted || isInitialLoading || !hasDetectedCursor) {
    return null
  }

  return (
    <div
      className={`inset-0 pointer-events-none ${className}`}
      style={{
        position: className.includes('fixed') ? 'fixed' : 'absolute',
        zIndex: 0,
        background: `radial-gradient(circle at ${mousePosition.x}% ${mousePosition.y}%, rgba(${r}, ${g}, ${b}, ${intensity}) 0%, transparent 60%)`,
        transition: "background 0.1s ease-out",
      }}
    />
  )
}

