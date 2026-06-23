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
import type { Message } from '../shared/schemas/message.js'
import Messages from './models/Message.js'

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

app.set('io', io)

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
      const messages = await Messages.find({ roomId })
      const messagesResponse: Message[] = messages.map((m) => ({
        _id: m._id.toString(),
        roomId: m.roomId.toString(),
        username: m.username,
        content: m.content,
        createdAt: m.createdAt,
      }))
      socket.emit('messages', messagesResponse)
    } catch (err: any) {
      socket.emit('error', { message: err.message || '메시지 불러오기 실패' })
    }
  })

  socket.on('message', async (data) => {
    try {
      const { roomId, content } = validate(sendMessageSchema, data)
      const message = await Messages.create({
        roomId,
        username: socket.data.username,
        content,
      })
      const messageResponse: Message = {
        _id: message._id.toString(),
        roomId: message.roomId.toString(),
        username: message.username,
        content: message.content,
        createdAt: message.createdAt,
      }
      io.to(roomId).emit('message', messageResponse)
    } catch (err: any) {
      socket.emit('error', { message: err.message || '메시지 전송 실패' })
    }
  })
})

const PORT = process.env.PORT

httpServer.listen(PORT, () => {
  console.log(`http://localhost:${PORT}`)
})
