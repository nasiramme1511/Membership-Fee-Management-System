import React, { createContext, useContext, useState, useEffect, ReactNode } from 'react'
import api from '../lib/api'

interface User {
  id: string
  username: string
  email: string
  fullName: string
  role: 'admin' | 'sector_officer' | 'expert'
  sectorUnitId?: number
  profilePic?: string
  assignedSectorUnit?: { name: string }
}

interface AuthContextType {
  user: User | null
  login: (email: string, password: string) => Promise<void>
  logout: () => void
  updateUser: (user: Partial<User>) => void
  loading: boolean
  verifyEmail: (email: string, otpCode: string) => Promise<void>
  resendOtp: (email: string) => Promise<void>
}

const AuthContext = createContext<AuthContextType | undefined>(undefined)

export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<User | null>(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    const token = localStorage.getItem('token')
    if (token) {
      api.get('/auth/me')
        .then(res => {
          setUser(res.data.data)
        })
        .catch(() => {
          localStorage.removeItem('token')
        })
        .finally(() => setLoading(false))
    } else {
      setLoading(false)
    }
  }, [])

  const login = async (email: string, password: string) => {
    try {
      const res = await api.post('/auth/login', { email, password })
      localStorage.setItem('token', res.data.data.token)
      setUser(res.data.data.user)
    } catch (err: any) {
      if (err.response?.data?.requireVerification) {
        const verErr: any = new Error(err.response.data.message || 'Email not verified')
        verErr.requireVerification = true
        verErr.email = err.response.data.email
        throw verErr
      }
      throw err
    }
  }

  const verifyEmail = async (email: string, otpCode: string) => {
    const res = await api.post('/auth/verify-email', { email, otpCode })
    localStorage.setItem('token', res.data.data.token)
    setUser(res.data.data.user)
  }

  const resendOtp = async (email: string) => {
    await api.post('/auth/resend-otp', { email })
  }

  const logout = () => {
    localStorage.removeItem('token')
    setUser(null)
    window.location.href = '/login'
  }

  const updateUser = (updatedFields: Partial<User>) => {
    setUser(prev => prev ? { ...prev, ...updatedFields } : null)
  }

  return (
    <AuthContext.Provider value={{ user, login, logout, updateUser, loading, verifyEmail, resendOtp }}>
      {children}
    </AuthContext.Provider>
  )
}

export function useAuth() {
  const context = useContext(AuthContext)
  if (!context) {
    throw new Error('useAuth must be used within AuthProvider')
  }
  return context
}
