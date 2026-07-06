import { z } from 'zod'

export const messageSchema = z.object({
  _id: z.string(),
  roomId: z.string(),
  username: z.string(),
  content: z.string(),
  createdAt: z.date(),
})

export const sendMessageSchema = z.object({
  roomId: z.string().trim().min(1, '없는 방인데요').max(100, '방 이름이 너무 길어요'),
  content: z.string().trim().min(1, '메시지를 입력하세요').max(32, '메시지가 너무 길어요'),
})

export type Message = z.infer<typeof messageSchema>
export type SendMessageFormData = z.infer<typeof sendMessageSchema>
