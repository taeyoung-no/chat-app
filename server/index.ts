import express from 'express'
import cors from 'cors'
import dotenv from 'dotenv'
import mongoose from 'mongoose'
import authRouter from './routes/auth.js'

dotenv.config()

const app = express()

app.use(cors())
app.use(express.json())
app.use('/auth', authRouter)

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

