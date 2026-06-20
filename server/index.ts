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
  },
})

io.on('connection', (socket: Socket) => {
  console.log(`${socket.id} 연결`)

  socket.on('message', (msg: string) => {
    console.log(`${socket.id} >> ${msg}`)
    io.emit('message', msg)
  })

  socket.on('disconnect', () => {
    console.log(`${socket.id} 연결 해제`)
  })
})

const PORT = process.env.PORT

httpServer.listen(PORT, () => {
  console.log(`[Socket.IO] http://localhost:${PORT}`)
})

app.listen(PORT, () => {
  console.log(`http://localhost:${PORT}`)
})
