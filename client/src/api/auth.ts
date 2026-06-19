import type { User } from "../types/user"
import api from "./client"

export const login = async (
  username: string,
  password: string
): Promise<User> => {
  try {
    const res = await api.post('/auth/login', { username, password })
    if (!res.data.success) throw new Error(res.data.message)
    return res.data.user
  } catch (err: any) {
    throw new Error(err.response?.data?.message || err.message || '로그인 실패')
  }
}
