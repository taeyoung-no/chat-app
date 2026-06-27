import mongoose from 'mongoose'
import { createServer } from 'http'
import { Server } from 'socket.io'
import { createClient } from 'redis'
import { createAdapter } from '@socket.io/redis-adapter'
import app from './app.js'
import { setupSockets } from './socket.js'

try {
  await mongoose.connect(process.env.MONGODB_URI!)
  console.log('[MongoDB] 연결 성공')
} catch (err) {
  console.log(`[MongoDB] ${err}`)
  process.exit(1)
}

const pubClient = createClient({ url: process.env.REDIS_URL! })
const subClient = pubClient.duplicate()

pubClient.on('error', (err) => console.log(`[Redis pub] ${err}`))
subClient.on('error', (err) => console.log(`[Redis sub] ${err}`))

try {
  await Promise.all([pubClient.connect(), subClient.connect()])
  console.log('[Redis] 연결 성공')
} catch (err) {
  console.log(`[Redis] ${err}`)
  process.exit(1)
}

const httpServer = createServer(app)
const io = new Server(httpServer, {
  cors: {
    origin: process.env.CLIENT_URL,
    credentials: true,
  },
})

io.adapter(createAdapter(pubClient, subClient))

app.set('io', io)
setupSockets(io)

const PORT = process.env.PORT

httpServer.listen(PORT, () => {
  console.log(`http://localhost:${PORT}`)
})
