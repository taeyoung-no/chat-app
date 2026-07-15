import express, { Response } from 'express'
import cors from 'cors'
import helmet from 'helmet'
import sessionMiddleware from './middleware/session.js'
import authRouter from './routes/auth.js'
import roomRouter from './routes/room.js'
import errorHandler from './middleware/errorHandler.js'
import { register, setSseClientCount } from './metrics.js'

const app = express()

app.set('trust proxy', 1)

app.use(
  helmet({
    contentSecurityPolicy: false,
    crossOriginEmbedderPolicy: false,
    crossOriginResourcePolicy: { policy: 'cross-origin' },

    hsts: false,
    xContentTypeOptions: false,
    xFrameOptions: false,
    referrerPolicy: false,
  })
)

app.get('/metrics', async (_, res, next) => {
  try {
    res.set('Content-Type', register.contentType)
    res.end(await register.metrics())
  } catch (err) {
    next(err)
  }
})

app.get('/health', (_req, res) => {
  res.status(200).json({ status: 'ok' })
})

app.use(
  cors({
    origin: (origin, callback) => {
      if (!origin || origin === process.env.CLIENT_URL) {
        callback(null, true)
      } else {
        callback(new Error('[CORS] origin 허용 안 함'))
      }
    },
    credentials: true,
  })
)
app.use(express.json())
app.use(sessionMiddleware)
app.get('/stream/rooms', (req, res) => {
  const clients = req.app.get('sseClients') as Set<Response>
  clients.add(res)
  setSseClientCount(clients.size)

  res.writeHead(200, {
    Connection: 'keep-alive',
    'Content-Type': 'text/event-stream',
    'Cache-Control': 'no-cache',
  })
  res.write(': connected\n\n')

  const cleanup = () => {
    if (!clients.delete(res)) return
    setSseClientCount(clients.size)
  }
  res.on('close', cleanup)
})
app.use('/auth', authRouter)
app.use('/room', roomRouter)
app.use(errorHandler)

export default app
