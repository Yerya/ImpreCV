"use client"

import Link from "next/link"
import { Button } from "@/components/ui/button"
import { Card } from "@/components/ui/card"
import { ArrowRight, Sparkles, FileText, Target, Zap, Upload, Brain, Download } from "lucide-react"
import { GlobalHeader } from "@/components/global-header"
import { useAppSelector } from "@/lib/redux/hooks"
import { AnimateIn } from "@/components/anim/animate-in"
import { MatchJourneySection } from "@/components/match-journey-section"
import { BrandMark } from "@/components/brand-mark"

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
              <span className="text-sm">AI-Powered Career Tools</span>
            </div>
            <h1 className="text-4xl md:text-7xl font-bold mb-4 md:mb-6 leading-tight">
              <span className="text-balance">Transform your CV</span>
              <br />
              <span className="gradient-text text-balance">Make it ImpreCV</span>
            </h1>
            <p className="text-lg text-muted-foreground max-w-2xl mx-auto text-balance mb-8 md:mb-10">
              Upload your resume, paste a job posting, and let AI analyze, optimize, and rewrite your application
              materials to match perfectly.
            </p>
            <div className="flex flex-col sm:flex-row items-center justify-center gap-4">
              {!isLoading && (
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

      {/* Features Section */}
      <section id="features" className="py-20 relative z-10">
        <div className="container mx-auto px-4 relative z-10">
          <AnimateIn variant="fadeUp" className="text-center mb-16">
            <h2 className="text-4xl md:text-5xl font-bold mb-4">
              <span className="gradient-text">Powerful Features</span>
            </h2>
            <p className="text-lg text-muted-foreground max-w-2xl mx-auto">
              Everything you need to create winning job applications
            </p>
          </AnimateIn>
          <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6 max-w-6xl mx-auto">
            <AnimateIn variant="fadeUp" delayMs={0} className="h-full">
              <Card className="glass-card p-6 hover:border-border transition-all relative z-10 h-full">
                <div className="h-12 w-12 rounded-2xl bg-primary/10 flex items-center justify-center mb-4">
                  <Brain className="h-6 w-6 text-primary" />
                </div>
                <h3 className="text-xl font-semibold mb-2">AI Analysis</h3>
                <p className="text-muted-foreground">
                  Advanced AI analyzes your resume against job requirements to identify strengths and gaps.
                </p>
              </Card>
            </AnimateIn>
            <AnimateIn variant="fadeUp" delayMs={100} className="h-full">
              <Card className="glass-card p-6 hover:border-border transition-all relative z-10 h-full">
                <div className="h-12 w-12 rounded-2xl bg-primary/10 flex items-center justify-center mb-4">
                  <Target className="h-6 w-6 text-primary" />
                </div>
                <h3 className="text-xl font-semibold mb-2">Match Score</h3>
                <p className="text-muted-foreground">
                  Get a detailed compatibility score showing how well your resume matches the job posting.
                </p>
              </Card>
            </AnimateIn>
            <AnimateIn variant="fadeUp" delayMs={200} className="h-full">
              <Card className="glass-card p-6 hover:border-border transition-all relative z-10 h-full">
                <div className="h-12 w-12 rounded-2xl bg-primary/10 flex items-center justify-center mb-4">
                  <FileText className="h-6 w-6 text-primary" />
                </div>
                <h3 className="text-xl font-semibold mb-2">Resume Rewrite</h3>
                <p className="text-muted-foreground">
                  AI rewrites your resume to highlight relevant experience and match job requirements.
                </p>
              </Card>
            </AnimateIn>
            <AnimateIn variant="fadeUp" delayMs={300} className="h-full">
              <Card className="glass-card p-6 hover:border-border transition-all relative z-10 h-full">
                <div className="h-12 w-12 rounded-2xl bg-primary/10 flex items-center justify-center mb-4">
                  <Sparkles className="h-6 w-6 text-primary" />
                </div>
                <h3 className="text-xl font-semibold mb-2">Cover Letter Generator</h3>
                <p className="text-muted-foreground">
                  Generate personalized cover letters that showcase your fit for the specific role.
                </p>
              </Card>
            </AnimateIn>
            <AnimateIn variant="fadeUp" delayMs={400} className="h-full">
              <Card className="glass-card p-6 hover:border-border transition-all relative z-10 h-full">
                <div className="h-12 w-12 rounded-2xl bg-primary/10 flex items-center justify-center mb-4">
                  <Zap className="h-6 w-6 text-primary" />
                </div>
                <h3 className="text-xl font-semibold mb-2">Keyword Optimization</h3>
                <p className="text-muted-foreground">
                  Optimize your resume with relevant keywords to pass ATS systems and get noticed.
                </p>
              </Card>
            </AnimateIn>
            <AnimateIn variant="fadeUp" delayMs={500} className="h-full">
              <Card className="glass-card p-6 hover:border-border transition-all relative z-10 h-full">
                <div className="h-12 w-12 rounded-2xl bg-primary/10 flex items-center justify-center mb-4">
                  <Download className="h-6 w-6 text-primary" />
                </div>
                <h3 className="text-xl font-semibold mb-2">Export Ready</h3>
                <p className="text-muted-foreground">
                  Download your optimized resume and cover letter in professional formats.
                </p>
              </Card>
            </AnimateIn>
          </div>
        </div>
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
        style={{ ["--y" as any]: "24px" } as any}
      >
        <div className="container mx-auto px-4 relative z-10">
          <Card className="glass-card max-w-4xl mx-auto p-12 text-center relative z-10">
            <h2 className="text-4xl md:text-5xl font-bold mb-6">
              <span className="gradient-text">Ready to Land Your Dream Job?</span>
            </h2>
            <p className="text-lg text-muted-foreground mb-8 max-w-2xl mx-auto">
              Join thousands of job seekers who have transformed their applications with ImpreCV.
            </p>
            {!isLoading && (
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
        style={{ ["--y" as any]: "28px" } as any}
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
