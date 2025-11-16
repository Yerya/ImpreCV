"use client"

import { createSlice, PayloadAction } from "@reduxjs/toolkit"
import type { PaletteName } from "@/lib/theme/palettes"

export type UiScale = "small" | "medium" | "large"

interface AppState {
  isInitialLoading: boolean
  paletteLight: PaletteName
  paletteDark: PaletteName
  uiScale: UiScale
}

const initialState: AppState = {
  isInitialLoading: true,
  paletteLight: "blue",
  paletteDark: "emerald",
  uiScale: "medium",
}

const appSlice = createSlice({
  name: "app",
  initialState,
  reducers: {
    setInitialLoading(state, action: PayloadAction<boolean>) {
      state.isInitialLoading = action.payload
    },
    setPaletteForTheme(
      state,
      action: PayloadAction<{ theme: "light" | "dark"; palette: PaletteName }>
    ) {
      const { theme, palette } = action.payload
      if (theme === "light") state.paletteLight = palette
      else state.paletteDark = palette
    },
    hydratePalettes(
      state,
      action: PayloadAction<{ paletteLight?: PaletteName; paletteDark?: PaletteName }>
    ) {
      if (action.payload.paletteLight) state.paletteLight = action.payload.paletteLight
      if (action.payload.paletteDark) state.paletteDark = action.payload.paletteDark
    },
    setUiScale(state, action: PayloadAction<UiScale>) {
      state.uiScale = action.payload
    },
    hydrateUiScale(state, action: PayloadAction<UiScale | undefined>) {
      if (action.payload) {
        state.uiScale = action.payload
      }
    },
  },
})

export const { setInitialLoading, setPaletteForTheme, hydratePalettes, setUiScale, hydrateUiScale } =
  appSlice.actions
export default appSlice.reducer


