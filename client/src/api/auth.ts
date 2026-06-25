import type { User } from 'shared/schemas/auth'
import api from './client'

export const registerUser = async (username: string, password: string): Promise<User> => {
  try {
    const res = await api.post('/auth/register', { username, password })
    if (!res.data.success) throw new Error(res.data.message)
    login(username, password)
    return res.data.user
  } catch (err: any) {
    throw new Error(err.response?.data?.message || err.message || '회원가입 실패')
  }
}

export const login = async (username: string, password: string): Promise<User> => {
  try {
    const res = await api.post('/auth/login', { username, password })
    if (!res.data.success) throw new Error(res.data.message)
    return res.data.user
  } catch (err: any) {
    throw new Error(err.response?.data?.message || err.message || '로그인 실패')
  }
}

export const getCurrentUser = async (): Promise<User> => {
  try {
    const res = await api.get('/auth/me')
    if (!res.data.success) throw new Error(res.data.message)
    return res.data.user
  } catch (err: any) {
    throw new Error(err.response?.data?.message || err.message || '유저 정보 조회 실패')
  }
}

export const logout = async () => {
  try {
    const res = await api.post('/auth/logout')
    if (!res.data.success) throw new Error(res.data.message)
    return res.data.user
  } catch (err: any) {
    throw new Error(err.response?.data?.message || err.message || '로그아웃 실패')
  }
}
