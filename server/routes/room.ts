import express from 'express'
import isAuthenticated from '../middleware/auth'
import Room from '../models/Rooms'

const router = express.Router()

router.post('/', isAuthenticated, async (req, res) => {
  const { name } = req.body
  if (!name?.trim()) return res.status(400).json({ message: '방 이름 입력하세요' })

  await Room.create({ name: name.trim() })
  res.status(201).json({ message: '채팅방 생성 성공' })
})

router.get('/', async (req, res) => {
  const rooms = await Room.find().sort({ createdAt: -1 })
  res.status(200).json({ message: '채팅방 목록 조회 성공', rooms })
})

export default router
