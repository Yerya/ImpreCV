"use client"

import { createApi, fakeBaseQuery } from "@reduxjs/toolkit/query/react"
import { getSupabaseBrowserClient, isSupabaseConfigured } from "@/lib/supabase/client"

export const authApi = createApi({
  reducerPath: "authApi",
  baseQuery: fakeBaseQuery(),
  endpoints: (builder) => ({
    signIn: builder.mutation<{ ok: boolean; message?: string }, { email: string; password: string }>({
      async queryFn({ email, password }) {
        if (!isSupabaseConfigured()) {
          return { data: { ok: false, message: "Supabase is not configured." } }
        }
        try {
          const supabase = getSupabaseBrowserClient()
          const { error } = await supabase.auth.signInWithPassword({ email, password })
          if (error) return { data: { ok: false, message: error.message } }
          return { data: { ok: true } }
        } catch (e: unknown) {
          const err = e as Error
          return { data: { ok: false, message: err?.message || "Failed to sign in" } }
        }
      },
    }),
    signUp: builder.mutation<{ ok: boolean; message?: string }, { fullName: string; email: string; password: string; redirectTo?: string }>({
      async queryFn({ fullName, email, password, redirectTo }) {
        if (!isSupabaseConfigured()) {
          return { data: { ok: false, message: "Supabase is not configured." } }
        }
        try {
          const supabase = getSupabaseBrowserClient()
          const { data, error } = await supabase.auth.signUp({
            email,
            password,
            options: {
              emailRedirectTo: redirectTo,
              data: { full_name: fullName },
            },
          })
          if (error) return { data: { ok: false, message: error.message } }
          // Supabase edge-case: sometimes returns user with no identities when already registered
          const userData = data?.user as Record<string, unknown> | undefined
          const identities = userData?.identities as unknown[] | undefined
          const alreadyRegistered = identities && Array.isArray(identities) && identities.length === 0
          if (alreadyRegistered) {
            return { data: { ok: false, message: "User already registered" } }
          }
          return { data: { ok: true } }
        } catch (e: unknown) {
          const err = e as Error
          return { data: { ok: false, message: err?.message || "Failed to sign up" } }
        }
      },
    }),
    // signOut uses proper error rejection so matcher only fires on actual success
    signOut: builder.mutation<null, void>({
      async queryFn() {
        if (!isSupabaseConfigured()) {
          return { data: null }
        }
        const supabase = getSupabaseBrowserClient()
        const { error } = await supabase.auth.signOut()
        if (error) {
          return { error: { message: error.message } }
        }
        return { data: null }
      },
    }),
    updateProfile: builder.mutation<{ ok: boolean; message?: string }, { id: string; fullName: string }>({
      async queryFn({ id, fullName }) {
        try {
          if (!isSupabaseConfigured()) {
            return { data: { ok: false, message: "Supabase is not configured." } }
          }
          const supabase = getSupabaseBrowserClient()

          // Update profiles table
          const { error: profileError } = await supabase.from("profiles").update({ full_name: fullName }).eq("id", id)
          if (profileError) return { data: { ok: false, message: profileError.message } }

          // Update user_metadata in auth for immediate UI updates
          const { error: authError } = await supabase.auth.updateUser({
            data: { full_name: fullName }
          })
          if (authError) return { data: { ok: false, message: authError.message } }

          return { data: { ok: true } }
        } catch (e: unknown) {
          const err = e as Error
          return { data: { ok: false, message: err?.message || "Failed to update profile" } }
        }
      },
    }),
    deleteAccount: builder.mutation<{ ok: boolean; message?: string }, void>({
      async queryFn() {
        try {
          const res = await fetch("/api/account/delete", { method: "POST" })
          const json = await res.json()
          if (!res.ok || !json?.ok) {
            return { data: { ok: false, message: json?.message || "Failed to delete account" } }
          }
          return { data: { ok: true } }
        } catch (e: unknown) {
          const err = e as Error
          return { data: { ok: false, message: err?.message || "Failed to delete account" } }
        }
      },
    }),
    signInWithGoogle: builder.mutation<{ ok: boolean; message?: string }, { redirectTo?: string }>({
      async queryFn({ redirectTo }) {
        if (!isSupabaseConfigured()) {
          return { data: { ok: false, message: "Supabase is not configured." } }
        }
        try {
          const supabase = getSupabaseBrowserClient()
          const { error } = await supabase.auth.signInWithOAuth({
            provider: "google",
            options: {
              redirectTo: redirectTo || `${window.location.origin}/auth/callback`,
            },
          })
          if (error) return { data: { ok: false, message: error.message } }
          return { data: { ok: true } }
        } catch (e: unknown) {
          const err = e as Error
          return { data: { ok: false, message: err?.message || "Failed to sign in with Google" } }
        }
      },
    }),
  }),
})

export const { useSignInMutation, useSignUpMutation, useSignOutMutation, useUpdateProfileMutation, useDeleteAccountMutation, useSignInWithGoogleMutation } = authApi


