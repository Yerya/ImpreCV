"use client"

import { Skeleton } from "@/components/ui/skeleton"
import { Card } from "@/components/ui/card"

interface ResumeEditorSkeletonProps {
    variant?: 'mobile' | 'desktop'
}

export function ResumeEditorSkeleton({ variant = 'desktop' }: ResumeEditorSkeletonProps) {
    if (variant === 'mobile') {
        return <MobileResumeEditorSkeleton />
    }
    return <DesktopResumeEditorSkeleton />
}

function MobileResumeEditorSkeleton() {
    return (
        <div className="h-screen flex flex-col overflow-hidden">
            {/* Header Skeleton */}
            <div className="sticky top-0 left-0 right-0 z-50 w-full">
                <div className="h-16 w-full max-w-screen-2xl mx-auto rounded-b-[40px] border-b border-border/40 bg-background/80 backdrop-blur-md flex items-center justify-between px-4">
                    <div className="flex items-center gap-2">
                        <Skeleton className="h-8 w-8 rounded-lg" />
                        <Skeleton className="h-5 w-16 rounded-md" />
                    </div>
                    <div className="flex items-center gap-4">
                        <Skeleton className="h-8 w-8 rounded-full" />
                    </div>
                </div>
            </div>

            {/* Title */}
            <div className="px-4 pt-3 pb-2">
                <Skeleton className="h-6 w-32 rounded-md mb-1" />
                <Skeleton className="h-3 w-48 rounded-sm" />
            </div>

            {/* Tabs */}
            <div className="px-4 pb-2">
                <Skeleton className="h-10 w-full rounded-md" />
            </div>

            {/* Preview/Edit toggle + buttons */}
            <div className="px-4 pb-2 flex items-center gap-2">
                <Skeleton className="flex-1 h-10 rounded-lg" />
                <Skeleton className="h-8 w-8 rounded-md" />
                <Skeleton className="h-8 w-8 rounded-md" />
            </div>

            {/* Main content - Resume preview area */}
            <div className="flex-1 px-4 pb-20 overflow-hidden">
                <Card className="glass-card h-full p-4">
                    {/* A4-like skeleton for resume */}
                    <div className="w-full h-full flex flex-col gap-3">
                        {/* Header section */}
                        <div className="flex flex-col items-center gap-2 pb-3 border-b border-border/30">
                            <Skeleton className="h-6 w-40 rounded-md" />
                            <Skeleton className="h-3 w-56 rounded-sm" />
                            <Skeleton className="h-3 w-48 rounded-sm" />
                        </div>
                        {/* Content sections */}
                        <div className="space-y-4 flex-1">
                            <div className="space-y-2">
                                <Skeleton className="h-4 w-24 rounded-sm" />
                                <Skeleton className="h-3 w-full rounded-sm" />
                                <Skeleton className="h-3 w-11/12 rounded-sm" />
                                <Skeleton className="h-3 w-10/12 rounded-sm" />
                            </div>
                            <div className="space-y-2">
                                <Skeleton className="h-4 w-20 rounded-sm" />
                                <Skeleton className="h-3 w-full rounded-sm" />
                                <Skeleton className="h-3 w-full rounded-sm" />
                                <Skeleton className="h-3 w-9/12 rounded-sm" />
                            </div>
                            <div className="space-y-2">
                                <Skeleton className="h-4 w-28 rounded-sm" />
                                <Skeleton className="h-3 w-full rounded-sm" />
                                <Skeleton className="h-3 w-11/12 rounded-sm" />
                            </div>
                        </div>
                    </div>
                </Card>
            </div>

            {/* Bottom action bar */}
            <div className="fixed bottom-0 left-0 right-0 z-40 px-4 py-3 bg-background/80 backdrop-blur-md border-t border-border/40">
                <div className="flex items-center justify-between gap-3">
                    <Skeleton className="h-10 w-20 rounded-md" />
                    <div className="flex gap-2">
                        <Skeleton className="h-10 w-20 rounded-md" />
                        <Skeleton className="h-10 w-24 rounded-md" />
                    </div>
                </div>
            </div>
        </div>
    )
}

