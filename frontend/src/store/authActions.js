import api from '../services/Api'
import { saveAuth, clearAuth } from '../services/tokenStorage'
import { loggedIn, loggedOut } from './authSlice'

export const login = (email, password) => async (dispatch) => {
  const { data } = await api.post('/auth/login', { email, password })
  saveAuth({
    token: data.token,
    user: data.user,
    expiresAt: Date.now() + data.expiresIn * 1000,
  })
  dispatch(loggedIn({ token: data.token, user: data.user }))
  return data.user
}

// The backend's register endpoint returns no token, so we log in right after registering.
export const register = (form) => async (dispatch) => {
  await api.post('/auth/register', form)
  return dispatch(login(form.email, form.password))
}

export const logout = () => (dispatch) => {
  clearAuth()
  dispatch(loggedOut())
}