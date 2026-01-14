"use client"

import * as React from "react"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Skeleton } from "@/components/ui/skeleton"
import {
  Carousel,
  CarouselContent,
  CarouselItem,
  type CarouselApi
} from "@/components/ui/carousel"
import { cn } from "@/lib/utils"
import { resumeVariants, type ResumeVariantId } from "@/lib/resume-templates/variants"
import type { ResumeData } from "@/lib/resume-templates/types"

import { ChevronLeft, ChevronRight, Check } from "lucide-react"
import { ResumePreviewSlot } from "./resume-preview-slot"

interface TemplatePreviewCarouselProps {
  resumeData: ResumeData
  selectedVariant: ResumeVariantId
  onSelect: (variant: ResumeVariantId) => void
  themeMode?: 'light' | 'dark'
}

// Helper to check if slide should be rendered (virtualization)
// Renders current slide + 2 neighbors on each side (5 slides max)
const shouldRenderSlide = (index: number, current: number, total: number) => {
  // For small carousels (≤5 items), render all
  if (total <= 5) return true

  const diff = Math.abs(index - current)
  // Handle loop: check distance in both directions around the carousel
  const loopDiff = Math.min(diff, total - diff)
  // Render ±2 neighbors (5 slides total: current + 2 left + 2 right)
  return loopDiff <= 2
}

