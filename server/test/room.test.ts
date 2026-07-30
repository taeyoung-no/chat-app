import app from './setup'
import request from 'supertest'
import { beforeAll, describe, expect, it } from 'vitest'
import { setRateLimitOverride, createTestRateLimiter } from '../middleware/rateLimiter.js'

beforeAll(() => {
  app.set('publisher', { publish: () => {} })
})

describe('Room API', () => {
  describe('GET /api/room', () => {
    it('방이 없을 때 빈 배열 반환', async () => {
      const res = await request(app).get('/api/room')

      expect(res.status).toBe(200)
      expect(res.body.success).toBe(true)
      expect(res.body.rooms).toEqual([])
    })

    it('생성된 방 목록 반환', async () => {
      const agent = request.agent(app)
      await agent
        .post('/api/auth/register')
        .send({ username: 'username', password: 'password' })
      await agent
        .post('/api/auth/login')
        .send({ username: 'username', password: 'password' })

      await agent.post('/api/room').send({ name: 'room' })

      const res = await request(app).get('/api/room')

      expect(res.status).toBe(200)
      expect(res.body.success).toBe(true)
      expect(res.body.rooms.length).toBe(1)
      expect(res.body.rooms[0].name).toBe('room')
      expect(res.body.rooms[0].username).toBe('username')
    })
  })

  describe('POST /api/room', () => {
    it('방 생성 성공', async () => {
      const agent = request.agent(app)
      await agent
        .post('/api/auth/register')
        .send({ username: 'username', password: 'password' })
      await agent
        .post('/api/auth/login')
        .send({ username: 'username', password: 'password' })
      const res = await agent.post('/api/room').send({ name: 'room' })

      expect(res.status).toBe(201)
      expect(res.body.success).toBe(true)
      expect(res.body.room).toHaveProperty('_id')
      expect(res.body.room.name).toBe('room')
      expect(res.body.room.username).toBe('username')
      expect(res.body.room).toHaveProperty('createdAt')
    })

    it('인증 없이 방 생성 시 401', async () => {
      const res = await request(app).post('/api/room').send({ name: 'room' })

      expect(res.status).toBe(401)
      expect(res.body.success).toBe(false)
    })

    it('방 이름이 공백이면 400', async () => {
      const agent = request.agent(app)
      await agent
        .post('/api/auth/register')
        .send({ username: 'username', password: 'password' })
      await agent
        .post('/api/auth/login')
        .send({ username: 'username', password: 'password' })
      const res = await agent.post('/api/room').send({ name: ' ' })

      expect(res.status).toBe(400)
      expect(res.body.success).toBe(false)
    })

    it('방 이름 32자 초과하면 400', async () => {
      const agent = request.agent(app)
      await agent
        .post('/api/auth/register')
        .send({ username: 'username', password: 'password' })
      await agent
        .post('/api/auth/login')
        .send({ username: 'username', password: 'password' })
      const res = await agent
        .post('/api/room')
        .send({ name: 'a'.repeat(33) })

      expect(res.status).toBe(400)
      expect(res.body.success).toBe(false)
    })
  })

  describe('DELETE /api/room/:id', () => {
    it('방 삭제 성공', async () => {
      const agent = request.agent(app)
      await agent
        .post('/api/auth/register')
        .send({ username: 'username', password: 'password' })
      await agent
        .post('/api/auth/login')
        .send({ username: 'username', password: 'password' })
      const createRes = await agent.post('/api/room').send({ name: 'room' })
      const roomId = createRes.body.room._id

      const deleteRes = await agent.delete(`/api/room/${roomId}`)
      expect(deleteRes.status).toBe(200)
      expect(deleteRes.body.success).toBe(true)

      const listRes = await request(app).get('/api/room')
      expect(listRes.body.rooms.find((r: any) => r._id === roomId)).toBeUndefined()
    })

    it('존재하지 않는 방 삭제 시 404', async () => {
      const agent = request.agent(app)
      await agent
        .post('/api/auth/register')
        .send({ username: 'username', password: 'password' })
      await agent
        .post('/api/auth/login')
        .send({ username: 'username', password: 'password' })
      const res = await agent.delete('/api/room/507f1f77bcf86cd799439011') // 유효한 ObjectId 형식의 존재하지 않는 ID

      expect(res.status).toBe(404)
      expect(res.body.success).toBe(false)
    })

    it('권한 없는데 삭제 시도 시 403', async () => {
      const owner = request.agent(app)
      await owner
        .post('/api/auth/register')
        .send({ username: 'username', password: 'password' })
      await owner
        .post('/api/auth/login')
        .send({ username: 'username', password: 'password' })
      const createRes = await owner.post('/api/room').send({ name: 'room' })
      const roomId = createRes.body.room._id

      const other = request.agent(app)
      await other
        .post('/api/auth/register')
        .send({ username: 'other', password: 'password' })
      await other
        .post('/api/auth/login')
        .send({ username: 'other', password: 'password' })
      const res = await other.delete(`/api/room/${roomId}`)

      expect(res.status).toBe(403)
      expect(res.body.success).toBe(false)
    })

    it('인증 없이 삭제 시도 시 401', async () => {
      const res = await request(app).delete('/api/room/507f1f77bcf86cd799439011')

      expect(res.status).toBe(401)
      expect(res.body.success).toBe(false)
    })
  })

  describe('rate limit', () => {
    it('rate limit 초과 시 429 반환', async () => {
      const agent = request.agent(app)
      await agent
        .post('/api/auth/register')
        .send({ username: 'username', password: 'password' })
      await agent
        .post('/api/auth/login')
        .send({ username: 'username', password: 'password' })

      const limiter = createTestRateLimiter(1)
      setRateLimitOverride('create-room', limiter)

      const res1 = await agent.post('/api/room').send({ name: 'room' })
      expect(res1.status).toBe(201)

      const res2 = await agent.post('/api/room').send({ name: 'room' })
      expect(res2.status).toBe(429)
      expect(res2.body.success).toBe(false)
      setRateLimitOverride('create-room', { consume: async () => {} })
    })
  })
})
