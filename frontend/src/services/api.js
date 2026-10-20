import axios from 'axios'
import { loadAuth, clearAuth } from './tokenStorage'

const api = axios.create({
  baseURL: import.meta.env.VITE_API_URL || 'http://localhost:8081/api',
})

api.interceptors.request.use((config) => {
  const auth = loadAuth()
  if (auth?.token) {
    config.headers.Authorization = `Bearer ${auth.token}`
  }
  return config
})

api.interceptors.response.use(
  (response) => response,
  (error) => {
    const url = error.config?.url || ''
    const isAuthCall = url.startsWith('/auth/login') || url.startsWith('/auth/register')
    // An expired or invalid token on a protected call: clear it and go to the login page
    if (error.response?.status === 401 && !isAuthCall) {
      clearAuth()
      window.location.assign('/login')
    }
    return Promise.reject(error)
  },
)

export default api