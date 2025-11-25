import { Skeleton } from "@/components/ui/skeleton"
import { Card } from "@/components/ui/card"

export default function AnalysisLoading() {
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

            <div className="container mx-auto px-4 py-8 relative z-10">
                {/* Job Info Header */}
                <div className="mb-8">
                    <Skeleton className="h-10 w-64 mb-2 rounded-lg" />
                    <div className="flex items-center gap-2">
                        <Skeleton className="h-6 w-48 rounded-md" />
                    </div>
                </div>

                <div className="grid lg:grid-cols-3 gap-6">
                    {/* Main Content */}
                    <div className="lg:col-span-2 space-y-6">
                        {/* Match Score Card */}
                        <Card className="glass-card p-8 relative z-10 rounded-xl">
                            <div className="flex items-center justify-between mb-6">
                                <Skeleton className="h-8 w-32 rounded-md" />
                                <Skeleton className="h-12 w-24 rounded-lg" />
                            </div>
                            <Skeleton className="h-3 w-full mb-4 rounded-full" />
                            <Skeleton className="h-5 w-48 rounded-md" />
                        </Card>

                        {/* Strengths */}
                        <Card className="glass-card p-6 relative z-10 rounded-xl">
                            <div className="flex items-center gap-3 mb-4">
                                <Skeleton className="h-10 w-10 rounded-xl" />
                                <Skeleton className="h-7 w-32 rounded-md" />
                            </div>
                            <div className="space-y-3">
                                <Skeleton className="h-6 w-full rounded-md" />
                                <Skeleton className="h-6 w-full rounded-md" />
                                <Skeleton className="h-6 w-3/4 rounded-md" />
                            </div>
                        </Card>

                        {/* Gaps */}
                        <Card className="glass-card p-6 relative z-10 rounded-xl">
                            <div className="flex items-center gap-3 mb-4">
                                <Skeleton className="h-10 w-10 rounded-xl" />
                                <Skeleton className="h-7 w-48 rounded-md" />
                            </div>
                            <div className="space-y-3">
                                <Skeleton className="h-6 w-full rounded-md" />
                                <Skeleton className="h-6 w-full rounded-md" />
                                <Skeleton className="h-6 w-3/4 rounded-md" />
                            </div>
                        </Card>
                    </div>

                    {/* Sidebar */}
                    <div className="space-y-6">
                        {/* Next Steps */}
                        <Card className="glass-card-primary p-6 relative z-10 rounded-xl">
                            <Skeleton className="h-7 w-32 mb-4 rounded-md" />
                            <div className="space-y-3">
                                <Skeleton className="h-12 w-full rounded-md" />
                                <Skeleton className="h-12 w-full rounded-md" />
                            </div>
                        </Card>

                        {/* Resume Info */}
                        <Card className="glass-card p-6 relative z-10 rounded-xl">
                            <Skeleton className="h-7 w-32 mb-4 rounded-md" />
                            <div className="flex items-start gap-3">
                                <Skeleton className="h-10 w-10 rounded-lg" />
                                <div className="flex-1">
                                    <Skeleton className="h-5 w-32 mb-1 rounded-sm" />
                                    <Skeleton className="h-3 w-24 rounded-sm" />
                                </div>
                            </div>
                        </Card>
                    </div>
                </div>
            </div>
        </div>
    )
}
