"use client"

import { useEffect } from "react"
import { getSupabaseBrowserClient, isSupabaseConfigured } from "@/lib/supabase/client"
import { useAppDispatch } from "@/lib/redux/hooks"
import { initializeAuth, setUser } from "@/features/auth/authSlice"
import type { AuthChangeEvent, Session } from "@supabase/supabase-js"

export default function AuthSync() {
  const dispatch = useAppDispatch()

  useEffect(() => {
    dispatch(initializeAuth())

    if (!isSupabaseConfigured()) return

    const supabase = getSupabaseBrowserClient()
    const { data: { subscription } } = supabase.auth.onAuthStateChange(async (_event: AuthChangeEvent, session: Session | null) => {
      dispatch(setUser(session?.user ?? null))
    })

    return () => {
      subscription.unsubscribe()
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [])

  // This component does not render anything
  return null
}


