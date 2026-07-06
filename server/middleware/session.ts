import session from 'express-session'
import RedisStore from 'connect-redis'
import { createClient } from 'redis'

const redisClient = createClient({
  url: process.env.REDIS_URL!,
  socket: {
    reconnectStrategy: (retries) => {
      console.log(`[Redis] 재연결 시도 ${retries}`)
      return Math.min(retries * 100, 3000)
    },
  },
})

redisClient.on('error', (err) => console.log(`[Redis] ${err}`))

redisClient.connect().catch((err) => console.log(`[Redis] ${err}`))

const shutdown = async () => {
  try {
    await redisClient.quit()
  } catch (err) {
    console.log(`[Redis] ${err}`)
  }
}

process.on('SIGTERM', shutdown)
process.on('SIGINT', shutdown)

const sessionMiddleware = session({
  secret: process.env.SESSION_SECRET!,
  resave: false,
  saveUninitialized: false,
  store: new RedisStore({
    client: redisClient,
    prefix: 'sess:',
  }),
  cookie: {
    httpOnly: true,
    secure: true,
    sameSite: 'lax',
    maxAge: 60 * 60 * 24 * 1000,
  },
})

export default sessionMiddleware
