import { beforeAll, afterAll, afterEach } from 'vitest'
import { MongoMemoryServer } from 'mongodb-memory-server'
import mongoose from 'mongoose'
import { createServer } from 'http'
import { Server as SocketIOServer } from 'socket.io'
import { setupSockets } from '../socket.js'
import { setRateLimitOverride } from '../middleware/rateLimiter.js'

let mongod: MongoMemoryServer
let app: any

beforeAll(async () => {
  mongod = await MongoMemoryServer.create()
  const uri = (process.env.MONGODB_URI = mongod.getUri())
  await mongoose.connect(uri)

  app = (await import('../app.js')).default

  const mock = { consume: async () => {} }
  setRateLimitOverride('register', mock)
  setRateLimitOverride('login', mock)
  setRateLimitOverride('create-room', mock)
  setRateLimitOverride('message', mock)
})

afterEach(async () => {
  const collections = mongoose.connection.collections
  for (const key in collections) {
    await collections[key].deleteMany({})
  }
})

afterAll(async () => {
  await mongoose.disconnect()
  await mongod.stop()
})

export async function createTestSocketServer() {
  const httpServer = createServer(app)
  const io = new SocketIOServer(httpServer, {
    cors: {
      origin: (origin, callback) => {
        if (origin === process.env.CLIENT_URL) {
          callback(null, true)
        } else {
          callback(new Error('[CORS] origin 허용 안 함'))
        }
      },
      credentials: true,
    },
  })

  setupSockets(io)
  app.set('io', io)

  await new Promise<void>((resolve) => {
    httpServer.listen(0, () => resolve())
  })

  const address = httpServer.address()
  const port = typeof address === 'object' && address ? address.port : 0
  const url = `http://localhost:${port}`

  return { httpServer, io, url }
}

export { app as default }
