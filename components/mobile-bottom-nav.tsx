"use client"

import Link from "next/link"
import { usePathname } from "next/navigation"
import { LayoutDashboard, Sparkles, FileText, Settings as SettingsIcon } from "lucide-react"
import { cn } from "@/lib/utils"

interface NavItem {
  href: string
  label: string
  icon: React.ComponentType<React.SVGProps<SVGSVGElement>>
  exact?: boolean
}

const ITEMS: NavItem[] = [
  { href: "/dashboard", label: "Home", icon: LayoutDashboard, exact: true },
  { href: "/analysis", label: "Analysis", icon: Sparkles },
  { href: "/resume-rewrite", label: "Resumes", icon: FileText },
  { href: "/settings", label: "Settings", icon: SettingsIcon },
]

export function MobileBottomNav() {
  const pathname = usePathname()

  const isActive = (item: NavItem) => {
    if (item.exact) {
      return pathname === item.href
    }
    return pathname === item.href || pathname.startsWith(`${item.href}/`)
  }

  return (
    <nav className="fixed inset-x-0 bottom-0 z-40 w-full md:hidden">
      <div className="glass-chrome glass-chrome-bottom mx-auto flex h-16 max-w-screen-sm items-center justify-between px-2 backdrop-blur-xl backdrop-saturate-125">
        {ITEMS.map((item) => {
          const active = isActive(item)
          const Icon = item.icon
          return (
            <Link
              key={item.href}
              href={item.href}
              className={cn(
                "flex h-full flex-1 items-center justify-center",
                "text-xs font-medium",
                active ? "text-primary" : "text-muted-foreground"
              )}
            >
              <div
                className={cn(
                  "flex flex-col items-center justify-center gap-1 rounded-full px-3 py-2",
                  "transition-colors duration-150",
                  active
                    ? "bg-primary/10 text-primary"
                    : "hover:bg-accent/50 hover:text-accent-foreground"
                )}
              >
                <Icon className="h-5 w-5" />
                <span>{item.label}</span>
              </div>
            </Link>
          )
        })}
      </div>
    </nav>
  )
}
