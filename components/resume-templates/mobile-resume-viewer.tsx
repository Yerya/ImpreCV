"use client"

import React, { useCallback, useRef, useState, useEffect } from "react"
import { cn } from "@/lib/utils"
import { Button } from "@/components/ui/button"
import { ZoomIn, ZoomOut, Maximize2 } from "lucide-react"

interface MobileResumeViewerProps {
    children: React.ReactNode
    className?: string
}

const MIN_SCALE = 0.25
const MAX_SCALE = 1.2
const SCALE_STEP = 0.1

export function MobileResumeViewer({ children, className }: MobileResumeViewerProps) {
    const containerRef = useRef<HTMLDivElement>(null)
    const contentRef = useRef<HTMLDivElement>(null)
    const [scale, setScale] = useState(0.4)
    const [isDragging, setIsDragging] = useState(false)
    const [startPos, setStartPos] = useState({ x: 0, y: 0 })
    const [startScroll, setStartScroll] = useState({ x: 0, y: 0 })

    // Calculate initial scale to fit width on mount
    useEffect(() => {
        const calculateFitScale = () => {
            if (!containerRef.current) return
            const containerWidth = containerRef.current.clientWidth - 16
            const resumeWidth = 794
            const fitScale = containerWidth / resumeWidth
            setScale(Math.max(MIN_SCALE, Math.min(fitScale, 0.5)))
        }
        
        calculateFitScale()
        window.addEventListener('resize', calculateFitScale)
        return () => window.removeEventListener('resize', calculateFitScale)
    }, [])

    const handleZoomIn = useCallback(() => {
        setScale((prev) => Math.min(prev + SCALE_STEP, MAX_SCALE))
    }, [])

    const handleZoomOut = useCallback(() => {
        setScale((prev) => Math.max(prev - SCALE_STEP, MIN_SCALE))
    }, [])

    const handleFitToScreen = useCallback(() => {
        if (!containerRef.current) return
        const containerWidth = containerRef.current.clientWidth - 16
        const resumeWidth = 794
        const fitScale = containerWidth / resumeWidth
        setScale(Math.max(MIN_SCALE, Math.min(fitScale, 0.5)))
        if (containerRef.current) {
            containerRef.current.scrollLeft = 0
            containerRef.current.scrollTop = 0
        }
    }, [])

    const handlePointerDown = useCallback((e: React.PointerEvent) => {
        if ((e.target as HTMLElement).closest('button, input, textarea, [contenteditable]')) {
            return
        }
        setIsDragging(true)
        setStartPos({ x: e.clientX, y: e.clientY })
        if (containerRef.current) {
            setStartScroll({ 
                x: containerRef.current.scrollLeft, 
                y: containerRef.current.scrollTop 
            })
        }
        e.preventDefault()
    }, [])

    const handlePointerMove = useCallback((e: React.PointerEvent) => {
        if (!isDragging || !containerRef.current) return
        const dx = e.clientX - startPos.x
        const dy = e.clientY - startPos.y
        containerRef.current.scrollLeft = startScroll.x - dx
        containerRef.current.scrollTop = startScroll.y - dy
    }, [isDragging, startPos, startScroll])

    const handlePointerUp = useCallback(() => {
        setIsDragging(false)
    }, [])

    // Handle pinch-to-zoom
    const lastTouchDistance = useRef<number | null>(null)

    const handleTouchStart = useCallback((e: React.TouchEvent) => {
        if (e.touches.length === 2) {
            e.preventDefault()
            const touch1 = e.touches[0]
            const touch2 = e.touches[1]
            lastTouchDistance.current = Math.hypot(
                touch2.clientX - touch1.clientX,
                touch2.clientY - touch1.clientY
            )
        }
    }, [])

    const handleTouchMove = useCallback((e: React.TouchEvent) => {
        if (e.touches.length === 2 && lastTouchDistance.current !== null) {
            e.preventDefault()
            const touch1 = e.touches[0]
            const touch2 = e.touches[1]
            const currentDistance = Math.hypot(
                touch2.clientX - touch1.clientX,
                touch2.clientY - touch1.clientY
            )
            const delta = currentDistance - lastTouchDistance.current
            const scaleChange = delta * 0.003
            setScale((prev) => Math.max(MIN_SCALE, Math.min(prev + scaleChange, MAX_SCALE)))
            lastTouchDistance.current = currentDistance
        }
    }, [])

    const handleTouchEnd = useCallback(() => {
        lastTouchDistance.current = null
    }, [])

    // Calculate scaled dimensions
    const scaledWidth = 794 * scale
    const scaledHeight = 1123 * scale

    return (
        <div className={cn("relative flex flex-col", className)} style={{ height: '100%' }}>
            {/* Zoom Controls */}
            <div className="absolute top-2 right-2 z-20 flex items-center gap-1 bg-background/90 backdrop-blur-sm rounded-lg border border-border/50 p-1 shadow-md">
                <Button
                    variant="ghost"
                    size="icon"
                    className="h-7 w-7"
                    onClick={handleZoomOut}
                    disabled={scale <= MIN_SCALE}
                >
                    <ZoomOut className="h-3.5 w-3.5" />
                </Button>
                <span className="text-[11px] tabular-nums min-w-[36px] text-center text-muted-foreground">
                    {Math.round(scale * 100)}%
                </span>
                <Button
                    variant="ghost"
                    size="icon"
                    className="h-7 w-7"
                    onClick={handleZoomIn}
                    disabled={scale >= MAX_SCALE}
                >
                    <ZoomIn className="h-3.5 w-3.5" />
                </Button>
                <div className="w-px h-4 bg-border" />
                <Button
                    variant="ghost"
                    size="icon"
                    className="h-7 w-7"
                    onClick={handleFitToScreen}
                    title="Fit to screen"
                >
                    <Maximize2 className="h-3.5 w-3.5" />
                </Button>
            </div>

            {/* Scrollable Container */}
            <div
                ref={containerRef}
                className={cn(
                    "flex-1 overflow-auto overscroll-contain",
                    isDragging ? "cursor-grabbing select-none" : "cursor-grab"
                )}
                onPointerDown={handlePointerDown}
                onPointerMove={handlePointerMove}
                onPointerUp={handlePointerUp}
                onPointerLeave={handlePointerUp}
                onTouchStart={handleTouchStart}
                onTouchMove={handleTouchMove}
                onTouchEnd={handleTouchEnd}
                style={{ touchAction: 'none' }}
            >
                {/* Wrapper for centering */}
                <div 
                    className="flex justify-center items-start p-2"
                    style={{ 
                        minWidth: scaledWidth + 16,
                    }}
                >
                    <div 
                        ref={contentRef}
                        style={{
                            transform: `scale(${scale})`,
                            transformOrigin: 'top center',
                            width: 794,
                            height: 1123,
                            flexShrink: 0,
                        }}
                    >
                        {children}
                    </div>
                </div>
            </div>
        </div>
    )
}
