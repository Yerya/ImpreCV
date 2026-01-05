"use client"

import Link from "next/link"
import { Button } from "@/components/ui/button"
import { Card } from "@/components/ui/card"
import { Skeleton } from "@/components/ui/skeleton"
import { ArrowRight, Sparkles } from "lucide-react"
import { GlobalHeader } from "@/components/global-header"
import { useAppSelector } from "@/lib/redux/hooks"
import { AnimateIn } from "@/components/anim/animate-in"
import { MatchJourneySection } from "@/components/match-journey-section"
import { BrandMark } from "@/components/brand-mark"
import { ThreeWaysSection } from "@/components/landing/three-ways-section"
import { FeaturesCarousel } from "@/components/landing/features-carousel"

export default function LandingPage() {
  const { user, isLoading } = useAppSelector((s) => s.auth)

  return (
    <div className="min-h-screen relative">
      <GlobalHeader variant="landing" />

      {/* Hero Section */}
      <AnimateIn
        as="section"
        id="hero-anchor"
        entrance="bubble"
        variant="fadeUp"
        className="relative z-10 min-h-[calc(100dvh-var(--header-h))] flex items-center py-12 md:py-20"
      >
        <div className="container mx-auto px-4 relative z-10">
          <div className="max-w-4xl mx-auto text-center">
            <div className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-secondary/50 border border-border mb-6 md:mb-8">
              <Sparkles className="h-4 w-4 text-primary" />
              <span className="text-sm">AI-Powered Resume Tools</span>
            </div>
            <h1 className="text-4xl md:text-7xl font-bold mb-4 md:mb-6 leading-tight">
              <span className="text-balance">Transform your CV</span>
              <br />
              <span className="gradient-text text-balance">Make it ImpreCV</span>
            </h1>
            <p className="text-lg text-muted-foreground max-w-2xl mx-auto text-balance mb-8 md:mb-10">
              Create from scratch, improve for ATS, or tailor to any job posting. AI that helps you stand out and land interviews.
            </p>
            <div className="flex flex-col sm:flex-row items-center justify-center gap-4">
              {isLoading ? (
                <div className="flex gap-4">
                  <Skeleton className="h-11 w-40 rounded-md" />
                  <Skeleton className="h-11 w-40 rounded-md" />
                </div>
              ) : (
                <>
                  {user ? (
                    <Link href="/dashboard">
                      <Button size="lg" className="px-8">
                        Go to Dashboard
                        <ArrowRight className="ml-2 h-5 w-5" />
                      </Button>
                    </Link>
                  ) : (
                    <>
                      <Link href="/signup">
                        <Button size="lg" className="px-8">
                          Get Started Free
                          <ArrowRight className="ml-2 h-5 w-5" />
                        </Button>
                      </Link>
                      <Link href="#how-it-works">
                        <Button size="lg" variant="outline" className="px-8">
                          See How It Works
                        </Button>
                      </Link>
                    </>
                  )}
                </>
              )}
            </div>
          </div>
        </div>
      </AnimateIn>

      {/* Three Ways Section */}
      <section id="ways" className="py-20 relative z-10">
        <div className="container mx-auto px-4 relative z-10">
          <AnimateIn variant="fadeUp" className="text-center mb-12 md:mb-16">
            <h2 className="text-4xl md:text-5xl font-bold mb-4">
              <span className="gradient-text">Three Ways to Win</span>
            </h2>
            <p className="text-lg text-muted-foreground max-w-2xl mx-auto">
              Choose your path based on where you are in your job search
            </p>
          </AnimateIn>
          <ThreeWaysSection />
        </div>
      </section>

      {/* Features Section */}
      <section id="features" className="py-20 relative z-10 overflow-hidden">
        <div className="container mx-auto px-4 relative z-10">
          <AnimateIn variant="fadeUp" className="text-center mb-12">
            <h2 className="text-4xl md:text-5xl font-bold mb-4">
              <span className="gradient-text">Powerful Features</span>
            </h2>
            <p className="text-lg text-muted-foreground max-w-2xl mx-auto">
              Everything you need to create winning job applications
            </p>
          </AnimateIn>
        </div>
        <AnimateIn variant="fadeUp" delayMs={200}>
          <FeaturesCarousel />
        </AnimateIn>
      </section>

      {/* How It Works / Match Journey */}
      <div id="how-it-works" className="relative z-10">
        <MatchJourneySection />
      </div>

      {/* CTA Section */}
      <AnimateIn
        as="section"
        variant="fadeUp"
        threshold={0.35}
        durationMs={800}
        className="py-20 relative z-10"
        style={{ "--y": "24px" } as React.CSSProperties}
      >
        <div className="container mx-auto px-4 relative z-10">
          <Card className="glass-card max-w-4xl mx-auto p-12 text-center relative z-10">
            <h2 className="text-4xl md:text-5xl font-bold mb-6">
              <span className="gradient-text">Ready to Land Your Dream Job?</span>
            </h2>
            <p className="text-lg text-muted-foreground mb-8 max-w-2xl mx-auto">
              Join thousands of job seekers who have transformed their applications with ImpreCV.
            </p>
            {isLoading ? (
              <div className="flex justify-center">
                <Skeleton className="h-11 w-40 rounded-md" />
              </div>
            ) : (
              <>
                {user ? (
                  <Link href="/dashboard">
                    <Button size="lg" className="px-8">
                      Go to Dashboard
                      <ArrowRight className="ml-2 h-5 w-5" />
                    </Button>
                  </Link>
                ) : (
                  <Link href="/signup">
                    <Button size="lg" className="px-8">
                      Get Started Free
                      <ArrowRight className="ml-2 h-5 w-5" />
                    </Button>
                  </Link>
                )}
              </>
            )}
          </Card>
        </div>
      </AnimateIn>

      {/* Footer */}
      <AnimateIn
        as="footer"
        variant="fadeUp"
        threshold={0.4}
        durationMs={900}
        className="py-12 relative z-10"
        style={{ "--y": "28px" } as React.CSSProperties}
      >
        <div className="container mx-auto px-4">
          <div className="max-w-3xl mx-auto text-center space-y-4">
            <BrandMark
              className="flex items-center justify-center gap-1"
              iconClassName="h-6 w-6"
              textClassName="text-xl font-bold"
            />
            <p className="text-sm text-muted-foreground">
              AI-powered resume and cover letter optimization for job seekers
            </p>
            <p className="pt-2 text-xs text-muted-foreground">&copy; 2025 ImpreCV. All rights reserved.</p>
          </div>
        </div>
      </AnimateIn>
    </div>
  )
}
