"use client"

import { createSlice, PayloadAction } from "@reduxjs/toolkit"

interface AppState {
  isInitialLoading: boolean
}

const initialState: AppState = {
  isInitialLoading: true,
}

const appSlice = createSlice({
  name: "app",
  initialState,
  reducers: {
    setInitialLoading(state, action: PayloadAction<boolean>) {
      state.isInitialLoading = action.payload
    },
  },
})

export const { setInitialLoading } = appSlice.actions
export default appSlice.reducer



