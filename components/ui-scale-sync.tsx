"use client"

import { useEffect } from "react"
import { useAppDispatch, useAppSelector } from "@/lib/redux/hooks"
import { hydrateUiScale, type UiScale } from "@/features/app/appSlice"

const LS_UI_SCALE = "imprecv-ui-scale"

function isUiScale(value: unknown): value is UiScale {
  return value === "small" || value === "medium" || value === "large"
}

function getScaleFactor(scale: UiScale): number {
  switch (scale) {
    case "small":
      return 0.95
    case "large":
      return 1.1
    case "medium":
    default:
      return 1
  }
}

export default function UiScaleSync() {
  const dispatch = useAppDispatch()
  const uiScale = useAppSelector((s) => s.app.uiScale)

  // Hydrate from localStorage once
  useEffect(() => {
    try {
      const raw = typeof window !== "undefined" ? localStorage.getItem(LS_UI_SCALE) : null
      if (isUiScale(raw)) {
        dispatch(hydrateUiScale(raw))
      }
    } catch {}
  }, [dispatch])

  // Persist when uiScale changes
  useEffect(() => {
    try {
      if (uiScale) {
        localStorage.setItem(LS_UI_SCALE, uiScale)
      }
    } catch {}
  }, [uiScale])

  // Apply CSS variable for scaling
  useEffect(() => {
    const root = document.documentElement
    const factor = getScaleFactor(uiScale)
    root.style.setProperty("--ui-scale", String(factor))
  }, [uiScale])

  return null
}

