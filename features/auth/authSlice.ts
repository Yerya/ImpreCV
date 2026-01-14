"use client"

import { createSlice, createAsyncThunk, PayloadAction } from "@reduxjs/toolkit"
import { getSupabaseBrowserClient, isSupabaseConfigured } from "@/lib/supabase/client"
import { authApi } from "@/features/api/authApi"

export interface AuthUser {
  id: string
  email?: string
  user_metadata?: {
    full_name?: string
  }
}

interface AuthState {
  user: AuthUser | null
  isLoading: boolean
  error?: string | null
}

const initialState: AuthState = {
  user: null,
  isLoading: true,
  error: null,
}

export const initializeAuth = createAsyncThunk("auth/initialize", async () => {
  if (!isSupabaseConfigured()) {
    return { user: null as AuthUser | null }
  }
  const supabase = getSupabaseBrowserClient()
  const { data: { user }, error } = await supabase.auth.getUser()
  if (error && error.message !== "Auth session missing!") {
    throw error
  }
  return { user: (user as AuthUser | null) }
})

export const refreshUser = createAsyncThunk("auth/refreshUser", async () => {
  if (!isSupabaseConfigured()) {
    return { user: null as AuthUser | null }
  }
  const supabase = getSupabaseBrowserClient()
  const { data: { user }, error } = await supabase.auth.getUser()
  if (error && error.message !== "Auth session missing!") {
    throw error
  }
  return { user: (user as AuthUser | null) }
})

const authSlice = createSlice({
  name: "auth",
  initialState,
  reducers: {
    setUser(state, action: PayloadAction<AuthUser | null>) {
      state.user = action.payload
    },
  },
  extraReducers: (builder) => {
    builder
      .addCase(initializeAuth.pending, (state) => {
        state.isLoading = true
        state.error = null
      })
      .addCase(initializeAuth.fulfilled, (state, action) => {
        state.user = action.payload.user
        state.isLoading = false
      })
      .addCase(initializeAuth.rejected, (state, action) => {
        state.user = null
        state.isLoading = false
        state.error = action.error.message || null
      })
      .addCase(refreshUser.fulfilled, (state, action) => {
        state.user = action.payload.user
      })
      // Clear user when RTK Query signOut mutation succeeds
      // signOut now properly rejects on error, so this only fires on actual success
      .addMatcher(
        authApi.endpoints.signOut.matchFulfilled,
        (state) => {
          state.user = null
        }
      )
  },
})

export const { setUser } = authSlice.actions
export default authSlice.reducer





