"use client"

import Link from "next/link"
import { Button } from "@/components/ui/button"
import { Card } from "@/components/ui/card"
import { AnimatedBackground } from "@/components/ui/animated-background"
import { ArrowRight, Sparkles, FileText, Target, Zap, Upload, Brain, Download } from "lucide-react"
import { GlobalHeader } from "@/components/global-header"
import { useAppSelector } from "@/lib/redux/hooks"

export default function LandingPage() {
  const { user, isLoading } = useAppSelector((s) => s.auth)


  return (
    <div className="min-h-screen bg-background relative">
      <AnimatedBackground intensity={0.5} className="fixed inset-0 z-0" />
      <AnimatedBackground intensity={0.4} className="fixed inset-0 z-0" />
      
      <GlobalHeader variant="landing" />

      {/* Hero Section */}
      <section className="relative z-10 pt-32 pb-20">
        <div className="container mx-auto px-4 relative z-10">
          <div className="max-w-4xl mx-auto text-center">
            <div className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-secondary/50 border border-border mb-8">
              <Sparkles className="h-4 w-4 text-primary" />
              <span className="text-sm">AI-Powered Career Tools</span>
            </div>
            <h1 className="text-5xl md:text-7xl font-bold mb-6 leading-tight">
              <span className="gradient-text">Transform Your Resume</span>
              <br />
              <span className="text-balance">For Every Job Application</span>
            </h1>
            <p className="text-xl text-muted-foreground mb-10 max-w-2xl mx-auto text-balance">
              Upload your resume, paste a job posting, and let AI analyze, optimize, and rewrite your application
              materials to match perfectly.
            </p>
            <div className="flex flex-col sm:flex-row items-center justify-center gap-4">
              {!isLoading && (
                <>
                  {user ? (
                    <Link href="/dashboard">
                      <Button size="lg" className="text-base px-8">
                        Go to Dashboard
                        <ArrowRight className="ml-2 h-5 w-5" />
                      </Button>
                    </Link>
                  ) : (
                    <>
                      <Link href="/signup">
                        <Button size="lg" className="text-base px-8">
                          Get Started Free
                          <ArrowRight className="ml-2 h-5 w-5" />
                        </Button>
                      </Link>
                      <Link href="#how-it-works">
                        <Button size="lg" variant="outline" className="text-base px-8 bg-transparent">
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
      </section>

      {/* Features Section */}
      <section id="features" className="py-20 relative z-10">
        <div className="container mx-auto px-4 relative z-10">
          <div className="text-center mb-16">
            <h2 className="text-4xl md:text-5xl font-bold mb-4">
              <span className="gradient-text">Powerful Features</span>
            </h2>
            <p className="text-xl text-muted-foreground max-w-2xl mx-auto">
              Everything you need to create winning job applications
            </p>
          </div>
          <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6 max-w-6xl mx-auto">
            <Card className="glass-card p-6 hover:border-border transition-all relative z-10">
              <div className="h-12 w-12 rounded-2xl bg-primary/10 flex items-center justify-center mb-4">
                <Brain className="h-6 w-6 text-primary" />
              </div>
              <h3 className="text-xl font-semibold mb-2">AI Analysis</h3>
              <p className="text-muted-foreground">
                Advanced AI analyzes your resume against job requirements to identify strengths and gaps.
              </p>
            </Card>
            <Card className="glass-card p-6 hover:border-border transition-all relative z-10">
              <div className="h-12 w-12 rounded-2xl bg-primary/10 flex items-center justify-center mb-4">
                <Target className="h-6 w-6 text-primary" />
              </div>
              <h3 className="text-xl font-semibold mb-2">Match Score</h3>
              <p className="text-muted-foreground">
                Get a detailed compatibility score showing how well your resume matches the job posting.
              </p>
            </Card>
            <Card className="glass-card p-6 hover:border-border transition-all relative z-10">
              <div className="h-12 w-12 rounded-2xl bg-primary/10 flex items-center justify-center mb-4">
                <FileText className="h-6 w-6 text-primary" />
              </div>
              <h3 className="text-xl font-semibold mb-2">Resume Rewrite</h3>
              <p className="text-muted-foreground">
                AI rewrites your resume to highlight relevant experience and match job requirements.
              </p>
            </Card>
            <Card className="glass-card p-6 hover:border-border transition-all relative z-10">
              <div className="h-12 w-12 rounded-2xl bg-primary/10 flex items-center justify-center mb-4">
                <Sparkles className="h-6 w-6 text-primary" />
              </div>
              <h3 className="text-xl font-semibold mb-2">Cover Letter Generator</h3>
              <p className="text-muted-foreground">
                Generate personalized cover letters that showcase your fit for the specific role.
              </p>
            </Card>
            <Card className="glass-card p-6 hover:border-border transition-all relative z-10">
              <div className="h-12 w-12 rounded-2xl bg-primary/10 flex items-center justify-center mb-4">
                <Zap className="h-6 w-6 text-primary" />
              </div>
              <h3 className="text-xl font-semibold mb-2">Keyword Optimization</h3>
              <p className="text-muted-foreground">
                Optimize your resume with relevant keywords to pass ATS systems and get noticed.
              </p>
            </Card>
            <Card className="glass-card p-6 hover:border-border transition-all relative z-10">
              <div className="h-12 w-12 rounded-2xl bg-primary/10 flex items-center justify-center mb-4">
                <Download className="h-6 w-6 text-primary" />
              </div>
              <h3 className="text-xl font-semibold mb-2">Export Ready</h3>
              <p className="text-muted-foreground">
                Download your optimized resume and cover letter in professional formats.
              </p>
            </Card>
          </div>
        </div>
      </section>

      {/* How It Works Section */}
      <section id="how-it-works" className="py-20 relative z-10">
        <div className="container mx-auto px-4">
          <div className="text-center mb-16">
            <h2 className="text-4xl md:text-5xl font-bold mb-4">
              <span className="gradient-text">How It Works</span>
            </h2>
            <p className="text-xl text-muted-foreground max-w-2xl mx-auto">
              Get your optimized resume in three simple steps
            </p>
          </div>
          <div className="grid md:grid-cols-3 gap-8 max-w-5xl mx-auto">
            <div className="text-center">
              <div className="h-16 w-16 rounded-2xl bg-gradient-to-br from-primary/20 to-primary/5 flex items-center justify-center mx-auto mb-6 border border-border/50">
                <Upload className="h-8 w-8 text-foreground" />
              </div>
              <div className="text-4xl font-bold text-foreground mb-4">01</div>
              <h3 className="text-xl font-semibold mb-3">Upload & Input</h3>
              <p className="text-muted-foreground">
                Upload your current resume and paste the job posting you're applying for.
              </p>
            </div>
            <div className="text-center">
              <div className="h-16 w-16 rounded-2xl bg-gradient-to-br from-primary/20 to-primary/5 flex items-center justify-center mx-auto mb-6 border border-border/50">
                <Brain className="h-8 w-8 text-foreground" />
              </div>
              <div className="text-4xl font-bold text-foreground mb-4">02</div>
              <h3 className="text-xl font-semibold mb-3">AI Analysis</h3>
              <p className="text-muted-foreground">
                Our AI analyzes the match, identifies gaps, and provides detailed recommendations.
              </p>
            </div>
            <div className="text-center">
              <div className="h-16 w-16 rounded-2xl bg-gradient-to-br from-primary/20 to-primary/5 flex items-center justify-center mx-auto mb-6 border border-border/50">
                <Download className="h-8 w-8 text-foreground" />
              </div>
              <div className="text-4xl font-bold text-foreground mb-4">03</div>
              <h3 className="text-xl font-semibold mb-3">Get Results</h3>
              <p className="text-muted-foreground">
                Download your optimized resume and personalized cover letter ready to submit.
              </p>
            </div>
          </div>
        </div>
      </section>

      {/* CTA Section */}
      <section className="py-20 relative z-10">
        <div className="container mx-auto px-4 relative z-10">
          <Card className="glass-card max-w-4xl mx-auto p-12 text-center relative z-10">
            <h2 className="text-4xl md:text-5xl font-bold mb-6">
              <span className="gradient-text">Ready to Land Your Dream Job?</span>
            </h2>
            <p className="text-xl text-muted-foreground mb-8 max-w-2xl mx-auto">
              Join thousands of job seekers who have transformed their applications with CVify.
            </p>
            {!isLoading && (
              <>
                {user ? (
                  <Link href="/dashboard">
                    <Button size="lg" className="text-base px-8">
                      Go to Dashboard
                      <ArrowRight className="ml-2 h-5 w-5" />
                    </Button>
                  </Link>
                ) : (
                  <Link href="/signup">
                    <Button size="lg" className="text-base px-8">
                      Get Started Free
                      <ArrowRight className="ml-2 h-5 w-5" />
                    </Button>
                  </Link>
                )}
              </>
            )}
          </Card>
        </div>
      </section>

      {/* Footer */}
      <footer className="py-12 relative z-10">
        <div className="container mx-auto px-4">
          <div className="grid md:grid-cols-4 gap-8 mb-8">
            <div>
              <div className="flex items-center gap-2 mb-4">
                <Sparkles className="h-5 w-5" />
                <span className="font-bold">CVify</span>
              </div>
              <p className="text-sm text-muted-foreground">
                AI-powered resume and cover letter optimization for job seekers.
              </p>
            </div>
            <div>
              <h4 className="font-semibold mb-4">Product</h4>
              <ul className="space-y-2 text-sm text-muted-foreground">
                <li>
                  <Link href="#features" className="hover:text-foreground transition-colors">
                    Features
                  </Link>
                </li>
                <li>
                  <Link href="#how-it-works" className="hover:text-foreground transition-colors">
                    How It Works
                  </Link>
                </li>
              </ul>
            </div>
            <div>
              <h4 className="font-semibold mb-4">Company</h4>
              <ul className="space-y-2 text-sm text-muted-foreground">
                <li>
                  <Link href="#" className="hover:text-foreground transition-colors">
                    About
                  </Link>
                </li>
                <li>
                  <Link href="#" className="hover:text-foreground transition-colors">
                    Blog
                  </Link>
                </li>
                <li>
                  <Link href="#" className="hover:text-foreground transition-colors">
                    Careers
                  </Link>
                </li>
              </ul>
            </div>
            <div>
              <h4 className="font-semibold mb-4">Legal</h4>
              <ul className="space-y-2 text-sm text-muted-foreground">
                <li>
                  <Link href="#" className="hover:text-foreground transition-colors">
                    Privacy
                  </Link>
                </li>
                <li>
                  <Link href="#" className="hover:text-foreground transition-colors">
                    Terms
                  </Link>
                </li>
                <li>
                  <Link href="#" className="hover:text-foreground transition-colors">
                    Security
                  </Link>
                </li>
              </ul>
            </div>
          </div>
          <div className="pt-8 text-center text-sm text-muted-foreground">
            <p>&copy; 2025 CVify. All rights reserved.</p>
          </div>
        </div>
      </footer>
    </div>
  )
}
