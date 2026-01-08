"use client"

import * as React from "react"
import { Card } from "@/components/ui/card"
import { Accordion, AccordionContent, AccordionItem, AccordionTrigger } from "@/components/ui/accordion"
import { AnimateIn } from "@/components/anim/animate-in"
import { cn } from "@/lib/utils"
import { PenTool, Wand2, Target } from "lucide-react"

const WAYS = [
  {
    id: "create",
    icon: PenTool,
    iconColor: "text-violet-400",
    bgColor: "from-violet-500/20 to-violet-500/5",
    dotColor: "bg-violet-400",
    title: "Create from Scratch",
    description: "No resume yet? Answer a few questions and AI will craft a professional resume tailored to your target role.",
    features: [
      "AI-powered content writing",
      "Industry-specific optimization", 
      "Professional templates",
    ],
  },
  {
    id: "improve",
    icon: Wand2,
    iconColor: "text-emerald-400",
    bgColor: "from-emerald-500/20 to-emerald-500/5",
    dotColor: "bg-emerald-400",
    title: "Improve Existing",
    description: "Have a resume? Make it ATS-friendly, add impact to your bullets, and polish it for any industry.",
    features: [
      "ATS keyword optimization",
      "Stronger bullet points",
      "Professional formatting",
    ],
  },
  {
    id: "adapt",
    icon: Target,
    iconColor: "text-primary",
    bgColor: "from-primary/30 to-primary/10",
    dotColor: "bg-primary",
    title: "Adapt to Job",
    description: "Applying to a specific role? AI tailors your resume to match the job requirements and highlights skill gaps with interview tips.",
    features: [
      "Skill analysis & match score",
      "Interview tips",
      "Auto cover letter",
    ],
    isPopular: true,
  },
]

interface ThreeWaysSectionProps {
  className?: string
}

export function ThreeWaysSection({ className }: ThreeWaysSectionProps) {
  return (
    <div className={cn("max-w-5xl mx-auto", className)}>
      {/* Desktop: Grid layout */}
      <div className="hidden md:grid md:grid-cols-3 gap-8">
        {WAYS.map((way, index) => {
          const Icon = way.icon
          return (
            <AnimateIn key={way.id} variant="fadeUp" delayMs={index * 100} className="h-full">
              <Card 
                className={cn(
                  "p-8 hover:border-primary/50 transition-all relative z-10 h-full group flex flex-col",
                  way.isPopular 
                    ? "glass-card-primary border-primary/30" 
                    : "glass-card"
                )}
              >
                {way.isPopular && (
                  <div className="absolute -top-2.5 left-6 px-3 py-0.5 text-xs font-medium bg-primary text-primary-foreground rounded-full">
                    Most Popular
                  </div>
                )}
                <div className={cn(
                  "h-14 w-14 rounded-2xl bg-gradient-to-br flex items-center justify-center mb-5",
                  way.bgColor
                )}>
                  <Icon className={cn("h-7 w-7", way.iconColor)} />
                </div>
                <h3 className="text-xl font-semibold mb-3">{way.title}</h3>
                <p className="text-muted-foreground mb-4 flex-grow">
                  {way.description}
                </p>
                <ul className="space-y-2 text-sm text-muted-foreground mt-auto">
                  {way.features.map((feature, idx) => (
                    <li key={idx} className="flex items-center gap-2">
                      <div className={cn("h-1.5 w-1.5 rounded-full", way.dotColor)} />
                      {feature}
                    </li>
                  ))}
                </ul>
              </Card>
            </AnimateIn>
          )
        })}
      </div>

      {/* Mobile: Accordion layout */}
      <div className="md:hidden">
        <Accordion type="single" defaultValue="adapt" collapsible className="space-y-3">
          {WAYS.map((way) => {
            const Icon = way.icon
            return (
              <AccordionItem 
                key={way.id} 
                value={way.id}
                className={cn(
                  "border rounded-2xl px-4 overflow-hidden transition-all data-[state=open]:shadow-lg",
                  way.isPopular 
                    ? "glass-card-primary border-primary/30 data-[state=open]:border-primary/50" 
                    : "glass-card data-[state=open]:border-primary/30"
                )}
              >
                <AccordionTrigger className="py-4 hover:no-underline gap-3">
                  <div className="flex items-center gap-3 flex-1">
                    <div className={cn(
                      "h-10 w-10 rounded-xl bg-gradient-to-br flex items-center justify-center shrink-0",
                      way.bgColor
                    )}>
                      <Icon className={cn("h-5 w-5", way.iconColor)} />
                    </div>
                    <div className="text-left">
                      <div className="flex items-center gap-2">
                        <span className="font-semibold">{way.title}</span>
                        {way.isPopular && (
                          <span className="px-2 py-0.5 text-[10px] font-medium bg-primary text-primary-foreground rounded-full">
                            Popular
                          </span>
                        )}
                      </div>
                    </div>
                  </div>
                </AccordionTrigger>
                <AccordionContent className="pb-4">
                  <div className="pl-13 space-y-4">
                    <p className="text-sm text-muted-foreground leading-relaxed">
                      {way.description}
                    </p>
                    <ul className="space-y-2 text-sm text-muted-foreground">
                      {way.features.map((feature, idx) => (
                        <li key={idx} className="flex items-center gap-2">
                          <div className={cn("h-1.5 w-1.5 rounded-full shrink-0", way.dotColor)} />
                          {feature}
                        </li>
                      ))}
                    </ul>
                  </div>
                </AccordionContent>
              </AccordionItem>
            )
          })}
        </Accordion>
      </div>
    </div>
  )
}
