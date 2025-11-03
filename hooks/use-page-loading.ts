"use client"

import { useAppSelector } from "@/lib/redux/hooks"

export function usePageLoading() {
  const isInitialLoading = useAppSelector((s) => s.app.isInitialLoading)
  return { isInitialLoading }
}