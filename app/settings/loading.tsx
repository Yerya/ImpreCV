import { Skeleton } from "@/components/ui/skeleton"
import { Card } from "@/components/ui/card"

export default function SettingsLoading() {
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

            <div className="container mx-auto px-4 py-8 max-w-4xl relative z-10">
                <div className="mb-8">
                    <Skeleton className="h-10 w-32 mb-2 rounded-lg" />
                    <Skeleton className="h-5 w-64 rounded-md" />
                </div>

                <div className="space-y-6">
                    {/* Profile Settings */}
                    <Card className="glass-card p-6 relative z-10 rounded-xl">
                        <Skeleton className="h-8 w-24 mb-6 rounded-md" />
                        <div className="space-y-4">
                            <div className="space-y-2">
                                <Skeleton className="h-4 w-12 rounded-sm" />
                                <Skeleton className="h-10 w-full rounded-md" />
                            </div>
                            <div className="space-y-2">
                                <Skeleton className="h-4 w-16 rounded-sm" />
                                <Skeleton className="h-10 w-full rounded-md" />
                            </div>
                            <Skeleton className="h-10 w-32 rounded-md" />
                        </div>
                    </Card>

                    {/* Appearance */}
                    <Card className="glass-card p-6 relative z-10 rounded-xl">
                        <Skeleton className="h-8 w-32 mb-6 rounded-md" />
                        <div className="space-y-4">
                            <div className="flex items-center justify-between">
                                <div>
                                    <Skeleton className="h-5 w-16 mb-1 rounded-sm" />
                                    <Skeleton className="h-4 w-48 rounded-sm" />
                                </div>
                                <Skeleton className="h-9 w-9 rounded-full" />
                            </div>
                            <div className="pt-4">
                                <Skeleton className="h-20 w-full rounded-lg" />
                            </div>
                        </div>
                    </Card>
                </div>
            </div>
        </div>
    )
}
