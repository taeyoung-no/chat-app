import app from './setup'
import request from 'supertest'
import { beforeEach, describe, expect, it } from 'vitest'
import { setRateLimitOverride, createTestRateLimiter } from '../middleware/rateLimiter.js'

describe('Auth API', () => {
  describe('POST /api/auth/register', () => {
    it('회원가입 성공', async () => {
      const res = await request(app)
        .post('/api/auth/register')
        .set('Origin', process.env.CLIENT_URL!)
        .send({ username: 'username', password: 'password' })

      expect(res.status).toBe(201)
      expect(res.body.success).toBe(true)
      expect(res.body.user).toHaveProperty('_id')
      expect(res.body.user.username).toBe('username')
      expect(res.body.user).not.toHaveProperty('password')
    })

    it('username 중복이면 400', async () => {
      await request(app)
        .post('/api/auth/register')
        .set('Origin', process.env.CLIENT_URL!)
        .send({ username: 'username', password: 'password' })
      const res = await request(app)
        .post('/api/auth/register')
        .set('Origin', process.env.CLIENT_URL!)
        .send({ username: 'username', password: 'password' })

      expect(res.status).toBe(400)
      expect(res.body.success).toBe(false)
    })

    it('username 공백이면 400', async () => {
      const res = await request(app)
        .post('/api/auth/register')
        .set('Origin', process.env.CLIENT_URL!)
        .send({ username: ' ' })

      expect(res.status).toBe(400)
      expect(res.body.success).toBe(false)
    })

    it('password 8자 미만이면 400', async () => {
      const res = await request(app)
        .post('/api/auth/register')
        .set('Origin', process.env.CLIENT_URL!)
        .send({ username: 'username', password: 'pwd' })

      expect(res.status).toBe(400)
      expect(res.body.success).toBe(false)
    })
  })

  describe('POST /api/auth/login', () => {
    beforeEach(async () => {
      await request(app)
        .post('/api/auth/register')
        .set('Origin', process.env.CLIENT_URL!)
        .send({ username: 'username', password: 'password' })
    })

    it('정상 로그인 성공', async () => {
      const res = await request(app)
        .post('/api/auth/login')
        .set('Origin', process.env.CLIENT_URL!)
        .send({ username: 'username', password: 'password' })

      expect(res.status).toBe(200)
      expect(res.body.success).toBe(true)
      expect(res.body.user.username).toBe('username')
    })

    it('비밀번호 틀리면 400', async () => {
      const res = await request(app)
        .post('/api/auth/login')
        .set('Origin', process.env.CLIENT_URL!)
        .send({ username: 'username', password: 'wrongpw' })

      expect(res.status).toBe(400)
    })
  })

  describe('인증이 필요한 흐름', () => {
    it('로그인 후 /me 조회, 로그아웃 후 /me 조회', async () => {
      const agent = request.agent(app)

      await agent
        .set('Origin', process.env.CLIENT_URL)
        .post('/api/auth/register')
        .send({ username: 'username', password: 'password' })
      await agent
        .set('Origin', process.env.CLIENT_URL)
        .post('/api/auth/login')
        .send({ username: 'username', password: 'password' })

      const meRes = await agent.set('Origin', process.env.CLIENT_URL).get('/api/auth/me')
      expect(meRes.status).toBe(200)
      expect(meRes.body.success).toBe(true)
      expect(meRes.body.user.username).toBe('username')

      const logoutRes = await agent.set('Origin', process.env.CLIENT_URL).post('/api/auth/logout')
      expect(logoutRes.status).toBe(200)
      expect(logoutRes.body.success).toBe(true)

      const meAfter = await agent.set('Origin', process.env.CLIENT_URL).get('/api/auth/me')
      expect(meAfter.status).toBe(200)
      expect(meAfter.body.user).toBe(null)
    })
  })

  describe('rate limit', () => {
    it('rate limit 초과 시 429 반환 (register)', async () => {
      const limiter = createTestRateLimiter(1)
      setRateLimitOverride('register', limiter)

      const res1 = await request(app)
        .post('/api/auth/register')
        .set('Origin', process.env.CLIENT_URL!)
        .send({ username: 'username', password: 'password' })
      expect(res1.status).toBe(201)

      const res2 = await request(app)
        .post('/api/auth/register')
        .set('Origin', process.env.CLIENT_URL!)
        .send({ username: 'username', password: 'password' })
      expect(res2.status).toBe(429)
      expect(res2.body.success).toBe(false)
      setRateLimitOverride('register', { consume: async () => {} })
    })

    it('rate limit 초과 시 429 반환 (login)', async () => {
      await request(app)
        .post('/api/auth/register')
        .set('Origin', process.env.CLIENT_URL!)
        .send({ username: 'username', password: 'password' })

      const limiter = createTestRateLimiter(1)
      setRateLimitOverride('login', limiter)

      const res1 = await request(app)
        .post('/api/auth/login')
        .set('Origin', process.env.CLIENT_URL!)
        .send({ username: 'username', password: 'password' })
      expect(res1.status).toBe(200)

      const res2 = await request(app)
        .post('/api/auth/login')
        .set('Origin', process.env.CLIENT_URL!)
        .send({ username: 'username', password: 'password' })
      expect(res2.status).toBe(429)
      expect(res2.body.success).toBe(false)
      setRateLimitOverride('login', { consume: async () => {} })
    })
  })
})
