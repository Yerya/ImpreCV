import { Skeleton } from "@/components/ui/skeleton"
import { Card } from "@/components/ui/card"

export default function ResumeRewriteLoading() {
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
                <div className="mb-8">
                    <Skeleton className="h-10 w-64 mb-2 rounded-lg" />
                    <Skeleton className="h-5 w-48 rounded-md" />
                </div>

                <div className="grid lg:grid-cols-3 gap-6">
                    <div className="lg:col-span-2 space-y-6">
                        <Card className="glass-card p-6 relative z-10 rounded-xl">
                            <div className="flex items-center justify-between mb-6">
                                <Skeleton className="h-8 w-48 rounded-md" />
                                <div className="flex gap-2">
                                    <Skeleton className="h-9 w-24 rounded-md" />
                                    <Skeleton className="h-9 w-24 rounded-md" />
                                </div>
                            </div>
                            <Skeleton className="h-[600px] w-full rounded-xl" />
                        </Card>
                    </div>

                    <div className="space-y-6">
                        <Card className="glass-card p-6 relative z-10 rounded-xl">
                            <Skeleton className="h-7 w-32 mb-4 rounded-md" />
                            <Skeleton className="h-24 w-full rounded-lg" />
                        </Card>
                    </div>
                </div>
            </div>
        </div>
    )
}
