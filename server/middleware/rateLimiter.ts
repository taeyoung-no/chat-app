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

function resolveLimiter(defaultLimiter: any, name: string) {
  return overrides[name] || defaultLimiter
}

export function setRateLimitOverride(name: string, limiter: any) {
  overrides[name] = limiter
}

export function createTestRateLimiter(points: number) {
  return new RateLimiterRedis({
    storeClient: redisClient,
    keyPrefix: `limiter:test-${Date.now()}`,
    points,
    duration: 60,
  })
}

const rateLimitDisabled = process.env.RATE_LIMIT_DISABLED === 'true'

export async function consumeRegisterRateLimit(req: Request, res: Response, next: NextFunction) {
  if (rateLimitDisabled) return next()
  try {
    const limiter = resolveLimiter(registerLimiter, 'register')
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
  if (rateLimitDisabled) return next()
  try {
    const limiter = resolveLimiter(loginLimiter, 'login')
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
  if (rateLimitDisabled) return next()
  try {
    const limiter = resolveLimiter(createRoomLimiter, 'create-room')
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
  if (rateLimitDisabled) return true
  try {
    const limiter = resolveLimiter(messageLimiter, 'message')
    await limiter.consume(key)
    return true
  } catch {
    return false
  }
}
