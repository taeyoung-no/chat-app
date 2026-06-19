import { z } from 'zod'

export const createRoomSchema = z.object({
  name: z.string().min(1, '방 이름 입력하세요')
})

export type CreateRoomFormData = z.infer<typeof createRoomSchema>