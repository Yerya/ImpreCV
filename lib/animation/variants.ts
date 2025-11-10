import type React from "react"

export type InViewVariant =
  | "fadeUp"
  | "fadeIn"
  | "slideInLeft"
  | "slideInRight"
  | "zoomIn"

export type CSSVars = React.CSSProperties & {
  [key: string]: string | number | undefined
}

export const easings = {
  springOut: "cubic-bezier(0.22, 1, 0.36, 1)",
  springOvershoot: "cubic-bezier(0.34, 1.56, 0.64, 1)",
  standard: "cubic-bezier(0.2, 0.65, 0.3, 1.0)",
}

export const defaultDurationMs = 700

export const variantVars: Record<InViewVariant, CSSVars> = {
  fadeUp: {
    ['--y' as any]: '16px',
  },
  fadeIn: {},
  slideInLeft: {
    ['--x' as any]: '-20px',
  },
  slideInRight: {
    ['--x' as any]: '20px',
  },
  zoomIn: {
    ['--scale' as any]: 0.96,
  },
}

export function buildStyle(
  variant: InViewVariant,
  options?: {
    delayMs?: number
    durationMs?: number
    ease?: string
  },
): CSSVars {
  const base = variantVars[variant] || {}
  return {
    ...base,
    ['--anim-delay' as any]: `${options?.delayMs ?? 0}ms`,
    ['--anim-duration' as any]: `${options?.durationMs ?? defaultDurationMs}ms`,
    ['--ease' as any]: options?.ease ?? easings.springOut,
  }
}
