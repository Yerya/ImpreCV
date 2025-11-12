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
    gradientLight: ["#6366f1", "#8b5cf6", "#ec4899"],
    // Dark: align with same bluish/pink gradient to match circle
    gradientDark: ["#6366f1", "#8b5cf6", "#ec4899"],
  },
  raspberry: {
    name: "raspberry",
    accent: [255, 120, 165],
    gradientLight: ["#f472b6", "#ec4899", "#a855f7"],
    gradientDark: ["#f9a8d4", "#d946ef", "#818cf8"],
  },
  emerald: {
    name: "emerald",
    accent: [52, 211, 153],
    gradientLight: ["#22c55e", "#10b981", "#14b8a6"],
    gradientDark: ["#22c55e", "#10b981", "#14b8a6"],
  },
  violet: {
    name: "violet",
    accent: [168, 85, 247],
    gradientLight: ["#a855f7", "#c084fc", "#ec4899"],
    gradientDark: ["#a855f7", "#c084fc", "#ec4899"],
  },
  orange: {
    name: "orange",
    // Use the original orange accent 249,115,22 (#f97316)
    accent: [249, 115, 22],
    // Keep a consistent 3-stop format across themes
    gradientLight: ["#fbbf24", "#f97316", "#ef4444"],
    gradientDark: ["#fbbf24", "#f97316", "#ef4444"],
  },
}

export const DEFAULT_LIGHT: PaletteName = "blue"
export const DEFAULT_DARK: PaletteName = "blue"
