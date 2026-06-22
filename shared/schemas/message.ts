import { z } from 'zod'

export const sendMessageSchema = z.object({
  roomId: z.string().trim().min(1, '없는 방인데요'),
  content: z.string().trim().min(1, '메시지를 입력하세요'),
})

export type SendMessageFormData = z.infer<typeof sendMessageSchema>
