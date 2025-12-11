'use client'

import { useEffect } from 'react'
import Link from 'next/link'
import { AlertTriangle, RefreshCw, Home } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Card } from '@/components/ui/card'
import '@/styles/globals.css'

export default function GlobalError({
    error,
    reset,
}: {
    error: Error & { digest?: string }
    reset: () => void
}) {
    useEffect(() => {
        console.error('Global error:', error)
    }, [error])

    return (
        <html lang="en" className="dark">
            <body className="min-h-screen bg-background text-foreground flex items-center justify-center p-4">
                <Card className="glass-card max-w-md w-full p-8 text-center">
                    <div className="h-16 w-16 mx-auto mb-6 rounded-2xl bg-destructive/10 flex items-center justify-center">
                        <AlertTriangle className="h-8 w-8 text-destructive" />
                    </div>

                    <h1 className="text-2xl font-bold mb-2">
                        <span className="gradient-text">Something went wrong</span>
                    </h1>

                    <p className="text-muted-foreground mb-6">
                        An unexpected error occurred. Please try again or contact support if the problem persists.
                    </p>

                    {error.digest && (
                        <p className="text-xs text-muted-foreground/60 mb-6 font-mono bg-secondary/50 rounded-md px-3 py-2">
                            Error ID: {error.digest}
                        </p>
                    )}

                    <div className="flex flex-col sm:flex-row items-center justify-center gap-3">
                        <Button onClick={reset} className="w-full sm:w-auto">
                            <RefreshCw className="mr-2 h-4 w-4" />
                            Try Again
                        </Button>

                        <Button variant="outline" asChild className="w-full sm:w-auto">
                            <Link href="/">
                                <Home className="mr-2 h-4 w-4" />
                                Return Home
                            </Link>
                        </Button>
                    </div>
                </Card>
            </body>
        </html>
    )
}
