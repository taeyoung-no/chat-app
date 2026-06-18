import api from "./client"

export interface Room {
  _id: string
  name: string
  createdAt: string
}

export const fetchRooms = async (): Promise<Room[]> => {
  const res = await api.get('/room')
  return res.data.rooms
}

export const createRoom = async (name: string): Promise<Room> => {
  const res = await api.post('/room', { name })
  return res.data
}
