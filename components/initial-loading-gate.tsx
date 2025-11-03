"use client"

import { useEffect } from "react"
import { Sparkles } from "lucide-react"
import { useAppDispatch, useAppSelector } from "@/lib/redux/hooks"
import { setInitialLoading } from "@/features/app/appSlice"

export default function InitialLoadingGate({ children }: { children: React.ReactNode }) {
  const dispatch = useAppDispatch()
  const isInitialLoading = useAppSelector((s) => s.app.isInitialLoading)

  useEffect(() => {
    const timer = setTimeout(() => {
      dispatch(setInitialLoading(false))
    }, 800)
    return () => clearTimeout(timer)
  }, [dispatch])

  if (isInitialLoading) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <div className="flex items-center gap-2">
          <Sparkles className="h-6 w-6 animate-spin text-primary" />
          <span className="text-muted-foreground">Loading...</span>
        </div>
      </div>
    )
  }

  return <>{children}</>
}



