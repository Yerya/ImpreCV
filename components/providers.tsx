"use client"

import type React from "react"
import { Provider } from "react-redux"
import { store } from "@/lib/redux/store"
import { ThemeProvider } from "@/components/theme-provider"
import AuthSync from "@/components/auth-sync"
import InitialLoadingGate from "@/components/initial-loading-gate"
import PaletteSync from "@/components/palette-sync"
import UiScaleSync from "@/components/ui-scale-sync"

export function Providers({ children }: { children: React.ReactNode }) {
  return (
    <ThemeProvider attribute="class" defaultTheme="system" enableSystem storageKey="imprecv-theme">
      <Provider store={store}>
        <AuthSync />
        <PaletteSync />
        <UiScaleSync />
        <InitialLoadingGate>
          {children}
        </InitialLoadingGate>
      </Provider>
    </ThemeProvider>
  )
}



