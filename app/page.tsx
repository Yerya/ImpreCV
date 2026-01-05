"use client"

import Link from "next/link"
import { Button } from "@/components/ui/button"
import { Card } from "@/components/ui/card"
import { Skeleton } from "@/components/ui/skeleton"
import { ArrowRight, Sparkles, FileText, Target, Zap, Brain, Download, TextSelect, PenTool, TrendingUp, Wand2 } from "lucide-react"
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
          <AnimateIn variant="fadeUp" className="text-center mb-16">
            <h2 className="text-4xl md:text-5xl font-bold mb-4">
              <span className="gradient-text">Three Ways to Win</span>
            </h2>
            <p className="text-lg text-muted-foreground max-w-2xl mx-auto">
              Choose your path based on where you are in your job search
            </p>
          </AnimateIn>
          <div className="grid md:grid-cols-3 gap-8 max-w-5xl mx-auto">
            <AnimateIn variant="fadeUp" delayMs={0} className="h-full">
              <Card className="glass-card p-8 hover:border-primary/50 transition-all relative z-10 h-full group flex flex-col">
                <div className="h-14 w-14 rounded-2xl bg-gradient-to-br from-violet-500/20 to-violet-500/5 flex items-center justify-center mb-5">
                  <PenTool className="h-7 w-7 text-violet-400" />
                </div>
                <h3 className="text-xl font-semibold mb-3">Create from Scratch</h3>
                <p className="text-muted-foreground mb-4 flex-grow">
                  No resume yet? Answer a few questions and AI will craft a professional resume tailored to your target role.
                </p>
                <ul className="space-y-2 text-sm text-muted-foreground mt-auto">
                  <li className="flex items-center gap-2">
                    <div className="h-1.5 w-1.5 rounded-full bg-violet-400" />
                    AI-powered content writing
                  </li>
                  <li className="flex items-center gap-2">
                    <div className="h-1.5 w-1.5 rounded-full bg-violet-400" />
                    Industry-specific optimization
                  </li>
                  <li className="flex items-center gap-2">
                    <div className="h-1.5 w-1.5 rounded-full bg-violet-400" />
                    Professional templates
                  </li>
                </ul>
              </Card>
            </AnimateIn>
            <AnimateIn variant="fadeUp" delayMs={100} className="h-full">
              <Card className="glass-card p-8 hover:border-primary/50 transition-all relative z-10 h-full flex flex-col">
                <div className="h-14 w-14 rounded-2xl bg-gradient-to-br from-emerald-500/20 to-emerald-500/5 flex items-center justify-center mb-5">
                  <Wand2 className="h-7 w-7 text-emerald-400" />
                </div>
                <h3 className="text-xl font-semibold mb-3">Improve Existing</h3>
                <p className="text-muted-foreground mb-4 flex-grow">
                  Have a resume? Make it ATS-friendly, add impact to your bullets, and polish it for any industry.
                </p>
                <ul className="space-y-2 text-sm text-muted-foreground mt-auto">
                  <li className="flex items-center gap-2">
                    <div className="h-1.5 w-1.5 rounded-full bg-emerald-400" />
                    ATS keyword optimization
                  </li>
                  <li className="flex items-center gap-2">
                    <div className="h-1.5 w-1.5 rounded-full bg-emerald-400" />
                    Stronger bullet points
                  </li>
                  <li className="flex items-center gap-2">
                    <div className="h-1.5 w-1.5 rounded-full bg-emerald-400" />
                    Professional formatting
                  </li>
                </ul>
              </Card>
            </AnimateIn>
            <AnimateIn variant="fadeUp" delayMs={200} className="h-full">
              <Card className="glass-card-primary p-8 hover:border-primary transition-all relative z-10 h-full border-primary/30 flex flex-col">
                <div className="absolute -top-2.5 left-6 px-3 py-0.5 text-xs font-medium bg-primary text-primary-foreground rounded-full">
                  Most Popular
                </div>
                <div className="h-14 w-14 rounded-2xl bg-gradient-to-br from-primary/30 to-primary/10 flex items-center justify-center mb-5">
                  <Target className="h-7 w-7 text-primary" />
                </div>
                <h3 className="text-xl font-semibold mb-3">Adapt to Job</h3>
                <p className="text-muted-foreground mb-4 flex-grow">
                  Applying to a specific role? AI tailors your resume to match the job requirements perfectly.
                </p>
                <ul className="space-y-2 text-sm text-muted-foreground mt-auto">
                  <li className="flex items-center gap-2">
                    <div className="h-1.5 w-1.5 rounded-full bg-primary" />
                    Match score analysis
                  </li>
                  <li className="flex items-center gap-2">
                    <div className="h-1.5 w-1.5 rounded-full bg-primary" />
                    Auto cover letter
                  </li>
                  <li className="flex items-center gap-2">
                    <div className="h-1.5 w-1.5 rounded-full bg-primary" />
                    Skills gap insights
                  </li>
                </ul>
              </Card>
            </AnimateIn>
          </div>
        </div>
      </section>

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
                  <TrendingUp className="h-6 w-6 text-primary" />
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
                <h3 className="text-xl font-semibold mb-2">Smart Rewrite</h3>
                <p className="text-muted-foreground">
                  AI rewrites your resume to highlight relevant experience and match job requirements.
                </p>
              </Card>
            </AnimateIn>
            <AnimateIn variant="fadeUp" delayMs={300} className="h-full">
              <Card className="glass-card p-6 hover:border-border transition-all relative z-10 h-full">
                <div className="h-12 w-12 rounded-2xl bg-primary/10 flex items-center justify-center mb-4">
                  <TextSelect className="h-6 w-6 text-primary" />
                </div>
                <h3 className="text-xl font-semibold mb-2">Cover Letters</h3>
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
                <h3 className="text-xl font-semibold mb-2">ATS Optimization</h3>
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
                <h3 className="text-xl font-semibold mb-2">PDF Export</h3>
                <p className="text-muted-foreground">
                  Download your optimized resume and cover letter in professional PDF formats.
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
