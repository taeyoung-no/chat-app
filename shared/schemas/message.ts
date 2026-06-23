import { z } from 'zod'

export const messageSchema = z.object({
  _id: z.string(),
  username: z.string(),
  content: z.string(),
  createdAt: z.date(),
})

export const sendMessageSchema = z.object({
  roomId: z.string().trim().min(1, '없는 방인데요'),
  content: z.string().trim().min(1, '메시지를 입력하세요'),
})

export type Message = z.infer<typeof messageSchema>
export type SendMessageFormData = z.infer<typeof sendMessageSchema>
