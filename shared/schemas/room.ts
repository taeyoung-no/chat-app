import { z } from 'zod'

export const roomSchema = z.object({
  _id: z.string(),
  name: z.string(),
  username: z.string(),
  createdAt: z.date(),
})

export const createRoomSchema = z.object({
  name: z.string().trim().min(1, '방 이름 입력하세요').max(32, '너무 길어요'),
})

export type Room = z.infer<typeof roomSchema>
export type CreateRoomFormData = z.infer<typeof createRoomSchema>
