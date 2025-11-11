import type React from "react"
import type { Metadata } from "next"
import { Inter } from "next/font/google"
import { Providers } from "@/components/providers"
import { AnimatedBackground } from "@/components/ui/animated-background"
import "../styles/globals.css"

const inter = Inter({ subsets: ["latin"] })

export const metadata: Metadata = {
  title: "CVify - AI-Powered Resume & Cover Letter Adaptation",
  description: "Transform your resume and cover letter for any job posting with AI-powered analysis and optimization.",
}

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode
}>) {
  return (
    <html lang="en" suppressHydrationWarning>
      <body className={`${inter.className} overflow-x-hidden`}>
        <Providers>
          <div className="relative min-h-screen">
            <AnimatedBackground intensity={0.7} className="fixed inset-0 z-0" />

            <div className="relative z-10">{children}</div>
          </div>
        </Providers>
      </body>
    </html>
  )
}
