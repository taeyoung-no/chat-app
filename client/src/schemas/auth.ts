import { z } from 'zod'

export const loginSchema = z.object({
  username: z.string().min(1, '이름 입력하세요'),
  password: z.string().min(1, '비밀번호 입력하세요'),
})

export type LoginFormData = z.infer<typeof loginSchema>