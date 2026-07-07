import express from 'express'
import sessionMiddleware from './middleware/session.js'
import { Server, Socket } from 'socket.io'
import validate from './utils/validate.js'
import { sendMessageSchema } from 'shared/schemas/message.js'
import type { Message } from 'shared/schemas/message.js'
import Messages from './models/Message.js'
import { consumeMessageRateLimit } from './middleware/rateLimiter.js'

export function setupSockets(io: Server) {
  io.use((socket, next) => {
    if (socket.handshake.headers.origin !== process.env.CLIENT_URL) {
      return next(new Error('[CORS] origin 허용 안 함'))
    }

    const req = socket.request as express.Request & { session: any }

    sessionMiddleware(req, {} as any, (err) => {
      if (err) return next(new Error('Session error'))

      if (req.session?.userId) {
        socket.data.userId = req.session.userId
        socket.data.username = req.session.username
      }
      next()
    })
  })

  io.on('connection', (socket: Socket) => {
    socket.on('join', async (roomId: string) => {
      if (!socket.data.userId) {
        return socket.emit('error', { message: '로그인부터 하세요' })
      }
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
      if (!socket.data.userId) {
        return socket.emit('error', { message: '로그인부터 하세요' })
      }
      if (!(await consumeMessageRateLimit(socket.data.userId))) {
        return socket.emit('error', { message: '요청 너무 많이 하지 마세요' })
      }
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
}
