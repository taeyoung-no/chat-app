import express from 'express'
import isAuthenticated from '../middleware/auth'
import Room from '../models/Rooms'
import { createRoomSchema } from '../../shared/schemas/room'
import validate from '../utils/validate'

const router = express.Router()

router.post('/', isAuthenticated, async (req, res, next) => {
  try {
    const { name } = validate(createRoomSchema, req.body)

    const room = await Room.create({ name })
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
