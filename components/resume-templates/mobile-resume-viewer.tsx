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
    const [isAnimating, setIsAnimating] = useState(false)

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
        // const containerHeight = containerRef.current.clientHeight
        const contentWidth = 794 // A4 width in px
        // const contentHeight = 1123 // A4 height

        if (containerWidth === 0) return

        // Calculate scale to fit width with some padding
        const padding = 16
        const availableWidth = containerWidth - padding
        const scale = Math.min(availableWidth / contentWidth, 0.5) // Cap initial scale

        // Center horizontally
        const scaledWidth = contentWidth * scale
        const x = (containerWidth - scaledWidth) / 2

        // Align top with slight padding
        const y = padding / 2

        setIsAnimating(true)
        setTransform({ x, y, scale })
        setTimeout(() => setIsAnimating(false), 300)
    }, [])

    // Handle resize
    useEffect(() => {
        const container = containerRef.current
        if (!container) return

        const observer = new ResizeObserver(() => {
            // Only fit to screen on initial load-ish or if scale is very wrong
            // For now, let's behave nicely and not force reset excessively
            // But if users rotate device, fitting to screen is usually desired.
            if (!gestureRef.current.isDragging) {
                fitToScreen()
            }
        })

        observer.observe(container)
        return () => observer.disconnect()
    }, [fitToScreen])

    // Zoom helpers
    const zoomToPoint = useCallback((newScale: number, center: { x: number, y: number }) => {
        setIsAnimating(true)
        setTransform(prev => {
            const scale = Math.min(Math.max(newScale, MIN_SCALE), MAX_SCALE)
            const ratio = scale / prev.scale

            const newX = center.x - (center.x - prev.x) * ratio
            const newY = center.y - (center.y - prev.y) * ratio

            return { x: newX, y: newY, scale }
        })
        setTimeout(() => setIsAnimating(false), 300)
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

    // Boundary Constraint
    const constrainBounds = useCallback((current: TransformState) => {
        if (!containerRef.current) return current

        const containerW = containerRef.current.clientWidth
        const containerH = containerRef.current.clientHeight
        const contentW = 794 * current.scale
        const contentH = 1123 * current.scale
        const padding = 16

        let targetX = current.x
        let targetY = current.y

        // Horizontal Logic
        if (contentW <= containerW) {
            // If content is smaller than container, center it
            targetX = (containerW - contentW) / 2
        } else {
            // If content is larger, clamp edges
            // Left edge shouldn't be > padding
            // Right edge (x + contentW) shouldn't be < containerW - padding

            // max X (pan right) -> left edge at padding
            const maxX = padding
            // min X (pan left) -> right edge at containerW - padding
            const minX = containerW - contentW - padding

            targetX = Math.min(Math.max(current.x, minX), maxX)
        }

        // Vertical Logic
        if (contentH <= containerH) {
            // If content is smaller, center it vertically? Or stick to top?
            // Usually centering looks nicer if really small, but top-center is safer for resume reading.
            // Let's go with top-aligned + padding for vertical if fits
            targetY = padding
            // If we really want centering when tiny:
            // targetY = (containerH - contentH) / 2
        } else {
            // max Y (pan down) -> top edge at padding
            const maxY = padding
            // min Y (pan up) -> bottom edge at containerH - padding
            const minY = containerH - contentH - padding

            targetY = Math.min(Math.max(current.y, minY), maxY)
        }

        return { x: targetX, y: targetY, scale: current.scale }

    }, [])

    // Touch Event Handlers
    const handleTouchStart = (e: React.TouchEvent) => {
        // Stop any ongoing animation immediately on touch
        setIsAnimating(false)

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
        e.preventDefault()

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
            // Pinch Zoom & Pan
            const touch1 = e.touches[0]
            const touch2 = e.touches[1]

            const dist = Math.hypot(touch2.clientX - touch1.clientX, touch2.clientY - touch1.clientY)
            const centerX = (touch1.clientX + touch2.clientX) / 2
            const centerY = (touch1.clientY + touch2.clientY) / 2

            if (gestureRef.current.initialDistance > 0 && containerRef.current) {
                const scaleFactor = dist / gestureRef.current.initialDistance
                // Use a rubber-band feel or just direct scaling? 
                // Direct scaling is usually expected during pinch. rubber-band applies to limits.

                const newScale = gestureRef.current.startTransform.scale * scaleFactor
                // Allow user to zoom slightly past limits (rubber band effect for zoom?)
                // Simple version: clamp strictly or soft clamp. Let's strict clamp min/max for simplicity
                // but soft clamping feels better. Keeping strict for now to avoid complexity.
                const currentScale = Math.min(Math.max(newScale, MIN_SCALE * 0.5), MAX_SCALE * 1.5)

                const ratio = currentScale / gestureRef.current.startTransform.scale

                const rect = containerRef.current.getBoundingClientRect()
                const currentRelX = centerX - rect.left
                const currentRelY = centerY - rect.top

                const cx = gestureRef.current.initialCenter.x
                const cy = gestureRef.current.initialCenter.y
                const sx = gestureRef.current.startTransform.x
                const sy = gestureRef.current.startTransform.y

                const newX = currentRelX - (cx - sx) * ratio
                const newY = currentRelY - (cy - sy) * ratio

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

        // Snap back!
        const snapped = constrainBounds(transform)
        // Ensure scale is also clamped if we allowed over-zoom
        snapped.scale = Math.min(Math.max(snapped.scale, MIN_SCALE), MAX_SCALE)

        // Re-run constrain with final scale just in case scale changed
        const finalSnap = constrainBounds(snapped)

        if (finalSnap.x !== transform.x || finalSnap.y !== transform.y || finalSnap.scale !== transform.scale) {
            setIsAnimating(true)
            setTransform(finalSnap)
            setTimeout(() => setIsAnimating(false), 300)
        }
    }

    // Mouse handlers (Desktop)
    const handleMouseDown = (e: React.MouseEvent) => {
        gestureRef.current.isDragging = true
        gestureRef.current.startX = e.clientX
        gestureRef.current.startY = e.clientY
        gestureRef.current.startTransform = { ...transform }
        setIsAnimating(false)
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
        const snapped = constrainBounds(transform)
        if (snapped.x !== transform.x || snapped.y !== transform.y || snapped.scale !== transform.scale) {
            setIsAnimating(true)
            setTransform(snapped)
            setTimeout(() => setIsAnimating(false), 300)
        }
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
                style={{
                    touchAction: 'none'
                }}
            >
                <div
                    ref={contentRef}
                    style={{
                        transform: `translate3d(${transform.x}px, ${transform.y}px, 0) scale(${transform.scale})`,
                        transformOrigin: '0 0',
                        width: '794px', // Fixed A4 width
                        height: '1123px', // Fixed A4 height
                        willChange: 'transform',
                        transition: isAnimating ? 'transform 0.3s cubic-bezier(0.25, 1, 0.5, 1)' : 'none',
                    }}
                    className="absolute top-0 left-0 bg-white shadow-xl origin-top-left"
                >
                    {children}
                </div>
            </div>
        </div>
    )
}
