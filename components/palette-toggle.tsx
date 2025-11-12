"use client"

import * as React from "react"
import { useTheme } from "next-themes"
import { Paintbrush } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover"
import { useAppDispatch, useAppSelector } from "@/lib/redux/hooks"
import { setPaletteForTheme } from "@/features/app/appSlice"
import { PALETTES, type PaletteName } from "@/lib/theme/palettes"

const OPTIONS: { value: PaletteName; label: string }[] = [
  { value: "blue", label: "Blue" },
  { value: "raspberry", label: "Raspberry" },
  { value: "emerald", label: "Emerald" },
  { value: "violet", label: "Violet" },
  { value: "orange", label: "Orange" },
]

export function PaletteToggle() {
  const dispatch = useAppDispatch()
  const { resolvedTheme } = useTheme()
  const paletteLight = useAppSelector((s) => s.app.paletteLight)
  const paletteDark = useAppSelector((s) => s.app.paletteDark)

  const theme: "light" | "dark" = resolvedTheme === "dark" ? "dark" : "light"
  const current = theme === "dark" ? paletteDark : paletteLight

  const handleChange = (p: PaletteName) => {
    dispatch(setPaletteForTheme({ theme, palette: p }))
  }

  const chip = (p: PaletteName) => {
    const { gradientLight } = PALETTES[p]
    const [c1, c2, c3] = gradientLight
    return (
      <span
        aria-hidden
        className="inline-block h-3 w-6 rounded"
        style={{ background: `linear-gradient(90deg, ${c1}, ${c2}, ${c3})` }}
      />
    )
  }

  return (
    <Popover>
      <PopoverTrigger asChild>
        <Button variant="ghost" size="icon" aria-label="Toggle palette">
          <Paintbrush className="h-5 w-5" />
        </Button>
      </PopoverTrigger>
      <PopoverContent
        variant="glass"
        side="bottom"
        align="center"
        sideOffset={8}
        collisionPadding={16}
        className="w-[min(92vw,20rem)] md:w-56 p-2"
      >
        <div className="px-1.5 pb-2 pt-1">
          <div className="text-xs font-medium text-muted-foreground mb-2">
            {theme === "dark" ? "Dark Palette" : "Light Palette"}
          </div>
          <div className="flex flex-col gap-1">
            {OPTIONS.map((opt) => (
              <button
                key={opt.value}
                onClick={() => handleChange(opt.value)}
                className={`glass-row flex items-center justify-between w-full rounded-md px-2 py-1.5 text-sm ${
                  current === opt.value ? "glass-row--selected" : ""
                }`}
              >
                <span>{opt.label}</span>
                <span className="flex items-center gap-2">
                  {chip(opt.value)}
                  {current === opt.value ? (
                    <span className="text-xs text-muted-foreground">Selected</span>
                  ) : null}
                </span>
              </button>
            ))}
          </div>
        </div>
      </PopoverContent>
    </Popover>
  )
}
