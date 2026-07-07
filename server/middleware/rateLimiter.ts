import { RateLimiterRedis } from 'rate-limiter-flexible'
import { createClient } from 'redis'
import type { Request, Response, NextFunction } from 'express'

if (!process.env.REDIS_URL) {
  throw new Error('[RateLimiter] Redis가 없는 듯')
}

const redisClient = createClient({
  url: process.env.REDIS_URL!,
  socket: {
    reconnectStrategy: () => false,
  },
})

redisClient.on('error', (err) => console.error(`[Redis RateLimiter] ${err}`))

try {
  await redisClient.connect()
} catch (err) {
  console.error(`[Redis RateLimiter] Redis 연결 실패`)
  throw err
}

const shutdown = async () => {
  try {
    await redisClient.quit()
  } catch (err) {
    console.log(`[Redis RateLimiter] ${err}`)
  }
}

process.on('SIGTERM', shutdown)
process.on('SIGINT', shutdown)

function createLimiter(keyPrefix: string) {
  return new RateLimiterRedis({
    storeClient: redisClient,
    keyPrefix: `limiter:${keyPrefix}`,
    points: 100,
    duration: 60,
  })
}

const registerLimiter = createLimiter('register')
const loginLimiter = createLimiter('login')
const createRoomLimiter = createLimiter('create-room')
const messageLimiter = createLimiter('message')

const overrides: Record<string, any> = {}

function resolveLimiter(defaultLimiter: any, req: Request, name: string) {
  const mock = (req as any).app?.get(`limiter:${name}`) || overrides[name]
  return mock || defaultLimiter
}

export function setRateLimitOverride(name: string, limiter: any) {
  overrides[name] = limiter
}

export async function consumeRegisterRateLimit(req: Request, res: Response, next: NextFunction) {
  try {
    const limiter = resolveLimiter(registerLimiter, req, 'register')
    const key = req.ip
    await limiter.consume(key)
    next()
  } catch {
    res.status(429).json({
      success: false,
      message: '요청 너무 많이 하지 마세요',
    })
  }
}

export async function consumeLoginRateLimit(req: Request, res: Response, next: NextFunction) {
  try {
    const limiter = resolveLimiter(loginLimiter, req, 'login')
    const key = req.ip
    await limiter.consume(key)
    next()
  } catch {
    res.status(429).json({
      success: false,
      message: '요청 너무 많이 하지 마세요',
    })
  }
}

export async function consumeCreateRoomRateLimit(req: Request, res: Response, next: NextFunction) {
  try {
    const limiter = resolveLimiter(createRoomLimiter, req, 'create-room')
    const key = (req as any).session?.userId
    await limiter.consume(key)
    next()
  } catch {
    res.status(429).json({
      success: false,
      message: '요청 너무 많이 하지 마세요',
    })
  }
}

export async function consumeMessageRateLimit(key: string) {
  try {
    const limiter = overrides['message'] || messageLimiter
    await limiter.consume(key)
    return true
  } catch {
    return false
  }
}
