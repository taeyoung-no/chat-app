import mongoose from 'mongoose'
import { createServer } from 'http'
import { Server } from 'socket.io'
import { createClient } from 'redis'
import { createAdapter } from '@socket.io/redis-adapter'
import app from './app.js'
import { setupSockets } from './socket.js'
import { Response } from 'express'

try {
  await mongoose.connect(process.env.MONGODB_URI!)
  console.log('[MongoDB] 연결 성공')
} catch (err) {
  console.log(`[MongoDB] ${err}`)
  process.exit(1)
}

const publisher = createClient({
  url: process.env.REDIS_URL!,
  socket: {
    reconnectStrategy: (retries) => {
      console.log(`[Redis] 재연결 시도 ${retries}`)
      return Math.min(retries * 100, 3000)
    },
  },
})
const socketSubscriber = publisher.duplicate()
const sseSubscriber = publisher.duplicate()

publisher.on('error', (err) => console.log(`[Redis Publisher] ${err}`))
socketSubscriber.on('error', (err) => console.log(`[Redis Socket Subscriber] ${err}`))
sseSubscriber.on('error', (err) => console.log(`[Redis SSE Subscriber] ${err}`))

const sseClients = new Set<Response>()
app.set('sseClients', sseClients)

try {
  await Promise.all([publisher.connect(), socketSubscriber.connect(), sseSubscriber.connect()])
  console.log('[Redis] 연결 성공')

  await sseSubscriber.subscribe('room-events', (e: string) => {
    const payload = `event: ${e}\ndata: \n\n`
    for (const res of [...sseClients]) {
      res.write(payload)
    }
  })
} catch (err) {
  console.log(`[Redis] ${err}`)
  process.exit(1)
}

app.set('publisher', publisher)
app.set('sseSubscriber', sseSubscriber)

const httpServer = createServer(app)
const io = new Server(httpServer, {
  cors: {
    origin: process.env.CLIENT_URL,
    credentials: true,
  },
})

io.adapter(createAdapter(publisher, socketSubscriber))

app.set('io', io)
setupSockets(io)

const PORT = process.env.PORT

httpServer.listen(PORT, () => {
  console.log(`https://localhost:${PORT}`)
})

const shutdown = async () => {
  try {
    await publisher.quit()
    await socketSubscriber.quit()
    await sseSubscriber.quit()
  } catch (err) {
    console.log(`[Redis] ${err}`)
  }
  process.exit(0)
}

process.on('SIGTERM', shutdown)
process.on('SIGINT', shutdown)
