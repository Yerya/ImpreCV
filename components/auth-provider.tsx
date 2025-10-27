"use client"

import React, { createContext, useContext, useState, useEffect } from "react"
import { useRouter } from "next/navigation"
import { getSupabaseBrowserClient, isSupabaseConfigured } from "@/lib/supabase/client"

interface User {
  id: string
  email?: string
  user_metadata?: {
    full_name?: string
  }
}

interface AuthContextType {
  user: User | null
  isLoading: boolean
  signOut: () => Promise<void>
  refreshUser: () => Promise<void>
}

const AuthContext = createContext<AuthContextType | undefined>(undefined)

export function useAuth() {
  const context = useContext(AuthContext)
  if (context === undefined) {
    throw new Error("useAuth must be used within an AuthProvider")
  }
  return context
}

interface AuthProviderProps {
  children: React.ReactNode
}

export function AuthProvider({ children }: AuthProviderProps) {
  const router = useRouter()
  const [user, setUser] = useState<User | null>(null)
  const [isLoading, setIsLoading] = useState(true)

  const refreshUser = async () => {
    if (!isSupabaseConfigured()) {
      setIsLoading(false)
      return
    }

    try {
      const supabase = getSupabaseBrowserClient()
      const { data: { user }, error } = await supabase.auth.getUser()
      
      // Игнорируем ошибку отсутствия сессии
      if (error && error.message !== "Auth session missing!") {
        throw error
      }
      setUser(user)
    } catch (error: any) {
      // Игнорируем ошибку отсутствия сессии
      if (error?.message !== "Auth session missing!") {
        console.error("Error refreshing user:", error)
      }
      setUser(null)
    } finally {
      setIsLoading(false)
    }
  }

  const signOut = async () => {
    try {
      const supabase = getSupabaseBrowserClient()
      await supabase.auth.signOut()
      setUser(null)
      router.push("/")
      router.refresh()
    } catch (error) {
      console.error("Error signing out:", error)
    }
  }

  useEffect(() => {
    const checkUser = async () => {
      if (!isSupabaseConfigured()) {
        setIsLoading(false)
        return
      }

      try {
        const supabase = getSupabaseBrowserClient()
        const { data: { user }, error } = await supabase.auth.getUser()
        
        // Игнорируем ошибку отсутствия сессии (пользователь не авторизован)
        if (error && error.message !== "Auth session missing!") {
          console.error("Error checking user:", error)
        }
        setUser(user)
      } catch (error: any) {
        // Игнорируем ошибку отсутствия сессии
        if (error?.message !== "Auth session missing!") {
          console.error("Error checking user:", error)
        }
        setUser(null)
      } finally {
        setIsLoading(false)
      }
    }

    // Initial load
    checkUser()

    // Listen for auth state changes
    const supabase = getSupabaseBrowserClient()
    const { data: { subscription } } = supabase.auth.onAuthStateChange(async (event: any, session: any) => {
      setUser(session?.user ?? null)
    })

    return () => subscription.unsubscribe()
  }, [])

  return (
    <AuthContext.Provider value={{ user, isLoading, signOut, refreshUser }}>
      {children}
    </AuthContext.Provider>
  )
}
