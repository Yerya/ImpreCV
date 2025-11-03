"use client"

import { useEffect } from "react"
import { useRouter } from "next/navigation"
import { getSupabaseBrowserClient, isSupabaseConfigured } from "@/lib/supabase/client"
import { useAppDispatch } from "@/lib/redux/hooks"
import { initializeAuth, setUser, signOutThunk } from "@/features/auth/authSlice"

export default function AuthSync() {
  const dispatch = useAppDispatch()
  const router = useRouter()

  useEffect(() => {
    dispatch(initializeAuth())

    if (!isSupabaseConfigured()) return

    const supabase = getSupabaseBrowserClient()
    const { data: { subscription } } = supabase.auth.onAuthStateChange(async (_event: any, session: any) => {
      dispatch(setUser(session?.user ?? null))
    })

    return () => {
      subscription.unsubscribe()
    }
  }, [dispatch])

  // This component does not render anything
  return null
}


