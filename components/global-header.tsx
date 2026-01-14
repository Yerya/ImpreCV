"use client"

import { useState, useEffect, useRef } from "react"
import Link from "next/link"
import { usePathname, useRouter } from "next/navigation"
import { Button } from "@/components/ui/button"
import { ArrowLeft, LogOut, Settings, Menu, X, ListChecks, Route, LayoutDashboard, FileText } from "lucide-react"
import { ThemeToggle } from "@/components/theme-toggle"
import { PaletteToggle } from "@/components/palette-toggle"
import { useAppDispatch, useAppSelector } from "@/lib/redux/hooks"
import { signOutThunk } from "@/features/auth/authSlice"
import { AnimatePresence, motion } from "framer-motion"
import { BrandMark } from "@/components/brand-mark"

interface GlobalHeaderProps {
  variant?: "landing" | "dashboard" | "back"
  backHref?: string
  backLabel?: string
}

export function GlobalHeader({
  variant = "landing",
  backHref = "/dashboard",
  backLabel = "Back to Dashboard"
}: GlobalHeaderProps) {
  const pathname = usePathname()
  const router = useRouter()
  const dispatch = useAppDispatch()
  const { user, isLoading } = useAppSelector((s) => s.auth)
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false)
  const [mounted, setMounted] = useState(false)

  const isLandingPage = pathname === "/"
  const isDashboardPage = pathname === "/dashboard"
  const isSettingsPage = pathname === "/settings"
  const isResumeEditorPage = pathname?.startsWith("/resume-editor")

  const menuRef = useRef<HTMLDivElement>(null)
  const buttonRef = useRef<HTMLButtonElement>(null)

  // Track when component is mounted to prevent hydration mismatches
  useEffect(() => {
    setMounted(true)
  }, [])

  // Close menu when clicking outside
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      // Ignore if clicking the toggle button (it handles its own logic)
      if (buttonRef.current && buttonRef.current.contains(event.target as Node)) {
        return
      }

      if (menuRef.current && !menuRef.current.contains(event.target as Node) && isMobileMenuOpen) {
        setIsMobileMenuOpen(false)
      }
    }

    document.addEventListener("mousedown", handleClickOutside)
    return () => {
      document.removeEventListener("mousedown", handleClickOutside)
    }
  }, [isMobileMenuOpen])

  // Close menu when route changes
  useEffect(() => {
    setIsMobileMenuOpen(false)
  }, [pathname])

  const handleLogout = async () => {
    await dispatch(signOutThunk())
    // Redirect based on current page
    const protectedPaths = ["/dashboard", "/analysis", "/resume-rewrite", "/cover-letter", "/settings"]
    const isProtectedPath = protectedPaths.some((path) => pathname.startsWith(path))

    if (isProtectedPath) {
      router.push("/login")
    } else {
      router.push("/")
    }
    router.refresh()
  }

  const handleBack = () => {
    // Instead of using router.back() which can lead to deleted resume URLs,
    // we always navigate to the safe backHref (typically dashboard)
    router.push(backHref)
  }

  return (
    <header className="sticky top-0 left-0 right-0 z-50 w-full">
      <div className="glass-chrome glass-chrome-top w-full max-w-screen-2xl mx-auto overflow-hidden backdrop-blur-xl backdrop-saturate-125">
        <div className="px-4 h-[var(--header-h)] flex items-center justify-between relative">
          {/* Left side - Logo or Back button */}
          <div className="flex items-center">
            {variant === "back" ? (
              <Button variant="ghost" size="icon" aria-label={backLabel} onClick={handleBack}>
                <ArrowLeft className="h-5 w-5" />
              </Button>
            ) : (
              <Link href="/" className="flex items-center gap-1">
                <BrandMark className="flex items-center gap-1" />
              </Link>
            )}
          </div>

          {/* Center - Navigation (only on landing page, large screens) */}
          {variant === "landing" && (
            <nav className="hidden lg:flex items-center gap-8 absolute left-1/2 transform -translate-x-1/2">
              <Link href="#features" className="text-sm text-muted-foreground hover:text-foreground transition-colors">
                Features
              </Link>
              <Link
                href="#how-it-works"
                className="text-sm text-muted-foreground hover:text-foreground transition-colors"
              >
                How It Works
              </Link>
            </nav>
          )}

          {/* Right side - Theme toggle and auth buttons */}
          <div className="flex items-center gap-2 sm:gap-3">
            <PaletteToggle />
            <ThemeToggle />

            {/* Mobile Menu Toggle */}
            <Button
              ref={buttonRef}
              variant="ghost"
              size="icon"
              className="lg:hidden"
              onClick={() => setIsMobileMenuOpen(!isMobileMenuOpen)}
              aria-label="Toggle menu"
            >
              {isMobileMenuOpen ? <X className="h-5 w-5" /> : <Menu className="h-5 w-5" />}
            </Button>

            {/* Desktop Auth Buttons */}
            <div className="hidden lg:flex items-center gap-2">
              {!isLoading && (
                <>
                  {user ? (
                    <>
                      {isLandingPage ? (
                        <>
                          <Link href="/dashboard">
                            <Button variant="ghost" size="sm" className="px-2 sm:px-3">
                              <LayoutDashboard className="h-4 w-4 mr-2" />
                              Dashboard
                            </Button>
                          </Link>
                          {mounted && (
                            <Button variant="ghost" size="sm" onClick={handleLogout}>
                              <LogOut className="h-4 w-4 mr-2" />
                              Log Out
                            </Button>
                          )}
                        </>
                      ) : (
                        <>
                          {mounted && !isDashboardPage && (
                            <Button asChild variant="ghost" size="sm" className="px-2 sm:px-3">
                              <Link href="/dashboard">
                                <LayoutDashboard className="h-4 w-4 mr-2" />
                                Dashboard
                              </Link>
                            </Button>
                          )}
                          {mounted && !isSettingsPage && (
                            <Button asChild variant="ghost" size="sm">
                              <Link href="/settings">
                                <Settings className="h-4 w-4 mr-2" />
                                Settings
                              </Link>
                            </Button>
                          )}
                          {mounted && (
                            <Button variant="ghost" size="sm" onClick={handleLogout}>
                              <LogOut className="h-4 w-4 mr-2" />
                              Log Out
                            </Button>
                          )}
                        </>
                      )}
                    </>
                  ) : (
                    <>
                      <Link href="/login">
                        <Button variant="ghost" size="sm">
                          Log In
                        </Button>
                      </Link>
                      <Link href="/signup">
                        <Button size="sm">
                          Get Started
                        </Button>
                      </Link>
                    </>
                  )}
                </>
              )}
            </div>
          </div>
        </div>
      </div>

      {/* Mobile Menu Overlay */}
      <AnimatePresence>
        {isMobileMenuOpen && (
          <motion.div
            initial={{ opacity: 0, y: -20 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -20 }}
            transition={{ duration: 0.2 }}
            className="absolute top-[var(--header-h)] left-0 right-0 p-4 lg:hidden"
          >
            <div
              ref={menuRef}
              className="glass-chrome rounded-xl p-4 flex flex-col gap-4 shadow-2xl backdrop-blur-xl backdrop-saturate-125 border border-border/10 relative overflow-hidden"
            >
              <div
                className="pointer-events-none absolute inset-0 opacity-70"
                style={{
                  background:
                    "radial-gradient(circle at 30% 20%, rgba(var(--accent-r),var(--accent-g),var(--accent-b),0.25), transparent 50%), radial-gradient(circle at 80% 10%, rgba(var(--accent-r),var(--accent-g),var(--accent-b),0.18), transparent 60%)",
                }}
              />
              <nav className="flex flex-col gap-2 relative z-10">
                {variant === "landing" && (
                  <>
                    <Link
                      href="#features"
                      className="px-4 py-3 rounded-md hover:bg-accent/50 transition-colors text-sm font-medium"
                      onClick={() => setIsMobileMenuOpen(false)}
                    >
                      <span className="grid grid-cols-[20px_auto] items-center gap-3">
                        <ListChecks className="h-4 w-4 text-primary shrink-0" />
                        <span>Features</span>
                      </span>
                    </Link>
                    <Link
                      href="#how-it-works"
                      className="px-4 py-3 rounded-md hover:bg-accent/50 transition-colors text-sm font-medium"
                      onClick={() => setIsMobileMenuOpen(false)}
                    >
                      <span className="grid grid-cols-[20px_auto] items-center gap-3">
                        <Route className="h-4 w-4 text-primary shrink-0" />
                        <span>How It Works</span>
                      </span>
                    </Link>
                  </>
                )}
                {variant !== "landing" && user && (
                  <>
                    {!isDashboardPage && (
                      <Link
                        href="/dashboard"
                        className="px-4 py-3 rounded-md hover:bg-accent/50 transition-colors text-sm font-medium"
                        onClick={() => setIsMobileMenuOpen(false)}
                      >
                        <span className="grid grid-cols-[20px_auto] items-center gap-3">
                          <LayoutDashboard className="h-4 w-4 text-primary shrink-0" />
                          <span>Dashboard</span>
                        </span>
                      </Link>
                    )}
                    {!isResumeEditorPage && (
                      <Link
                        href="/resume-editor"
                        className="px-4 py-3 rounded-md hover:bg-accent/50 transition-colors text-sm font-medium"
                        onClick={() => setIsMobileMenuOpen(false)}
                      >
                        <span className="grid grid-cols-[20px_auto] items-center gap-3">
                          <FileText className="h-4 w-4 text-primary shrink-0" />
                          <span>Resume Editor</span>
                        </span>
                      </Link>
                    )}
                    {!isSettingsPage && (
                      <Link
                        href="/settings"
                        className="px-4 py-3 rounded-md hover:bg-accent/50 transition-colors text-sm font-medium"
                        onClick={() => setIsMobileMenuOpen(false)}
                      >
                        <span className="grid grid-cols-[20px_auto] items-center gap-3">
                          <Settings className="h-4 w-4 text-primary shrink-0" />
                          <span>Settings</span>
                        </span>
                      </Link>
                    )}
                  </>
                )}
              </nav>
              <div className="flex flex-col gap-2 relative z-10">
                {!isLoading && (
                  <>
                    {user ? (
                      <>
                        {variant === "landing" && (
                          <Button asChild className="w-full justify-start px-4 py-3" variant="ghost">
                            <Link href="/dashboard" onClick={() => setIsMobileMenuOpen(false)}>
                              <span className="grid grid-cols-[20px_auto] items-center gap-3">
                                <LayoutDashboard className="h-4 w-4 shrink-0" />
                                <span>Dashboard</span>
                              </span>
                            </Link>
                          </Button>
                        )}
                        <Button
                          className="w-full justify-start px-4 py-3 text-destructive hover:text-destructive"
                          variant="ghost"
                          onClick={() => {
                            handleLogout()
                            setIsMobileMenuOpen(false)
                          }}
                        >
                          <span className="grid grid-cols-[20px_auto] items-center gap-3">
                            <LogOut className="h-4 w-4 shrink-0" />
                            <span>Log Out</span>
                          </span>
                        </Button>
                      </>
                    ) : (
                      <>
                        <Button asChild className="w-full" variant="outline">
                          <Link href="/login" onClick={() => setIsMobileMenuOpen(false)}>
                            Log In
                          </Link>
                        </Button>
                        <Button asChild className="w-full">
                          <Link href="/signup" onClick={() => setIsMobileMenuOpen(false)}>
                            Get Started
                          </Link>
                        </Button>
                      </>
                    )}
                  </>
                )}
              </div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </header>
  )
}
