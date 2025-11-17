export const clamp = (value: number, min = 0, max = 1) => Math.min(max, Math.max(min, value))

export const easeOutCubic = (t: number) => 1 - Math.pow(1 - t, 3)

