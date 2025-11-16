"use client"

import Link from "next/link"
import { usePathname, useRouter } from "next/navigation"
import { Button } from "@/components/ui/button"
import { Sparkles, ArrowLeft, LogOut, Settings, LogIn, UserPlus } from "lucide-react"
import { ThemeToggle } from "@/components/theme-toggle"
import { PaletteToggle } from "@/components/palette-toggle"
import { useAppDispatch, useAppSelector } from "@/lib/redux/hooks"
import { signOutThunk } from "@/features/auth/authSlice"

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

  const isLandingPage = pathname === "/"
  const isDashboardPage = pathname === "/dashboard"
  const isSettingsPage = pathname === "/settings"

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
            <>
              {/* Icon-only on mobile */}
              <Link href={backHref} className="sm:hidden">
                <Button variant="ghost" size="icon" aria-label={backLabel}>
                  <ArrowLeft className="h-5 w-5" />
                </Button>
              </Link>
              {/* Icon + label on >= sm */}
              <Link
                href={backHref}
                className="hidden sm:flex items-center gap-2 text-muted-foreground hover:text-foreground"
              >
                <ArrowLeft className="h-4 w-4" />
                <span>{backLabel}</span>
              </Link>
            </>
          ) : (
            <Link href="/" className="flex items-center gap-2">
              <Sparkles className="h-6 w-6" />
              <span className="text-xl font-bold">CVify</span>
            </Link>
          )}
        </div>

        {/* Center - Navigation (only on landing page) */}
        {variant === "landing" && (
          <nav className="hidden md:flex items-center gap-8 absolute left-1/2 transform -translate-x-1/2">
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
                      {/* Logout icon on mobile, text on >=sm */}
                      <Button variant="ghost" size="icon" className="sm:hidden" onClick={handleLogout} aria-label="Log out">
                        <LogOut className="h-5 w-5" />
                      </Button>
                      <Button variant="ghost" size="sm" className="hidden sm:inline-flex" onClick={handleLogout}>
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
                        <>
                          {/* Settings icon on mobile */}
                          <Link href="/settings" className="sm:hidden">
                            <Button variant="ghost" size="icon" aria-label="Settings">
                              <Settings className="h-5 w-5" />
                            </Button>
                          </Link>
                          {/* Settings text on >=sm */}
                          <Link href="/settings" className="hidden sm:inline-flex">
                            <Button variant="ghost" size="sm">
                              <Settings className="h-4 w-4 mr-2" />
                              Settings
                            </Button>
                          </Link>
                        </>
                      )}
                      {/* Logout icon on mobile, text on >=sm */}
                      <Button variant="ghost" size="icon" className="sm:hidden" onClick={handleLogout} aria-label="Log out">
                        <LogOut className="h-5 w-5" />
                      </Button>
                      <Button variant="ghost" size="sm" className="hidden sm:inline-flex" onClick={handleLogout}>
                        <LogOut className="h-4 w-4 mr-2" />
                        Log Out
                      </Button>
                    </>
                  )}
                </>
              ) : (
                <>
                  {/* Icons on mobile */}
                  <Link href="/login" className="sm:hidden">
                    <Button variant="ghost" size="icon" aria-label="Log in">
                      <LogIn className="h-5 w-5" />
                    </Button>
                  </Link>
                  <Link href="/signup" className="sm:hidden">
                    <Button variant="default" size="icon" aria-label="Sign up">
                      <UserPlus className="h-5 w-5" />
                    </Button>
                  </Link>
                  {/* Text on >=sm */}
                  <Link href="/login" className="hidden sm:inline-flex">
                    <Button variant="ghost" size="sm">
                      Log In
                    </Button>
                  </Link>
                  <Link href="/signup" className="hidden sm:inline-flex">
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
    </header>
  )
}
