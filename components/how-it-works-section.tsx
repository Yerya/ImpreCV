"use client"

import { AnimateIn } from "@/components/anim/animate-in"
import { cn } from "@/lib/utils"
import { ArrowRight, FileText, Sparkles, Pencil, Download } from "lucide-react"

const STEPS = [
  {
    id: 1,
    label: "Start",
    title: "Start Your Journey",
    description: "Choose to create from scratch, improve an existing resume, or adapt to a specific job posting.",
    icon: FileText,
    color: "text-blue-400",
    bgColor: "bg-blue-400/10",
  },
  {
    id: 2,
    label: "Optimize",
    title: "AI Optimization",
    description: "Our AI analyzes your experience and optimizes keyword matching for ATS systems in every mode.",
    icon: Sparkles,
    color: "text-violet-400",
    bgColor: "bg-violet-400/10",
  },
  {
    id: 3,
    label: "Customize",
    title: "Smart Editing",
    description: "Fine-tune your resume in our real-time editor with AI chat assistance, live preview, and easy section management.",
    icon: Pencil,
    color: "text-emerald-400",
    bgColor: "bg-emerald-400/10",
  },
  {
    id: 4,
    label: "Succeed",
    title: "Download & Apply",
    description: "Export your perfectly formatted resume and cover letter, ready to land your dream job.",
    icon: Download,
    color: "text-amber-400",
    bgColor: "bg-amber-400/10",
  },
]

export function HowItWorksSection() {
  return (
    <section className="pt-24 pb-0 md:py-24 relative z-10">
      <div className="container mx-auto px-4">
        <AnimateIn variant="fadeUp" className="text-center mb-16">
          <h2 className="text-4xl md:text-5xl font-bold mb-4">
            <span className="gradient-text">How ImpreCV Works</span>
          </h2>
          <p className="text-lg text-muted-foreground max-w-2xl mx-auto">
            From idea to interview-ready resume in four simple steps
          </p>
        </AnimateIn>

        <div className="relative max-w-6xl mx-auto">
          <div className="grid grid-cols-1 md:grid-cols-4 gap-12 md:gap-8 relative">
            {STEPS.map((step, index) => {
              const Icon = step.icon
              const isLast = index === STEPS.length - 1

              return (
                <AnimateIn
                  key={step.id}
                  variant="fadeUp"
                  delayMs={index * 150}
                  className="relative group flex flex-col items-center"
                >
                  {/* Step Number Badge */}
                  <div className="relative z-10 flex flex-col items-center text-center">
                    <div
                      className={cn(
                        "w-20 h-20 rounded-2xl flex items-center justify-center mb-4 md:mb-6 transition-all duration-300 group-hover:scale-110 group-hover:shadow-lg border border-white/5",
                        step.bgColor,
                        "backdrop-blur-md relative"
                      )}
                    >
                      <Icon className={cn("w-9 h-9", step.color)} />

                    </div>

                    <div className="hidden md:inline-flex bg-gradient-to-br from-white/5 to-white/0 backdrop-blur-sm px-3 py-1 rounded-full border border-white/10 mb-3 shadow-sm">
                      <span className="text-xs font-semibold tracking-wider text-muted-foreground uppercase">
                        Step 0{step.id}
                      </span>
                    </div>

                    <h3 className="text-xl font-semibold mb-3">{step.title}</h3>
                    <p className="text-sm text-muted-foreground leading-relaxed max-w-[240px]">
                      {step.description}
                    </p>
                  </div>

                  {/* Desktop Connector */}
                  {!isLast && (
                    <div className="hidden md:flex absolute top-10 left-[calc(50%+2.5rem)] right-[calc(-50%+0.5rem)] items-center justify-center z-0">
                      {/* Left line segment */}
                      <div className="h-[2px] w-full bg-muted-foreground/60" />
                      {/* Arrow indicator */}
                      <div className="mx-1 text-muted-foreground relative z-10">
                        <ArrowRight className="w-5 h-5" />
                      </div>
                      {/* Right line segment */}
                      <div className="h-[2px] w-full bg-muted-foreground/60" />
                    </div>
                  )}
                </AnimateIn>
              )
            })}
          </div>
        </div>
      </div>
    </section>
  )
}
