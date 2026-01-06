"use client"

import React, { useCallback, useEffect, useRef, useState } from "react"
import { cn } from "@/lib/utils"
import { Button } from "@/components/ui/button"
import { X, ChevronUp } from "lucide-react"

interface MobileDrawerProps {
    open: boolean
    onOpenChange: (open: boolean) => void
    children: React.ReactNode
    title?: string
    description?: string
    className?: string
    noPadding?: boolean
}

export function MobileDrawer({
    open,
    onOpenChange,
    children,
    title,
    description,
    className,
    noPadding = false
}: MobileDrawerProps) {
    const overlayRef = useRef<HTMLDivElement>(null)
    const drawerRef = useRef<HTMLDivElement>(null)
    const [dragY, setDragY] = useState(0)
    const [isDragging, setIsDragging] = useState(false)
    const startYRef = useRef(0)
    const startDragYRef = useRef(0)

    // Handle escape key
    useEffect(() => {
        if (!open) return

        const handleKeyDown = (e: KeyboardEvent) => {
            if (e.key === "Escape") {
                onOpenChange(false)
            }
        }

        document.addEventListener("keydown", handleKeyDown)
        return () => document.removeEventListener("keydown", handleKeyDown)
    }, [open, onOpenChange])

    // Lock body scroll when open
    useEffect(() => {
        if (open) {
            document.body.style.overflow = "hidden"
        } else {
            document.body.style.overflow = ""
        }
        return () => {
            document.body.style.overflow = ""
        }
    }, [open])

    const handlePointerDown = useCallback((e: React.PointerEvent) => {
        if ((e.target as HTMLElement).closest('.drawer-content')) return
        setIsDragging(true)
        startYRef.current = e.clientY
        startDragYRef.current = dragY
    }, [dragY])

    const handlePointerMove = useCallback((e: React.PointerEvent) => {
        if (!isDragging) return
        const deltaY = e.clientY - startYRef.current
        const newDragY = Math.max(0, startDragYRef.current + deltaY)
        setDragY(newDragY)
    }, [isDragging])

    const handlePointerUp = useCallback(() => {
        if (!isDragging) return
        setIsDragging(false)
        
        // If dragged more than 100px down, close the drawer
        if (dragY > 100) {
            onOpenChange(false)
            setDragY(0)
        } else {
            setDragY(0)
        }
    }, [isDragging, dragY, onOpenChange])

    // Reset drag state when drawer closes
    useEffect(() => {
        if (!open) {
            setDragY(0)
            setIsDragging(false)
        }
    }, [open])

    if (!open) return null

    return (
        <>
            {/* Overlay */}
            <div
                ref={overlayRef}
                className={cn(
                    "fixed inset-0 z-50 bg-black/60 backdrop-blur-sm",
                    "animate-in fade-in-0 duration-200"
                )}
                onClick={() => onOpenChange(false)}
            />

            {/* Drawer */}
            <div
                ref={drawerRef}
                className={cn(
                    "fixed inset-x-0 bottom-0 z-50",
                    "bg-background rounded-t-2xl shadow-2xl",
                    "max-h-[85vh] flex flex-col",
                    "animate-in slide-in-from-bottom duration-300",
                    isDragging ? "transition-none" : "transition-transform duration-200",
                    className
                )}
                style={{
                    transform: `translateY(${dragY}px)`,
                }}
                onPointerDown={handlePointerDown}
                onPointerMove={handlePointerMove}
                onPointerUp={handlePointerUp}
                onPointerLeave={handlePointerUp}
            >
                {/* Handle */}
                <div className="flex justify-center pt-3 pb-2 cursor-grab active:cursor-grabbing">
                    <div className="w-10 h-1.5 rounded-full bg-muted-foreground/30" />
                </div>

                {/* Header */}
                {(title || description) && (
                    <div className="flex items-start justify-between px-5 pb-3 border-b border-border/50">
                        <div className="flex-1 min-w-0">
                            {title && (
                                <h3 className="text-base font-semibold">{title}</h3>
                            )}
                            {description && (
                                <p className="text-sm text-muted-foreground mt-0.5">{description}</p>
                            )}
                        </div>
                        <Button
                            variant="ghost"
                            size="icon"
                            className="h-8 w-8 -mr-2"
                            onClick={() => onOpenChange(false)}
                        >
                            <X className="h-4 w-4" />
                        </Button>
                    </div>
                )}

                {/* Content */}
                <div className={cn(
                    "drawer-content flex-1 overflow-auto overscroll-contain",
                    noPadding ? "py-2" : "px-5 py-4"
                )}>
                    {children}
                </div>
            </div>
        </>
    )
}

interface MobileDrawerTriggerProps {
    onClick: () => void
    children: React.ReactNode
    className?: string
    badge?: React.ReactNode
}

export function MobileDrawerTrigger({
    onClick,
    children,
    className,
    badge
}: MobileDrawerTriggerProps) {
    return (
        <button
            type="button"
            onClick={onClick}
            className={cn(
                "flex items-center justify-between w-full p-4",
                "rounded-xl border border-border/60 bg-background/50",
                "hover:border-primary/50 hover:bg-accent/50 transition-all",
                "active:scale-[0.98]",
                className
            )}
        >
            <div className="flex items-center gap-3">{children}</div>
            {badge && <div className="flex items-center gap-2">{badge}<ChevronUp className="h-4 w-4 text-muted-foreground" /></div>}
        </button>
    )
}
