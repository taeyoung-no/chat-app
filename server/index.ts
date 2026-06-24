import mongoose from 'mongoose'
import { createServer } from 'http'
import { Server } from 'socket.io'
import app from './app.js'
import { setupSockets } from './socket.js'

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
setupSockets(io)

const PORT = process.env.PORT

httpServer.listen(PORT, () => {
  console.log(`http://localhost:${PORT}`)
})
