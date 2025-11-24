import { useState, useEffect, useRef } from "react"
import Link from "next/link"
import { usePathname, useRouter } from "next/navigation"
import { Button } from "@/components/ui/button"
import { Sparkles, ArrowLeft, LogOut, Settings, LogIn, UserPlus, Menu, X } from "lucide-react"
import { ThemeToggle } from "@/components/theme-toggle"
import { PaletteToggle } from "@/components/palette-toggle"
import { useAppDispatch, useAppSelector } from "@/lib/redux/hooks"
import { signOutThunk } from "@/features/auth/authSlice"
import { AnimatePresence, motion } from "framer-motion"

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

  const isLandingPage = pathname === "/"
  const isDashboardPage = pathname === "/dashboard"
  const isSettingsPage = pathname === "/settings"

  const menuRef = useRef<HTMLDivElement>(null)
  const buttonRef = useRef<HTMLButtonElement>(null)

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

  // Lock body scroll when menu is open
  useEffect(() => {
    if (isMobileMenuOpen) {
      document.body.style.overflow = "hidden"
    } else {
      document.body.style.overflow = "unset"
    }
    return () => {
      document.body.style.overflow = "unset"
    }
  }, [isMobileMenuOpen])

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

  return (
    <header className="sticky top-0 left-0 right-0 z-50 w-full">
      <div className="glass-chrome glass-chrome-top w-full max-w-screen-2xl mx-auto overflow-hidden backdrop-blur-xl backdrop-saturate-125">
        <div className="px-4 h-[var(--header-h)] flex items-center justify-between relative">
          {/* Left side - Logo or Back button */}
          <div className="flex items-center">
            {variant === "back" ? (
              <Link href={backHref}>
                <Button variant="ghost" size="icon" aria-label={backLabel}>
                  <ArrowLeft className="h-5 w-5" />
                </Button>
              </Link>
            ) : (
              <Link href="/" className="flex items-center gap-2">
                <Sparkles className="h-6 w-6" />
                <span className="text-xl font-bold">CVify</span>
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

            {/* Mobile Menu Toggle (Landing Page Only) */}
            {variant === "landing" && (
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
            )}

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
                              Dashboard
                            </Button>
                          </Link>
                          <Button variant="ghost" size="sm" onClick={handleLogout}>
                            <LogOut className="h-4 w-4 mr-2" />
                            Log Out
                          </Button>
                        </>
                      ) : (
                        <>
                          {!isDashboardPage && (
                            <Link href="/dashboard">
                              <Button variant="ghost" size="sm" className="px-2 sm:px-3">
                                Dashboard
                              </Button>
                            </Link>
                          )}
                          {!isSettingsPage && (
                            <Link href="/settings">
                              <Button variant="ghost" size="sm">
                                <Settings className="h-4 w-4 mr-2" />
                                Settings
                              </Button>
                            </Link>
                          )}
                          <Button variant="ghost" size="sm" onClick={handleLogout}>
                            <LogOut className="h-4 w-4 mr-2" />
                            Log Out
                          </Button>
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
        {isMobileMenuOpen && variant === "landing" && (
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
                <Link
                  href="#features"
                  className="px-4 py-3 rounded-md hover:bg-accent/50 transition-colors text-sm font-medium"
                  onClick={() => setIsMobileMenuOpen(false)}
                >
                  Features
                </Link>
                <Link
                  href="#how-it-works"
                  className="px-4 py-3 rounded-md hover:bg-accent/50 transition-colors text-sm font-medium"
                  onClick={() => setIsMobileMenuOpen(false)}
                >
                  How It Works
                </Link>
              </nav>
              {/* Separator removed as requested */}
              <div className="flex flex-col gap-2 relative z-10">
                {!isLoading && (
                  <>
                    {user ? (
                      <>
                        <Link href="/dashboard" onClick={() => setIsMobileMenuOpen(false)}>
                          <Button className="w-full justify-start" variant="ghost">
                            <LayoutDashboard className="h-4 w-4 mr-2" />
                            Dashboard
                          </Button>
                        </Link>
                        <Button
                          className="w-full justify-start text-destructive hover:text-destructive"
                          variant="ghost"
                          onClick={() => {
                            handleLogout()
                            setIsMobileMenuOpen(false)
                          }}
                        >
                          <LogOut className="h-4 w-4 mr-2" />
                          Log Out
                        </Button>
                      </>
                    ) : (
                      <>
                        <Link href="/login" onClick={() => setIsMobileMenuOpen(false)}>
                          <Button className="w-full" variant="outline">
                            Log In
                          </Button>
                        </Link>
                        <Link href="/signup" onClick={() => setIsMobileMenuOpen(false)}>
                          <Button className="w-full">
                            Get Started
                          </Button>
                        </Link>
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

// Helper component for the mobile menu icon if needed, but imported directly above
function LayoutDashboard({ className }: { className?: string }) {
  return (
    <svg
      xmlns="http://www.w3.org/2000/svg"
      width="24"
      height="24"
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="2"
      strokeLinecap="round"
      strokeLinejoin="round"
      className={className}
    >
      <rect width="7" height="9" x="3" y="3" rx="1" />
      <rect width="7" height="5" x="14" y="3" rx="1" />
      <rect width="7" height="9" x="14" y="12" rx="1" />
      <rect width="7" height="5" x="3" y="16" rx="1" />
    </svg>
  )
}
