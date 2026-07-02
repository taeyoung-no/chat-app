import express from 'express'
import cors from 'cors'
import sessionMiddleware from './middleware/session'
import authRouter from './routes/auth.js'
import roomRouter from './routes/room.js'
import errorHandler from './middleware/errorHandler.js'

const app = express()

app.set('trust proxy', 1)

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

export default app
