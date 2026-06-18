import express from 'express'
import isAuthenticated from '../middleware/auth'
import Room from '../models/Rooms'
import CustomError from '../utils/CustomError'

const router = express.Router()

router.post('/', isAuthenticated, async (req, res, next) => {
  try {
    const { name } = req.body
    if (!name?.trim()) return next(new CustomError('방 이름 입력하세요', 400))

    const room = await Room.create({ name: name.trim() })
    res.status(201).json({
      success: true,
      message: '채팅방 생성 성공',
      room,
    })
  } catch (err) {
    next(err)
  }
})

router.get('/', async (req, res, next) => {
  try {
    const rooms = await Room.find().sort({ createdAt: -1 })
    res.status(200).json({
      success: true,
      message: '채팅방 목록 조회 성공',
      rooms,
    })
  } catch (err) {
    next(err)
  }
})

export default router
