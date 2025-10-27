"use client"

import React, { createContext, useContext, useState, useEffect } from "react"
import { Sparkles } from "lucide-react"

interface LoadingContextType {
  isInitialLoading: boolean
}

const LoadingContext = createContext<LoadingContextType | undefined>(undefined)

export function useLoading() {
  const context = useContext(LoadingContext)
  if (context === undefined) {
    throw new Error("useLoading must be used within a LoadingProvider")
  }
  return context
}

interface LoadingProviderProps {
  children: React.ReactNode
}

export function LoadingProvider({ children }: LoadingProviderProps) {
  const [isInitialLoading, setIsInitialLoading] = useState(true)

  useEffect(() => {
    // Показываем лоадинг только при первой загрузке приложения
    const timer = setTimeout(() => {
      setIsInitialLoading(false)
    }, 800) // 800ms для плавного UX

    return () => clearTimeout(timer)
  }, [])

  return (
    <LoadingContext.Provider value={{ isInitialLoading }}>
      {isInitialLoading ? (
        <div className="min-h-screen bg-background flex items-center justify-center">
          <div className="flex items-center gap-2">
            <Sparkles className="h-6 w-6 animate-spin text-primary" />
            <span className="text-muted-foreground">Loading...</span>
          </div>
        </div>
      ) : (
        children
      )}
    </LoadingContext.Provider>
  )
}