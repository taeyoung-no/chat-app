import express from 'express'
import isAuthenticated from '../middleware/auth.js'
import Rooms from '../models/Room.js'
import { createRoomSchema } from 'shared/schemas/room'
import type { Room } from 'shared/schemas/room'
import validate from '../utils/validate.js'
import Message from '../models/Message.js'
import { consumeCreateRoomRateLimit } from '../middleware/rateLimiter.js'

const router = express.Router()

router.post('/', isAuthenticated, consumeCreateRoomRateLimit, async (req, res, next) => {
  try {
    const { name } = validate(createRoomSchema, req.body)

    const room = await Rooms.create({ name, username: req.session.username })

    const roomResponse: Room = {
      _id: room._id.toString(),
      name: room.name,
      username: room.username,
      createdAt: room.createdAt,
    }
    res.status(201).json({
      success: true,
      message: '채팅방 생성 성공',
      room: roomResponse,
    })

    req.app.get('publisher').publish('room-events', 'create')
  } catch (err) {
    next(err)
  }
})

router.get('/', async (req, res, next) => {
  try {
    const page = Math.max(1, parseInt(String(req.query.page)) || 1)
    const limit = 20
    const skip = (page - 1) * limit

    const rooms = await Rooms.find().sort({ createdAt: -1 }).skip(skip).limit(limit)

    const roomsResponse: Room[] = rooms.map((r) => ({
      _id: r._id.toString(),
      name: r.name,
      username: r.username,
      createdAt: r.createdAt,
    }))
    res.status(200).json({
      success: true,
      message: '채팅방 목록 조회 성공',
      rooms: roomsResponse,
    })
  } catch (err) {
    next(err)
  }
})

router.delete('/:id', isAuthenticated, async (req, res, next) => {
  try {
    const { id } = req.params
    const room = await Rooms.findById(id)
    if (!room) return res.status(404).json({ success: false, message: '없는 방이에요' })
    if (room.username != req.session.username)
      return res.status(403).json({ success: false, message: '권한이 없습니다' })

    await Rooms.deleteOne({ _id: id })
    await Message.deleteMany({ roomId: id })
    res.status(200).json({ success: true, message: '방 삭제 성공' })

    req.app.get('publisher').publish('room-events', 'delete')
  } catch (err) {
    next(err)
  }
})

export default router
