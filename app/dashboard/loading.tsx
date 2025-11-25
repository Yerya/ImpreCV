import { Skeleton } from "@/components/ui/skeleton"
import { Card } from "@/components/ui/card"

export default function DashboardLoading() {
    return (
        <div className="min-h-screen relative pb-20">
            {/* Header Skeleton */}
            <div className="sticky top-0 left-0 right-0 z-50 w-full">
                <div className="h-16 w-full max-w-screen-2xl mx-auto rounded-b-[40px] border-b border-border/40 bg-background/80 backdrop-blur-md flex items-center justify-between px-4">
                    <div className="flex items-center gap-2">
                        <Skeleton className="h-8 w-8 rounded-lg" />
                        <Skeleton className="h-6 w-24 rounded-md" />
                    </div>
                    <div className="flex items-center gap-4">
                        <Skeleton className="h-9 w-24 rounded-md" />
                        <Skeleton className="h-8 w-8 rounded-full" />
                    </div>
                </div>
            </div>

            <div className="container mx-auto px-4 py-8 relative z-10 max-w-6xl">
                {/* Welcome Section */}
                <div className="mb-8">
                    <Skeleton className="h-10 w-64 mb-2 rounded-lg" />
                    <Skeleton className="h-5 w-96 rounded-md" />
                </div>

                <div className="grid lg:grid-cols-3 gap-6 min-w-0">
                    {/* Main Content */}
                    <div className="lg:col-span-2 space-y-6 min-w-0">
                        {/* Step 1: Upload Resume */}
                        <Card className="glass-card p-6 relative z-10 w-full rounded-xl">
                            <div className="flex items-center gap-3 mb-6">
                                <Skeleton className="h-10 w-10 rounded-xl" />
                                <Skeleton className="h-8 w-48 rounded-lg" />
                            </div>
                            <Skeleton className="h-48 w-full rounded-xl" />
                        </Card>

                        {/* Step 2: Add Job Posting */}
                        <Card className="glass-card p-6 relative z-10 w-full rounded-xl">
                            <div className="flex items-center gap-3 mb-6">
                                <Skeleton className="h-10 w-10 rounded-xl" />
                                <Skeleton className="h-8 w-48 rounded-lg" />
                            </div>
                            <Skeleton className="h-32 w-full rounded-xl" />
                        </Card>

                        {/* Analyze Button */}
                        <Card className="glass-card p-6 relative z-10 w-full rounded-xl">
                            <Skeleton className="h-12 w-full rounded-md" />
                        </Card>
                    </div>

                    {/* Sidebar */}
                    <div className="space-y-6 min-w-0">
                        {/* Recent Analyses */}
                        <Card className="glass-card p-6 relative z-10 w-full rounded-xl">
                            <Skeleton className="h-7 w-32 mb-4 rounded-md" />
                            <div className="space-y-3">
                                <Skeleton className="h-16 w-full rounded-lg" />
                                <Skeleton className="h-16 w-full rounded-lg" />
                                <Skeleton className="h-16 w-full rounded-lg" />
                            </div>
                        </Card>

                        {/* Quick Stats */}
                        <Card className="glass-card p-6 relative z-10 w-full rounded-xl">
                            <Skeleton className="h-7 w-24 mb-4 rounded-md" />
                            <div className="space-y-4">
                                <div>
                                    <Skeleton className="h-9 w-12 mb-1 rounded-md" />
                                    <Skeleton className="h-4 w-24 rounded-sm" />
                                </div>
                                <div>
                                    <Skeleton className="h-9 w-12 mb-1 rounded-md" />
                                    <Skeleton className="h-4 w-24 rounded-sm" />
                                </div>
                            </div>
                        </Card>
                    </div>
                </div>
            </div>
        </div>
    )
}
