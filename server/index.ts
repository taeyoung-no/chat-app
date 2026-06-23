import express from 'express'
import cors from 'cors'
import dotenv from 'dotenv'
import mongoose from 'mongoose'
import authRouter from './routes/auth.js'
import roomRouter from './routes/room.js'
import sessionMiddleware from './middleware/session.js'
import errorHandler from './middleware/errorHandler.js'
import { createServer } from 'http'
import { Server, Socket } from 'socket.io'
import validate from './utils/validate.js'
import { sendMessageSchema } from '../shared/schemas/message.js'
import Message from './models/Message.js'
import Rooms from './models/Rooms.js'

dotenv.config()

const app = express()

app.use(
  cors({
    origin: process.env.CLIENT_URL,
    credentials: true,
  })
)
app.use(express.json())
app.use(sessionMiddleware)
app.use('/auth', authRouter)
app.use('/room', roomRouter)
app.use(errorHandler)

mongoose
  .connect(process.env.MONGODB_URI!)
  .then(() => console.log('[MongoDB] 연결 성공'))
  .catch((err) => console.log(`[MongoDB] ${err}`))

const httpServer = createServer(app)
const io = new Server(httpServer, {
  cors: {
    origin: process.env.CLIENT_URL,
    credentials: true,
  },
})

io.use((socket, next) => {
  const req = socket.request as express.Request & { session: any }

  sessionMiddleware(req, {} as any, (err) => {
    if (err) return next(new Error('Session error'))

    if (req.session?.userId) {
      socket.data.userId = req.session.userId
      socket.data.username = req.session.username
      next()
    } else {
      next(new Error('로그인부터 하세요'))
    }
  })
})

io.on('connection', (socket: Socket) => {
  socket.on('join', async (roomId: string) => {
    socket.join(roomId)
    try {
      const messages = await Message.find({ roomId })
      socket.emit('messages', messages)
      io.emit('joined')
    } catch (err: any) {
      socket.emit('error', { message: err.message || '메시지 불러오기 실패' })
    }
  })

  socket.on('message', async (data) => {
    try {
      const { roomId, content } = validate(sendMessageSchema, data)
      const message = await Message.create({
        roomId,
        username: socket.data.username,
        content,
      })
      io.to(roomId).emit('message', message)
    } catch (err: any) {
      socket.emit('error', { message: err.message || '메시지 전송 실패' })
    }
  })

  socket.on('leave', async (roomId: string) => {
    socket.leave(roomId)
    try {
      const size = io.sockets.adapter.rooms.get(roomId)?.size ?? 0
      if (size === 0) {
        await Rooms.deleteOne({ _id: roomId })
        io.emit('delete')
      }
    } catch (err: any) {
      console.error(err.message || `${roomId} 삭제 실패`)
    }
  })
})

const PORT = process.env.PORT

httpServer.listen(PORT, () => {
  console.log(`http://localhost:${PORT}`)
})
