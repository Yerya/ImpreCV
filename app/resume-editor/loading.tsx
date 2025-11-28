import { Skeleton } from "@/components/ui/skeleton"
import { Card } from "@/components/ui/card"

export default function ResumeEditorLoading() {
    return (
        <div className="min-h-screen relative pb-20">
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

            <div className="container mx-auto px-4 py-8 relative z-10 max-w-7xl">
                <div className="flex items-center justify-between flex-wrap gap-4 mb-8">
                    <div className="space-y-2">
                        <Skeleton className="h-10 w-48 rounded-lg" />
                        <Skeleton className="h-5 w-80 rounded-md" />
                    </div>
                    <div className="flex items-center gap-2">
                        <Skeleton className="h-9 w-20 rounded-md" />
                        <Skeleton className="h-9 w-24 rounded-md" />
                        <Skeleton className="h-9 w-28 rounded-md" />
                    </div>
                </div>

                <div className="grid xl:grid-cols-[minmax(0,1fr)_300px] gap-6 items-start">
                    <Card className="glass-card p-4 md:p-6">
                        <Skeleton className="h-[700px] w-full rounded-2xl" />
                    </Card>

                    <div className="space-y-6">
                        <Card className="glass-card p-5 space-y-4">
                            <div className="flex items-center justify-between">
                                <Skeleton className="h-4 w-32 rounded-sm" />
                                <Skeleton className="h-6 w-12 rounded-full" />
                            </div>
                            <div className="space-y-2">
                                <Skeleton className="h-12 w-full rounded-lg" />
                                <Skeleton className="h-12 w-full rounded-lg" />
                                <Skeleton className="h-12 w-full rounded-lg" />
                            </div>
                        </Card>

                        <Card className="glass-card p-5 space-y-4">
                            <div className="flex items-center justify-between">
                                <Skeleton className="h-4 w-28 rounded-sm" />
                                <Skeleton className="h-6 w-10 rounded-full" />
                            </div>
                            <div className="space-y-3">
                                <Skeleton className="h-12 w-full rounded-lg" />
                                <Skeleton className="h-12 w-full rounded-lg" />
                                <Skeleton className="h-12 w-full rounded-lg" />
                            </div>
                        </Card>
                    </div>
                </div>
            </div>
        </div>
    )
}
