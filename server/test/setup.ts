import { beforeAll, afterAll, afterEach } from 'vitest'
import { MongoMemoryServer } from 'mongodb-memory-server'
import mongoose from 'mongoose'
import { createServer } from 'http'
import { Server as SocketIOServer } from 'socket.io'
import { setupSockets } from '../socket.js'

let mongod: MongoMemoryServer
let app: any

beforeAll(async () => {
  mongod = await MongoMemoryServer.create()
  const uri = mongod.getUri()

  process.env.MONGODB_URI = uri
  process.env.SESSION_SECRET = 'test-session-secret-1234567890-very-long-string'
  process.env.CLIENT_URL = 'http://localhost:5173'

  app = (await import('../app.js')).default

  await mongoose.connect(uri)
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
      origin: process.env.CLIENT_URL,
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
