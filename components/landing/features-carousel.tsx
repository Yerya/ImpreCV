"use client"

import * as React from "react"
import { Card } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { 
  Carousel, 
  CarouselContent, 
  CarouselItem,
  type CarouselApi 
} from "@/components/ui/carousel"
import { cn } from "@/lib/utils"
import { Brain, TrendingUp, FileText, TextSelect, Zap, Download, ChevronLeft, ChevronRight } from "lucide-react"

const FEATURES = [
  {
    icon: Brain,
    title: "AI Analysis",
    description: "Advanced AI analyzes your resume against job requirements to identify strengths and gaps.",
  },
  {
    icon: TrendingUp,
    title: "Match Score",
    description: "Get a detailed compatibility score showing how well your resume matches the job posting.",
  },
  {
    icon: FileText,
    title: "Smart Rewrite",
    description: "AI rewrites your resume to highlight relevant experience and match job requirements.",
  },
  {
    icon: TextSelect,
    title: "Cover Letters",
    description: "Generate personalized cover letters that showcase your fit for the specific role.",
  },
  {
    icon: Zap,
    title: "ATS Optimization",
    description: "Optimize your resume with relevant keywords to pass ATS systems and get noticed.",
  },
  {
    icon: Download,
    title: "PDF Export",
    description: "Download your optimized resume and cover letter in professional PDF formats.",
  },
]

export function FeaturesCarousel() {
  const [api, setApi] = React.useState<CarouselApi>()
  const [current, setCurrent] = React.useState(0)

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

  return (
    <div className="w-full">
      <Carousel
        setApi={setApi}
        opts={{
          align: "center",
          loop: true,
          duration: 20,
        }}
        className="w-full"
      >
        <CarouselContent className="-ml-2 md:-ml-4">
          {FEATURES.map((feature, index) => {
            const Icon = feature.icon
            const isActive = current === index
            
            return (
              <CarouselItem 
                key={index} 
                className="pl-2 md:pl-4 basis-[70%] sm:basis-[50%] md:basis-[40%] lg:basis-[30%] no-select"
              >
                <div 
                  className={cn(
                    "transition-all duration-500 ease-out h-full",
                    isActive 
                      ? "scale-100 opacity-100" 
                      : "scale-[0.92] opacity-60"
                  )}
                >
                  <Card 
                    className={cn(
                      "p-6 h-full min-h-[220px] transition-all duration-500 relative overflow-hidden",
                      isActive 
                        ? "glass-card-primary border-primary/40 shadow-lg shadow-primary/10" 
                        : "glass-card border-border/50"
                    )}
                  >
                    {/* Glow effect for active card */}
                    {isActive && (
                      <div className="absolute inset-0 bg-gradient-to-br from-primary/5 via-transparent to-primary/5 pointer-events-none" />
                    )}
                    
                    <div className="relative z-10">
                      <div 
                        className={cn(
                          "h-12 w-12 rounded-2xl bg-gradient-to-br flex items-center justify-center mb-4 transition-all duration-500",
                          isActive 
                            ? "from-[var(--gradient-2)]/30 to-[var(--gradient-3)]/10" 
                            : "from-muted-foreground/20 to-muted-foreground/5"
                        )}
                      >
                        <Icon 
                          className={cn(
                            "h-6 w-6",
                            isActive ? "text-[var(--gradient-2)]" : "text-muted-foreground"
                          )} 
                        />
                      </div>
                      <h3 
                        className={cn(
                          "text-xl font-semibold mb-2",
                          isActive ? "text-foreground" : "text-foreground/80"
                        )}
                      >
                        {feature.title}
                      </h3>
                      <p 
                        className={cn(
                          "text-sm leading-relaxed",
                          isActive ? "text-muted-foreground" : "text-muted-foreground/70"
                        )}
                      >
                        {feature.description}
                      </p>
                    </div>
                  </Card>
                </div>
              </CarouselItem>
            )
          })}
        </CarouselContent>
      </Carousel>
      
      {/* Dots indicator with arrows */}
      <div className="flex justify-center items-center gap-4 mt-8">
        <Button
          variant="outline"
          size="icon"
          className="h-9 w-9 rounded-full border-primary/30 bg-background/80 backdrop-blur-sm hover:bg-primary/10 hover:border-primary/50 transition-all"
          onClick={() => api?.scrollPrev()}
          aria-label="Previous slide"
        >
          <ChevronLeft className="h-5 w-5" />
        </Button>
        
        <div className="flex gap-2">
          {FEATURES.map((_, index) => (
            <button
              key={index}
              onClick={() => api?.scrollTo(index)}
              className={cn(
                "h-2 rounded-full transition-all duration-300",
                current === index 
                  ? "w-6 bg-primary" 
                  : "w-2 bg-primary/30 hover:bg-primary/50"
              )}
              aria-label={`Go to slide ${index + 1}`}
            />
          ))}
        </div>
        
        <Button
          variant="outline"
          size="icon"
          className="h-9 w-9 rounded-full border-primary/30 bg-background/80 backdrop-blur-sm hover:bg-primary/10 hover:border-primary/50 transition-all"
          onClick={() => api?.scrollNext()}
          aria-label="Next slide"
        >
          <ChevronRight className="h-5 w-5" />
        </Button>
      </div>
    </div>
  )
}
