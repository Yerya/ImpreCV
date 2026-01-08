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
const MAX_SCALE = 3.0
const SCALE_STEP = 0.1

interface TransformState {
    x: number
    y: number
    scale: number
}

export function MobileResumeViewer({ children, className }: MobileResumeViewerProps) {
    const containerRef = useRef<HTMLDivElement>(null)
    const contentRef = useRef<HTMLDivElement>(null)

    // State for the transform
    const [transform, setTransform] = useState<TransformState>({ x: 0, y: 0, scale: 0.4 })

    // Track gestures
    const gestureRef = useRef<{
        isDragging: boolean
        startX: number
        startY: number
        startTransform: TransformState
        initialDistance: number
        initialCenter: { x: number, y: number }
    }>({
        isDragging: false,
        startX: 0,
        startY: 0,
        startTransform: { x: 0, y: 0, scale: 1 },
        initialDistance: 0,
        initialCenter: { x: 0, y: 0 }
    })

    // Fit to screen calculation
    const fitToScreen = useCallback(() => {
        if (!containerRef.current) return

        const containerWidth = containerRef.current.clientWidth
        const containerHeight = containerRef.current.clientHeight
        const contentWidth = 794 // A4 width in px at 96 DPI (approx)
        const contentHeight = 1123 // A4 height

        if (containerWidth === 0 || containerHeight === 0) return

        // Calculate scale to fit width with some padding
        const padding = 16
        const availableWidth = containerWidth - padding
        const scale = Math.min(availableWidth / contentWidth, 0.5) // Cap initial scale

        // Center horizontally
        const scaledWidth = contentWidth * scale
        const x = (containerWidth - scaledWidth) / 2

        // Align top with slight padding
        const y = padding / 2

        setTransform({ x, y, scale })
    }, [])

    // Handle resize
    useEffect(() => {
        const container = containerRef.current
        if (!container) return

        const observer = new ResizeObserver(() => {
            // Only auto-fit if we haven't interacted much or if specifically requested?
            // For now, let's just ensure we have *some* valid scale if currently 0 or weird.
            // Or just run fitToScreen on mount/resize if logic dictates.
            // To avoid resetting user zoom on rotate, we might want to be careful.
            // But usually fitting to width is what you want on orientation change.
            fitToScreen()
        })

        observer.observe(container)
        return () => observer.disconnect()
    }, [fitToScreen])

    // Zoom helpers
    const zoomToPoint = useCallback((newScale: number, center: { x: number, y: number }) => {
        setTransform(prev => {
            const scale = Math.min(Math.max(newScale, MIN_SCALE), MAX_SCALE)
            const ratio = scale / prev.scale

            // Calculate new position to keep center stationary
            // center is in container coordinates
            // (center - prevX) is distance from top-left of content to center
            // New distance should be multiplied by ratio
            // newX = center - (center - prevX) * ratio

            const newX = center.x - (center.x - prev.x) * ratio
            const newY = center.y - (center.y - prev.y) * ratio

            return { x: newX, y: newY, scale }
        })
    }, [])

    const handleZoomIn = () => {
        if (!containerRef.current) return
        const rect = containerRef.current.getBoundingClientRect()
        zoomToPoint(transform.scale + SCALE_STEP, { x: rect.width / 2, y: rect.height / 2 })
    }

    const handleZoomOut = () => {
        if (!containerRef.current) return
        const rect = containerRef.current.getBoundingClientRect()
        zoomToPoint(transform.scale - SCALE_STEP, { x: rect.width / 2, y: rect.height / 2 })
    }

    // Touch Event Handlers
    const handleTouchStart = (e: React.TouchEvent) => {
        if (e.touches.length === 1) {
            gestureRef.current.isDragging = true
            gestureRef.current.startX = e.touches[0].clientX
            gestureRef.current.startY = e.touches[0].clientY
            gestureRef.current.startTransform = { ...transform }
        } else if (e.touches.length === 2) {
            gestureRef.current.isDragging = true
            const touch1 = e.touches[0]
            const touch2 = e.touches[1]

            const dist = Math.hypot(touch2.clientX - touch1.clientX, touch2.clientY - touch1.clientY)
            const centerX = (touch1.clientX + touch2.clientX) / 2
            const centerY = (touch1.clientY + touch2.clientY) / 2

            // Adjust center to be relative to container
            if (containerRef.current) {
                const rect = containerRef.current.getBoundingClientRect()
                gestureRef.current.initialCenter = {
                    x: centerX - rect.left,
                    y: centerY - rect.top
                }
            }

            gestureRef.current.initialDistance = dist
            gestureRef.current.startTransform = { ...transform }
        }
    }

    const handleTouchMove = (e: React.TouchEvent) => {
        if (!gestureRef.current.isDragging) return
        e.preventDefault() // Prevent scrolling the page

        if (e.touches.length === 1) {
            // Pan
            const dx = e.touches[0].clientX - gestureRef.current.startX
            const dy = e.touches[0].clientY - gestureRef.current.startY

            setTransform(prev => ({
                ...prev,
                x: gestureRef.current.startTransform.x + dx,
                y: gestureRef.current.startTransform.y + dy
            }))
        } else if (e.touches.length === 2) {
            // Pinch Zoom
            const touch1 = e.touches[0]
            const touch2 = e.touches[1]

            const dist = Math.hypot(touch2.clientX - touch1.clientX, touch2.clientY - touch1.clientY)

            if (gestureRef.current.initialDistance > 0) {
                const scaleFactor = dist / gestureRef.current.initialDistance
                const newScale = gestureRef.current.startTransform.scale * scaleFactor

                // Determine the new transform using the simplified pivot logic
                // We want: initialCenter to map to the same point on content relative to container

                const currentScale = Math.min(Math.max(newScale, MIN_SCALE), MAX_SCALE)
                const startScale = gestureRef.current.startTransform.scale
                const ratio = currentScale / startScale

                const cx = gestureRef.current.initialCenter.x
                const cy = gestureRef.current.initialCenter.y
                const sx = gestureRef.current.startTransform.x
                const sy = gestureRef.current.startTransform.y

                const newX = cx - (cx - sx) * ratio
                const newY = cy - (cy - sy) * ratio

                setTransform({
                    x: newX,
                    y: newY,
                    scale: currentScale
                })
            }
        }
    }

    const handleTouchEnd = () => {
        gestureRef.current.isDragging = false
    }

    // Mouse handlers for desktop testing/usage
    const handleMouseDown = (e: React.MouseEvent) => {
        gestureRef.current.isDragging = true
        gestureRef.current.startX = e.clientX
        gestureRef.current.startY = e.clientY
        gestureRef.current.startTransform = { ...transform }
    }

    const handleMouseMove = (e: React.MouseEvent) => {
        if (!gestureRef.current.isDragging) return
        e.preventDefault()
        const dx = e.clientX - gestureRef.current.startX
        const dy = e.clientY - gestureRef.current.startY

        setTransform(prev => ({
            ...prev,
            x: gestureRef.current.startTransform.x + dx,
            y: gestureRef.current.startTransform.y + dy
        }))
    }

    const handleMouseUp = () => {
        gestureRef.current.isDragging = false
    }

    return (
        <div className={cn("relative flex flex-col h-full", className)}>
            {/* Zoom Controls */}
            <div className="absolute top-2 right-2 z-20 flex items-center gap-1 bg-background/90 backdrop-blur-sm rounded-lg border border-border/50 p-1 shadow-md">
                <Button
                    variant="ghost"
                    size="icon"
                    className="h-7 w-7"
                    onClick={handleZoomOut}
                    disabled={transform.scale <= MIN_SCALE}
                >
                    <ZoomOut className="h-3.5 w-3.5" />
                </Button>
                <span className="text-[11px] tabular-nums min-w-[36px] text-center text-muted-foreground">
                    {Math.round(transform.scale * 100)}%
                </span>
                <Button
                    variant="ghost"
                    size="icon"
                    className="h-7 w-7"
                    onClick={handleZoomIn}
                    disabled={transform.scale >= MAX_SCALE}
                >
                    <ZoomIn className="h-3.5 w-3.5" />
                </Button>
                <div className="w-px h-4 bg-border" />
                <Button
                    variant="ghost"
                    size="icon"
                    className="h-7 w-7"
                    onClick={fitToScreen}
                    title="Fit to screen"
                >
                    <Maximize2 className="h-3.5 w-3.5" />
                </Button>
            </div>

            {/* Container */}
            <div
                ref={containerRef}
                className="flex-1 overflow-hidden relative cursor-grab active:cursor-grabbing bg-muted/10 touch-none"
                onTouchStart={handleTouchStart}
                onTouchMove={handleTouchMove}
                onTouchEnd={handleTouchEnd}
                onTouchCancel={handleTouchEnd}
                onMouseDown={handleMouseDown}
                onMouseMove={handleMouseMove}
                onMouseUp={handleMouseUp}
                onMouseLeave={handleMouseUp}
            >
                <div
                    ref={contentRef}
                    style={{
                        transform: `translate3d(${transform.x}px, ${transform.y}px, 0) scale(${transform.scale})`,
                        transformOrigin: '0 0',
                        width: '794px', // Fixed A4 width
                        height: '1123px', // Fixed A4 height
                        willChange: 'transform',
                    }}
                    className="absolute top-0 left-0 bg-white shadow-xl origin-top-left"
                >
                    {children}
                </div>
            </div>
        </div>
    )
}
