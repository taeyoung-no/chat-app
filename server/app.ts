import express from 'express'
import cors from 'cors'
import helmet from 'helmet'
import sessionMiddleware from './middleware/session.js'
import authRouter from './routes/auth.js'
import roomRouter from './routes/room.js'
import errorHandler from './middleware/errorHandler.js'

const app = express()

app.set('trust proxy', 1)

app.use(
  helmet({
    contentSecurityPolicy: {
      directives: {
        defaultSrc: ["'self'"],
        scriptSrc: ["'self'", "'unsafe-inline'", "'unsafe-eval'"],
        styleSrc: ["'self'", "'unsafe-inline'"],
        imgSrc: ["'self'", "data:", "https:"],
        connectSrc: ["'self'", "https:", "wss:", "ws:"],
        fontSrc: ["'self'"],
        objectSrc: ["'none'"],
        frameAncestors: ["'none'"],
        baseUri: ["'self'"],
        formAction: ["'self'"],
      },
    },
    crossOriginEmbedderPolicy: false,
    crossOriginResourcePolicy: { policy: 'cross-origin' },

    hsts: false,
    xContentTypeOptions: false,
    xFrameOptions: false,
    referrerPolicy: false,
  })
)

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
  req.app.get('sseClients').add(res)
  res.writeHead(200, {
    Connection: 'keep-alive',
    'Content-Type': 'text/event-stream',
    'Cache-Control': 'no-cache',
  })
})
app.use('/auth', authRouter)
app.use('/room', roomRouter)
app.use(errorHandler)

export default app
