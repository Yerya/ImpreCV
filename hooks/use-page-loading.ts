"use client"

import { useLoading } from "@/components/loading-provider"

export function usePageLoading() {
  const { isInitialLoading } = useLoading()

  return { isInitialLoading }
}