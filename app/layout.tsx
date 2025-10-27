import type React from "react"
import type { Metadata } from "next"
import { Inter } from "next/font/google"
import { ThemeProvider } from "@/components/theme-provider"
import "./globals.css"

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
      <body className={inter.className}>
        <ThemeProvider attribute="class" defaultTheme="dark" enableSystem storageKey="cvify-theme">
          {children}
        </ThemeProvider>
      </body>
    </html>
  )
}
