import api from './client'

export interface Room {
  _id: string
  name: string
  createdAt: string
}

export const fetchRooms = async (): Promise<Room[]> => {
  try {
    const res = await api.get('/room')
    if (!res.data.success) throw new Error(res.data.message)
    return res.data.rooms
  } catch (err: any) {
    throw new Error(
      err.response?.data?.message || err.message || '방 불러오기 실패'
    )
  }
}

export const createRoom = async (name: string): Promise<Room> => {
  try {
    const res = await api.post('/room', { name })
    if (!res.data.success) throw new Error(res.data.message)
    return res.data.room
  } catch (err: any) {
    throw new Error(
      err.response?.data?.message || err.message || '방 생성 실패'
    )
  }
}
