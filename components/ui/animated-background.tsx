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
  const [shouldRender, setShouldRender] = useState(false)
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
    
    let mouseMoved = false
    let initialPos = { x: 50, y: 50 }
    
    const handleMouseMove = (e: MouseEvent) => {
      const x = (e.clientX / window.innerWidth) * 100
      const y = (e.clientY / window.innerHeight) * 100
      
      if (!mouseMoved) {
        mouseMoved = true
        initialPos = { x, y }
        setMousePosition({ x, y })
      } else {
        setMousePosition({ x, y })
      }
    }


    window.addEventListener("mousemove", handleMouseMove)
    
    // Задержка для того, чтобы дать мышке время двинуться

    const delayTimer = setTimeout(() => {
      if (!mouseMoved) {
        setMousePosition(initialPos)
      }
      setShouldRender(true)
    }, 500) 
    
    return () => {
      window.removeEventListener("mousemove", handleMouseMove)
      clearTimeout(delayTimer)
    }
  }, []) 

  if (!mounted || isInitialLoading || !shouldRender) {
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

