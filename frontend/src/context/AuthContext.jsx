import { createContext, useContext, useState, useEffect } from 'react'
import { authAPI } from '../services/api'
import toast from 'react-hot-toast'

const AuthContext = createContext()

export const useAuth = () => {
  const context = useContext(AuthContext)
  if (!context) {
    throw new Error('useAuth must be used within AuthProvider')
  }
  return context
}

export const AuthProvider = ({ children }) => {
  const [user, setUser] = useState(null)
  const [token, setToken] = useState(localStorage.getItem('token'))
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    if (token) {
      loadUser()
    } else {
      setLoading(false)
    }
  }, [token])

  const loadUser = async () => {
    try {
      const userData = await authAPI.getMe()
      setUser(userData)
    } catch (error) {
      console.error('加载用户信息失败:', error)
      logout()
    } finally {
      setLoading(false)
    }
  }

  const login = async (email, password) => {
    try {
      const response = await authAPI.login({ email, password })
      setToken(response.token)
      setUser(response.user)
      localStorage.setItem('token', response.token)
      toast.success('登录成功！')
      return response
    } catch (error) {
      toast.error(error.response?.data?.error || '登录失败')
      throw error
    }
  }

  const register = async (userData) => {
    try {
      await authAPI.register(userData)
      toast.success('注册成功！请登录')
    } catch (error) {
      toast.error(error.response?.data?.error || '注册失败')
      throw error
    }
  }

  const logout = () => {
    setUser(null)
    setToken(null)
    localStorage.removeItem('token')
    toast.success('已退出登录')
  }

  const value = {
    user,
    token,
    loading,
    login,
    register,
    logout
  }

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>
}