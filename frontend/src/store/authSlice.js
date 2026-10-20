import { createSlice } from '@reduxjs/toolkit'
import { loadAuth } from '../services/tokenStorage'

const stored = loadAuth()

const authSlice = createSlice({
  name: 'auth',
  initialState: {
    token: stored?.token ?? null,
    user: stored?.user ?? null,
  },
  reducers: {
    loggedIn(state, action) {
      state.token = action.payload.token
      state.user = action.payload.user
    },
    loggedOut(state) {
      state.token = null
      state.user = null
    },
  },
})

export const { loggedIn, loggedOut } = authSlice.actions
export default authSlice.reducer