import { create } from 'zustand'
import { authApi } from '@/lib/api'

interface User {
  id: number
  username: string
  level: number
  exp: number
  gold: number
  gems: number
  stamina: number
}

interface AuthState {
  token: string | null
  user: User | null
  loading: boolean
  error: string | null
  login: (username: string, password: string) => Promise<void>
  register: (username: string, email: string, password: string) => Promise<void>
  logout: () => void
  refreshProfile: () => Promise<void>
  setToken: (token: string) => void
}

export const useAuthStore = create<AuthState>((set) => ({
  token: typeof window !== 'undefined' ? localStorage.getItem('token') : null,
  user: null,
  loading: false,
  error: null,

  setToken: (token: string) => {
    localStorage.setItem('token', token)
    set({ token })
  },

  login: async (username: string, password: string) => {
    set({ loading: true, error: null })
    try {
      const response = await authApi.login({ username, password })
      const { access_token } = response.data
      localStorage.setItem('token', access_token)
      set({ token: access_token })
      
      // Get profile
      const profileRes = await authApi.getProfile()
      set({ user: profileRes.data, loading: false })
    } catch (error: any) {
      set({ 
        error: error.response?.data?.message || 'Login failed',
        loading: false 
      })
      throw error
    }
  },

  register: async (username: string, email: string, password: string) => {
    set({ loading: true, error: null })
    try {
      const response = await authApi.register({ username, email, password })
      const { access_token } = response.data
      localStorage.setItem('token', access_token)
      set({ token: access_token })
      
      // Get profile
      const profileRes = await authApi.getProfile()
      set({ user: profileRes.data, loading: false })
    } catch (error: any) {
      set({ 
        error: error.response?.data?.message || 'Registration failed',
        loading: false 
      })
      throw error
    }
  },

  logout: () => {
    localStorage.removeItem('token')
    set({ token: null, user: null })
  },

  refreshProfile: async () => {
    try {
      const response = await authApi.getProfile()
      set({ user: response.data })
    } catch (error) {
      console.error('Failed to refresh profile:', error)
    }
  },
}))
