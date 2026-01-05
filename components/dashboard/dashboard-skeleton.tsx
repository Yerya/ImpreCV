"use client"

import { Skeleton } from "@/components/ui/skeleton"
import { GlobalHeader } from "@/components/global-header"
import { MobileBottomNav } from "@/components/mobile-bottom-nav"

export function DashboardSkeleton() {
  return (
    <div className="min-h-screen relative pb-20">
      <GlobalHeader variant="dashboard" />

      <div className="container mx-auto px-4 py-8 relative z-10 max-w-6xl">
        {/* Welcome Section */}
        <div className="mb-8">
          <Skeleton className="h-10 w-80 mb-2 rounded-lg" />
          <Skeleton className="h-5 w-64 rounded-md" />
        </div>

        {/* Content placeholder */}
        <div className="space-y-6">
          <Skeleton className="h-12 w-48 rounded-xl" />
          <Skeleton className="h-64 w-full rounded-xl" />
          <Skeleton className="h-48 w-full rounded-xl" />
        </div>
      </div>

      <MobileBottomNav />
    </div>
  )
}