function DesktopResumeEditorSkeleton() {
    return (
        <div className="min-h-screen relative pb-20">
            {/* Header Skeleton */}
            <div className="sticky top-0 left-0 right-0 z-50 w-full">
                <div className="h-16 w-full max-w-screen-2xl mx-auto rounded-b-[40px] border-b border-border/40 bg-background/80 backdrop-blur-md flex items-center justify-between px-4">
                    <div className="flex items-center gap-2">
                        <Skeleton className="h-8 w-8 rounded-lg" />
                        <Skeleton className="h-5 w-16 rounded-md" />
                    </div>
                    <div className="flex items-center gap-4">
                        <Skeleton className="h-9 w-24 rounded-md" />
                        <Skeleton className="h-8 w-8 rounded-full" />
                    </div>
                </div>
            </div>

            <div className="container mx-auto px-4 py-4 max-w-7xl">
                {/* Title section */}
                <div className="mb-4">
                    <Skeleton className="h-9 w-64 rounded-lg mb-1" />
                    <Skeleton className="h-4 w-96 rounded-md" />
                </div>

                {/* Sticky toolbar */}
                <div className="sticky top-16 z-20 -mx-4 px-4 py-3 mb-4">
                    <div className="flex items-center justify-between gap-4 flex-wrap">
                        <div className="flex items-center gap-3">
                            <Skeleton className="h-10 w-72 rounded-md" />
                            <Skeleton className="h-10 w-20 rounded-md" />
                        </div>
                        <div className="flex items-center gap-2">
                            <Skeleton className="h-10 w-20 rounded-md" />
                            <Skeleton className="h-10 w-20 rounded-md" />
                            <Skeleton className="h-10 w-28 rounded-md" />
                        </div>
                    </div>
                </div>

                {/* Main content area */}
                <div className="grid xl:grid-cols-[minmax(0,1fr)_300px] gap-6 items-start justify-items-center xl:justify-items-start">
                    {/* Resume preview */}
                    <Card
                        className="glass-card p-4 md:p-6 w-full"
                        style={{ maxWidth: 'calc(210mm + 3rem)', minWidth: 'min(100%, calc(210mm + 3rem))' }}
                    >
                        <div className="w-full flex justify-center">
                            {/* A4-like skeleton for resume */}
                            <div className="w-full max-w-[210mm] aspect-[210/297] bg-background rounded-lg border border-border/30 p-8 space-y-6">
                                {/* Header section */}
                                <div className="flex flex-col items-center gap-3 pb-4 border-b border-border/30">
                                    <Skeleton className="h-8 w-48 rounded-md" />
                                    <Skeleton className="h-4 w-72 rounded-sm" />
                                    <Skeleton className="h-3 w-64 rounded-sm" />
                                </div>
                                {/* Content sections */}
                                <div className="space-y-6">
                                    <div className="space-y-2">
                                        <Skeleton className="h-5 w-32 rounded-sm" />
                                        <Skeleton className="h-3 w-full rounded-sm" />
                                        <Skeleton className="h-3 w-full rounded-sm" />
                                        <Skeleton className="h-3 w-11/12 rounded-sm" />
                                        <Skeleton className="h-3 w-10/12 rounded-sm" />
                                    </div>
                                    <div className="space-y-2">
                                        <Skeleton className="h-5 w-28 rounded-sm" />
                                        <div className="space-y-3">
                                            <div className="space-y-1">
                                                <Skeleton className="h-4 w-48 rounded-sm" />
                                                <Skeleton className="h-3 w-36 rounded-sm" />
                                                <Skeleton className="h-3 w-full rounded-sm" />
                                                <Skeleton className="h-3 w-full rounded-sm" />
                                            </div>
                                            <div className="space-y-1">
                                                <Skeleton className="h-4 w-52 rounded-sm" />
                                                <Skeleton className="h-3 w-40 rounded-sm" />
                                                <Skeleton className="h-3 w-full rounded-sm" />
                                                <Skeleton className="h-3 w-11/12 rounded-sm" />
                                            </div>
                                        </div>
                                    </div>
                                    <div className="space-y-2">
                                        <Skeleton className="h-5 w-24 rounded-sm" />
                                        <div className="flex flex-wrap gap-2">
                                            <Skeleton className="h-6 w-16 rounded-full" />
                                            <Skeleton className="h-6 w-20 rounded-full" />
                                            <Skeleton className="h-6 w-14 rounded-full" />
                                            <Skeleton className="h-6 w-18 rounded-full" />
                                            <Skeleton className="h-6 w-16 rounded-full" />
                                        </div>
                                    </div>
                                </div>
                            </div>
                        </div>
                    </Card>

                    {/* Sidebar */}
                    <div className="hidden xl:block sticky top-[136px] w-full">
                        <Card className="glass-card p-4 space-y-4">
                            <div className="flex items-center justify-between">
                                <Skeleton className="h-5 w-32 rounded-md" />
                                <Skeleton className="h-5 w-16 rounded-md" />
                            </div>
                            <div className="space-y-3">
                                {[1, 2, 3].map((i) => (
                                    <div key={i} className="flex items-center gap-3 p-2 rounded-lg border border-border/30">
                                        <Skeleton className="h-10 w-10 rounded-md shrink-0" />
                                        <div className="flex-1 space-y-1">
                                            <Skeleton className="h-4 w-24 rounded-sm" />
                                            <Skeleton className="h-3 w-16 rounded-sm" />
                                        </div>
                                        <Skeleton className="h-8 w-8 rounded-md" />
                                    </div>
                                ))}
                            </div>
                        </Card>
                    </div>
                </div>
            </div>
        </div>
    )
}
