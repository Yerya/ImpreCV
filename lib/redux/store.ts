"use client"

import { configureStore } from "@reduxjs/toolkit"
import authReducer from "@/features/auth/authSlice"
import appReducer from "@/features/app/appSlice"
import { authApi } from "@/features/api/authApi"

export const store = configureStore({
  reducer: {
    auth: authReducer,
    app: appReducer,
    [authApi.reducerPath]: authApi.reducer,
  },
  middleware: (getDefault) => getDefault().concat(authApi.middleware),
  devTools: process.env.NODE_ENV !== "production",
})

export type RootState = ReturnType<typeof store.getState>
export type AppDispatch = typeof store.dispatch



