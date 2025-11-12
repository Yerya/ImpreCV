"use client"

import type React from "react"
import { Provider } from "react-redux"
import { store } from "@/lib/redux/store"
import { ThemeProvider } from "@/components/theme-provider"
import AuthSync from "@/components/auth-sync"
import InitialLoadingGate from "@/components/initial-loading-gate"
import PaletteSync from "@/components/palette-sync"

export function Providers({ children }: { children: React.ReactNode }) {
  return (
    <ThemeProvider attribute="class" defaultTheme="dark" enableSystem storageKey="cvify-theme">
      <Provider store={store}>
        <AuthSync />
        <PaletteSync />
        <InitialLoadingGate>
          {children}
        </InitialLoadingGate>
      </Provider>
    </ThemeProvider>
  )
}



