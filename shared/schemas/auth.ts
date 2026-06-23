import { z } from 'zod'

export const userSchema = z.object({
  _id: z.string(),
  username: z.string(),
})

export const registerSchema = z.object({
  username: z.string().trim().min(1, '이름 입력하세요'),
  password: z.string().trim().min(1, '비밀번호 입력하세요'),
})

export const loginSchema = z.object({
  username: z.string().trim().min(1, '이름 입력하세요'),
  password: z.string().trim().min(1, '비밀번호 입력하세요'),
})

export type User = z.infer<typeof userSchema>
export type RegisterFormData = z.infer<typeof registerSchema>
export type LoginFormData = z.infer<typeof loginSchema>