export function TemplatePreviewCarousel({
  resumeData,
  selectedVariant,
  onSelect,
  themeMode = 'light'
}: TemplatePreviewCarouselProps) {
  const [api, setApi] = React.useState<CarouselApi>()
  const [current, setCurrent] = React.useState(0)
  const containerRef = React.useRef<HTMLDivElement>(null)

  // Find the initial index based on selectedVariant
  const initialIndex = React.useMemo(() =>
    resumeVariants.findIndex(v => v.id === selectedVariant),
    [selectedVariant]
  )

  React.useEffect(() => {
    if (!api) return

    const onSelect = () => {
      setCurrent(api.selectedScrollSnap())
    }

    api.on("select", onSelect)
    onSelect()

    return () => {
      api.off("select", onSelect)
    }
  }, [api])

  // Scroll to selected variant on mount
  React.useEffect(() => {
    if (api && initialIndex >= 0) {
      api.scrollTo(initialIndex, true)
    }
  }, [api, initialIndex])

  const handleSelect = React.useCallback((index: number) => {
    const variant = resumeVariants[index]
    if (variant) {
      onSelect(variant.id)
    }
  }, [onSelect])

  // Keyboard navigation
  const handleKeyDown = React.useCallback((e: React.KeyboardEvent) => {
    if (!api) return

    if (e.key === 'ArrowLeft') {
      e.preventDefault()
      api.scrollPrev()
    } else if (e.key === 'ArrowRight') {
      e.preventDefault()
      api.scrollNext()
    } else if (e.key === 'Enter' || e.key === ' ') {
      e.preventDefault()
      handleSelect(current)
    }
  }, [api, current, handleSelect])

  return (
    <div
      ref={containerRef}
      className="w-full h-full flex flex-col no-select outline-none"
      tabIndex={0}
      onKeyDown={handleKeyDown}
      role="listbox"
      aria-label="Template selector"
    >
      {/* Main carousel */}
      <Carousel
        setApi={setApi}
        opts={{
          align: "center",
          loop: true,
          duration: 25,
          startIndex: initialIndex >= 0 ? initialIndex : 0,
        }}
        className="w-full flex-1 min-h-0"
      >
        <CarouselContent className="-ml-2 sm:-ml-4 h-full items-center">
          {resumeVariants.map((variant, index) => {
            const isActive = current === index
            const isSelected = selectedVariant === variant.id
            // Virtualization: only render slides within ±2 of current
            const shouldRender = shouldRenderSlide(index, current, resumeVariants.length)

            return (
              <CarouselItem
                key={variant.id}
                className="pl-2 sm:pl-4 basis-[55%] sm:basis-[50%] md:basis-[45%] lg:basis-[35%] xl:basis-[30%] h-full flex items-center justify-center"
              >
                <div
                  className={cn(
                    "transition-all duration-500 ease-out cursor-pointer group h-full flex flex-col items-center justify-center",
                    isActive
                      ? "scale-100 opacity-100"
                      : "scale-[0.92] opacity-60 hover:opacity-80"
                  )}
                  onClick={() => {
                    if (isActive) {
                      handleSelect(index)
                    } else {
                      api?.scrollTo(index)
                    }
                  }}
                >
                  {/* Badge row above card */}
                  <div className="flex items-center justify-center gap-2 mb-2 h-6 shrink-0">
                    <Badge
                      variant="secondary"
                      className="text-xs font-medium bg-background/80 border shadow-sm"
                    >
                      {variant.badge}
                    </Badge>
                    {isSelected && (
                      <Badge className="bg-primary text-primary-foreground gap-1 shadow-sm">
                        <Check className="h-3 w-3" />
                        Selected
                      </Badge>
                    )}
                  </div>

                  {/* Template card wrapper - responsive height based on viewport */}
                  <div
                    className={cn(
                      "relative rounded-2xl border-2 overflow-hidden transition-all duration-300",
                      "shadow-xl hover:shadow-2xl",
                      // Smaller on mobile, larger on desktop
                      "h-[35vh] sm:h-[40vh] md:h-[45vh] lg:h-[50vh] w-auto",
                      isSelected
                        ? "border-primary ring-4 ring-primary/20 shadow-primary/20"
                        : isActive
                          ? "border-primary/50 hover:border-primary"
                          : "border-border/30"
                    )}
                    style={{
                      aspectRatio: '210 / 297',
                    }}
                  >
                    {/* Select button - visible on active slide, small highlight on button only */}
                    {isActive && !isSelected && (
                      <div className="absolute inset-x-0 bottom-0 z-20 p-3 sm:p-4 flex justify-center opacity-0 group-hover:opacity-100 transition-opacity">
                        <Button
                          className="text-sm shadow-lg shadow-primary/20"
                          size="sm"
                          onClick={(e) => {
                            e.stopPropagation()
                            handleSelect(index)
                          }}
                        >
                          Use {variant.name}
                        </Button>
                      </div>
                    )}

                    {/* Resume preview - virtualized: only render nearby slides */}
                    <div className="absolute inset-0 overflow-hidden bg-muted/20 flex items-center justify-center">
                      {shouldRender ? (
                        <ResumePreviewSlot
                          resumeData={resumeData}
                          variant={variant.id}
                          themeMode={themeMode}
                        />
                      ) : (
                        // Placeholder for non-rendered slides (virtualization)
                        <Skeleton className="w-full h-full rounded-lg" />
                      )}
                    </div>
                  </div>

                  {/* Template info below card */}
                  <div className={cn(
                    "mt-2 text-center transition-opacity duration-300 shrink-0",
                    isActive ? "opacity-100" : "opacity-60"
                  )}>
                    <h3 className="text-sm font-semibold">{variant.name}</h3>
                    <p className="text-xs text-muted-foreground">{variant.tagline}</p>
                  </div>
                </div>
              </CarouselItem>
            )
          })}
        </CarouselContent>
      </Carousel>

      {/* Navigation controls */}
      <div className="flex justify-center items-center gap-4 py-3 shrink-0">
        <Button
          variant="outline"
          size="icon"
          className="h-9 w-9 rounded-full border-primary/30 bg-background/80 backdrop-blur-sm hover:bg-primary/10 hover:border-primary/50 transition-all"
          onClick={() => api?.scrollPrev()}
          aria-label="Previous template"
        >
          <ChevronLeft className="h-4 w-4" />
        </Button>

        {/* Dots indicator */}
        <div className="flex gap-2">
          {resumeVariants.map((variant, index) => (
            <button
              key={variant.id}
              onClick={() => api?.scrollTo(index)}
              className={cn(
                "h-2 rounded-full transition-all duration-300",
                current === index
                  ? "w-6 bg-primary"
                  : selectedVariant === variant.id
                    ? "w-2 bg-primary/60"
                    : "w-2 bg-primary/30 hover:bg-primary/50"
              )}
              aria-label={`Go to ${variant.name} template`}
            />
          ))}
        </div>

        <Button
          variant="outline"
          size="icon"
          className="h-9 w-9 rounded-full border-primary/30 bg-background/80 backdrop-blur-sm hover:bg-primary/10 hover:border-primary/50 transition-all"
          onClick={() => api?.scrollNext()}
          aria-label="Next template"
        >
          <ChevronRight className="h-4 w-4" />
        </Button>
      </div>
    </div>
  )
}
