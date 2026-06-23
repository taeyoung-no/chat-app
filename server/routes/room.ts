import express from 'express'
import isAuthenticated from '../middleware/auth'
import Room from '../models/Room'
import { createRoomSchema } from '../../shared/schemas/room'
import validate from '../utils/validate'
import Message from '../models/Message'

const router = express.Router()

router.post('/', isAuthenticated, async (req, res, next) => {
  try {
    const { name } = validate(createRoomSchema, req.body)

    const room = await Room.create({ name, username: req.session.username })
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

router.delete('/:id', isAuthenticated, async (req, res, next) => {
  try {
    const { id } = req.params
    const room = await Room.findById(id)
    if (!room) return res.status(404).json({ success: false, message: '없는 방이에요' })
    if (room.username != req.session.username)
      return res.status(403).json({ success: false, message: '권한이 없습니다' })

    await Room.deleteOne({ _id: id })
    await Message.deleteMany({ roomId: id })
    res.status(200).json({ success: true, message: '방 삭제 성공' })
  } catch (err) {
    next(err)
  }
})

export default router
