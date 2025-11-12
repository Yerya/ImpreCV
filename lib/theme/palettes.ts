export type PaletteName = "blue" | "raspberry" | "emerald" | "violet" | "orange"

type RGB = [number, number, number]

export interface PaletteDefinition {
  name: PaletteName
  // Circle glow color (same for both themes unless specified otherwise)
  accent: RGB
  // Gradient stops for text in light/dark
  gradientLight: [string, string, string]
  gradientDark: [string, string, string]
}

export const PALETTES: Record<PaletteName, PaletteDefinition> = {
  blue: {
    name: "blue",
    // r,g,b as per request (same for light/dark)
    accent: [99, 102, 241],
    // Light gradient
    gradientLight: ["#ec4899", "#8b5cf6", "#6366f1"],
    // Dark: align with same bluish/pink gradient to match circle
    gradientDark: ["#6366f1", "#8b5cf6", "#ec4899"],
  },
  raspberry: {
    name: "raspberry",
    accent: [255, 120, 165],
    gradientLight: ["#a855f7", "#ec4899", "#f472b6"],
    gradientDark: ["#f472b6", "#ec4899", "#a855f7"],
  },
  emerald: {
    name: "emerald",
    accent: [52, 211, 153],
    gradientLight: ["#06b6d4", "#22c55e", "#22c55e"],
    gradientDark: ["#22c55e", "#22c55e", "#06b6d4"],
  },
  violet: {
    name: "violet",
    accent: [168, 85, 247],
    gradientLight: ["#ec4899", "#a855f7", "#a855f7"],
    gradientDark: ["#a855f7", "#ec4899", "#ec4899"],
  },
  orange: {
    name: "orange",
    accent: [249, 115, 22],
    gradientLight: ["#ef4444", "#f97316", "#fbbf24"],
    gradientDark: ["#fbbf24", "#f97316", "#ef4444"],
  },
}

export const DEFAULT_LIGHT: PaletteName = "blue"
export const DEFAULT_DARK: PaletteName = "blue"
