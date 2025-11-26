"use client"

import { Card } from "@/components/ui/card"
import { Skeleton } from "@/components/ui/skeleton"

export default function LoginSkeleton() {
  return (
    <div className="min-h-screen flex items-center justify-center p-4 relative">
      <div className="absolute top-4 right-4 z-20">
        <Skeleton className="h-10 w-10 rounded-full" />
      </div>
      <div className="w-full max-w-md relative z-10">
        <div className="mb-8">
          <Skeleton className="h-4 w-28 mb-2 rounded-md" />
          <Skeleton className="h-5 w-40 rounded-md" />
        </div>

        <Card className="glass-card p-8 relative z-10">
          <div className="flex items-center gap-2 mb-8">
            <Skeleton className="h-9 w-9 rounded-xl" />
            <Skeleton className="h-7 w-28 rounded-md" />
          </div>
          <div className="mb-8 space-y-2">
            <Skeleton className="h-8 w-48 rounded-md" />
            <Skeleton className="h-4 w-64 rounded-md" />
          </div>
          <div className="space-y-6">
            <div className="space-y-2">
              <Skeleton className="h-4 w-16 rounded-sm" />
              <Skeleton className="h-10 w-full rounded-md" />
            </div>
            <div className="space-y-2">
              <Skeleton className="h-4 w-20 rounded-sm" />
              <Skeleton className="h-10 w-full rounded-md" />
            </div>
            <Skeleton className="h-10 w-full rounded-md" />
          </div>
          <div className="mt-6 text-center">
            <Skeleton className="h-4 w-48 mx-auto rounded-sm" />
          </div>
        </Card>
      </div>
    </div>
  )
}
