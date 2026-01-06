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

    // Handle pinch-to-zoom with proper focus point
    const lastTouchDistance = useRef<number | null>(null)
    const pinchCenter = useRef<{ x: number; y: number } | null>(null)
    const lastScale = useRef<number>(scale)

    // Update lastScale ref when scale changes
    useEffect(() => {
        lastScale.current = scale
    }, [scale])

    const handleTouchStart = useCallback((e: React.TouchEvent) => {
        if (e.touches.length === 2 && containerRef.current) {
            e.preventDefault()
            const touch1 = e.touches[0]
            const touch2 = e.touches[1]
            lastTouchDistance.current = Math.hypot(
                touch2.clientX - touch1.clientX,
                touch2.clientY - touch1.clientY
            )

            // Calculate midpoint of pinch in container coordinates
            const container = containerRef.current
            const rect = container.getBoundingClientRect()
            const midX = (touch1.clientX + touch2.clientX) / 2 - rect.left
            const midY = (touch1.clientY + touch2.clientY) / 2 - rect.top

            // Store the point in content coordinates (accounting for current scroll)
            pinchCenter.current = {
                x: midX + container.scrollLeft,
                y: midY + container.scrollTop
            }
        }
    }, [])

    const handleTouchMove = useCallback((e: React.TouchEvent) => {
        if (e.touches.length === 2 && lastTouchDistance.current !== null && containerRef.current && pinchCenter.current) {
            e.preventDefault()
            const container = containerRef.current
            const touch1 = e.touches[0]
            const touch2 = e.touches[1]
            const currentDistance = Math.hypot(
                touch2.clientX - touch1.clientX,
                touch2.clientY - touch1.clientY
            )

            const scaleFactor = currentDistance / lastTouchDistance.current
            const oldScale = lastScale.current
            const newScale = Math.max(MIN_SCALE, Math.min(oldScale * scaleFactor, MAX_SCALE))

            if (newScale !== oldScale) {
                // Calculate how scroll should change to keep pinch point stationary
                const rect = container.getBoundingClientRect()
                const midX = (touch1.clientX + touch2.clientX) / 2 - rect.left
                const midY = (touch1.clientY + touch2.clientY) / 2 - rect.top

                // The pinch center in content space, scaled from old to new
                const scaleRatio = newScale / oldScale
                const newScrollX = pinchCenter.current.x * scaleRatio - midX
                const newScrollY = pinchCenter.current.y * scaleRatio - midY

                // Update pinch center for continuous zooming
                pinchCenter.current = {
                    x: newScrollX + midX,
                    y: newScrollY + midY
                }

                setScale(newScale)
                lastScale.current = newScale

                // Apply new scroll position
                container.scrollLeft = Math.max(0, newScrollX)
                container.scrollTop = Math.max(0, newScrollY)
            }

            lastTouchDistance.current = currentDistance
        }
    }, [])

    const handleTouchEnd = useCallback(() => {
        lastTouchDistance.current = null
        pinchCenter.current = null
    }, [])

    // Calculate scaled dimensions
    const scaledWidth = 794 * scale

    return (
        <div className={cn("relative flex flex-col", className)}>
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
                    "flex-1 overflow-auto overscroll-contain flex flex-col min-h-0",
                    isDragging ? "cursor-grabbing select-none" : "cursor-grab"
                )}
                onPointerDown={handlePointerDown}
                onPointerMove={handlePointerMove}
                onPointerUp={handlePointerUp}
                onPointerLeave={handlePointerUp}
                onTouchStart={handleTouchStart}
                onTouchMove={handleTouchMove}
                onTouchEnd={handleTouchEnd}
                style={{ touchAction: 'none', height: '100%' }}
            >
                {/* Wrapper for centering */}
                <div
                    className="flex justify-center items-start p-2"
                    style={{
                        minWidth: scaledWidth + 16,
                        height: 'auto',
                        minHeight: 'auto',
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
