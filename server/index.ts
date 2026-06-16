import express from 'express'
import cors from 'cors'
import dotenv from 'dotenv'
import mongoose from 'mongoose'
import authRouter from './routes/auth.js'
import roomRouter from './routes/room.js'
import sessionMiddleware from './middleware/session.js'

dotenv.config()

const app = express()

app.use(
  cors({
    origin: 'http://localhost:5173',
    credentials: true,
  })
)
app.use(express.json())
app.use(sessionMiddleware)
app.use('/auth', authRouter)
app.use('/room', roomRouter)

mongoose
  .connect(process.env.MONGODB_URI!)
  .then(() => console.log('[MongoDB] 연결 성공'))
  .catch((err) => console.log(`[MongoDB] ${err}`))

app.get('/', (req, res) => {
  res.send('Hello World!')
})

const PORT = process.env.PORT
app.listen(PORT, () => {
  console.log(`http://localhost:${PORT}`)
})
