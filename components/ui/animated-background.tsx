"use client"

import { useEffect, useState } from "react"
import { useTheme } from "next-themes"

interface AnimatedBackgroundProps {
  className?: string
  intensity?: number
}

export function AnimatedBackground({ className = "", intensity = 0.15 }: AnimatedBackgroundProps) {
  const [mousePosition, setMousePosition] = useState({ x: 50, y: 50 })
  const { theme } = useTheme()
  const [mounted, setMounted] = useState(false)

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
    }

    window.addEventListener("mousemove", handleMouseMove)
    return () => window.removeEventListener("mousemove", handleMouseMove)
  }, [])

  if (!mounted) {
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

