"use client"

import { useEffect } from "react"
import { useTheme } from "next-themes"
import { useAppDispatch, useAppSelector } from "@/lib/redux/hooks"
import { hydratePalettes } from "@/features/app/appSlice"
import { PALETTES, type PaletteName } from "@/lib/theme/palettes"

const LS_LIGHT = "imprecv-palette-light"
const LS_DARK = "imprecv-palette-dark"

function isPaletteName(v: unknown): v is PaletteName {
  return typeof v === "string" && (v in PALETTES)
}

export default function PaletteSync() {
  const dispatch = useAppDispatch()
  const { resolvedTheme } = useTheme()
  const paletteLight = useAppSelector((s) => s.app.paletteLight)
  const paletteDark = useAppSelector((s) => s.app.paletteDark)

  // Hydrate from localStorage once
  useEffect(() => {
    try {
      const light = typeof window !== "undefined" ? localStorage.getItem(LS_LIGHT) : null
      const dark = typeof window !== "undefined" ? localStorage.getItem(LS_DARK) : null
      dispatch(
        hydratePalettes({
          paletteLight: isPaletteName(light) ? light : undefined,
          paletteDark: isPaletteName(dark) ? dark : undefined,
        })
      )
    } catch {}
  }, [dispatch])

  // Persist to localStorage when values change
  useEffect(() => {
    try {
      if (paletteLight) localStorage.setItem(LS_LIGHT, paletteLight)
      if (paletteDark) localStorage.setItem(LS_DARK, paletteDark)
    } catch {}
  }, [paletteLight, paletteDark])

  // Apply CSS variables based on currently resolved theme
  useEffect(() => {
    const theme = resolvedTheme === "dark" ? "dark" : "light"
    const activeName = theme === "dark" ? paletteDark : paletteLight
    const active = PALETTES[activeName]
    const root = document.documentElement

    root.style.setProperty("--accent-r", String(active.accent[0]))
    root.style.setProperty("--accent-g", String(active.accent[1]))
    root.style.setProperty("--accent-b", String(active.accent[2]))

    const [g1, g2, g3] = theme === "dark" ? active.gradientDark : active.gradientLight
    root.style.setProperty("--gradient-1", g1)
    root.style.setProperty("--gradient-2", g2)
    root.style.setProperty("--gradient-3", g3)
  }, [resolvedTheme, paletteLight, paletteDark])

  return null
}
