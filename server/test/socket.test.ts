import app, { createTestSocketServer } from './setup'
import request from 'supertest'
import { beforeAll, afterAll, describe, expect, it } from 'vitest'
import { io as Client } from 'socket.io-client'
import { setRateLimitOverride, createTestRateLimiter } from '../middleware/rateLimiter.js'

describe('Socket / Message', () => {
  let url: string
  let httpServer: any
  let ioServer: any

  beforeAll(async () => {
    const srv = await createTestSocketServer()
    url = srv.url
    httpServer = srv.httpServer
    ioServer = srv.io

    app.set('publisher', { publish: () => {} })
  })

  afterAll(() => {
    ioServer?.close()
    httpServer?.close()
  })

  it('인증 없이 소켓 연결하면 실패', async () => {
    const client = Client(url, {
      path: '/api/socket.io',
      withCredentials: true,
      extraHeaders: { Origin: process.env.CLIENT_URL! },
    })

    const err = await new Promise<any>((resolve) => {
      client.once('error', (e) => {
        resolve(e)
        client.close()
      })
      client.emit('join', 'dummy-room')
    })

    expect(err).toBeTruthy()
    expect(err.message).toBeDefined()
  })

  it('로그인 후 join, messages 수신, 메시지 전송, broadcast 수신', async () => {
    const agent = request.agent(app)

    const res = await agent
      .set('Origin', process.env.CLIENT_URL)
      .post('/api/auth/register')
      .send({ username: 'username', password: 'password' })
    await agent
      .set('Origin', process.env.CLIENT_URL)
      .post('/api/auth/login')
      .send({ username: 'username', password: 'password' })

    const cookies = res.headers['set-cookie']
    const cookieHeader = Array.isArray(cookies) ? cookies.join('; ') : cookies || ''

    const client = Client(url, {
      path: '/api/socket.io',
      withCredentials: true,
      extraHeaders: { Cookie: cookieHeader, Origin: process.env.CLIENT_URL! },
    })

    await new Promise<void>((resolve) => {
      client.on('connect', resolve)
    })

    const createRes = await agent.set('Origin', process.env.CLIENT_URL).post('/api/room').send({ name: 'room' })
    const roomId = createRes.body.room._id

    client.emit('join', roomId)

    const messages = await new Promise<any>((resolve) => {
      client.once('messages', resolve)
    })
    expect(messages).toEqual([])

    client.emit('message', { roomId, content: 'Hello World!' })

    const received = await new Promise<any>((resolve) => {
      client.once('message', resolve)
    })

    expect(received).toHaveProperty('_id')
    expect(received.roomId).toBe(roomId)
    expect(received.username).toBe('username')
    expect(received.content).toBe('Hello World!')

    client.close()
  })

  it('잘못된 메시지 전송 시 error 이벤트 수신', async () => {
    const agent = request.agent(app)
    const res = await agent
      .set('Origin', process.env.CLIENT_URL)
      .post('/api/auth/register')
      .send({ username: 'username', password: 'password' })
    await agent
      .set('Origin', process.env.CLIENT_URL)
      .post('/api/auth/login')
      .send({ username: 'username', password: 'password' })

    const cookies = res.headers['set-cookie']
    const cookieHeader = Array.isArray(cookies) ? cookies.join('; ') : cookies || ''

    const client = Client(url, {
      path: '/api/socket.io',
      withCredentials: true,
      extraHeaders: { Cookie: cookieHeader, Origin: process.env.CLIENT_URL! },
    })

    await new Promise<void>((resolve) => client.on('connect', resolve))

    const createRes = await agent.set('Origin', process.env.CLIENT_URL).post('/api/room').send({ name: 'room' })
    const roomId = createRes.body.room._id

    client.emit('join', roomId)
    await new Promise((resolve) => client.once('messages', resolve))

    client.emit('message', { roomId, content: ' ' })

    const err = await new Promise<any>((resolve) => {
      client.once('error', resolve)
    })

    expect(err).toBeTruthy()
    expect(err.message).toBeDefined()

    client.close()
  })

  it('메시지 브로드캐스트', async () => {
    const agent1 = request.agent(app)
    let res = await agent1
      .set('Origin', process.env.CLIENT_URL)
      .post('/api/auth/register')
      .send({ username: 'username', password: 'password' })
    await agent1
      .set('Origin', process.env.CLIENT_URL)
      .post('/api/auth/login')
      .send({ username: 'username', password: 'password' })
    const cookies1 = res.headers['set-cookie']
    const cookieHeader1 = Array.isArray(cookies1) ? cookies1.join('; ') : cookies1 || ''

    const agent2 = request.agent(app)
    res = await agent2
      .set('Origin', process.env.CLIENT_URL)
      .post('/api/auth/register')
      .send({ username: 'other', password: 'password' })
    await agent2
      .set('Origin', process.env.CLIENT_URL)
      .post('/api/auth/login')
      .send({ username: 'other', password: 'password' })
    const cookies2 = res.headers['set-cookie']
    const cookieHeader2 = Array.isArray(cookies2) ? cookies2.join('; ') : cookies2 || ''

    const client1 = Client(url, {
      path: '/api/socket.io',
      withCredentials: true,
      extraHeaders: { Cookie: cookieHeader1, Origin: process.env.CLIENT_URL! },
    })
    const client2 = Client(url, {
      path: '/api/socket.io',
      withCredentials: true,
      extraHeaders: { Cookie: cookieHeader2, Origin: process.env.CLIENT_URL! },
    })

    await Promise.all([
      new Promise<void>((resolve) => client1.on('connect', resolve)),
      new Promise<void>((resolve) => client2.on('connect', resolve)),
    ])

    const createRes = await agent1.set('Origin', process.env.CLIENT_URL).post('/api/room').send({ name: 'room' })
    const roomId = createRes.body.room._id

    client1.emit('join', roomId)
    client2.emit('join', roomId)

    await Promise.all([
      new Promise((resolve) => client1.once('messages', resolve)),
      new Promise((resolve) => client2.once('messages', resolve)),
    ])

    client1.emit('message', { roomId, content: 'Hello World!' })

    const received = await new Promise<any>((resolve) => {
      client2.once('message', resolve)
    })

    expect(received.content).toBe('Hello World!')
    expect(received.username).toBe('username')

    client1.close()
    client2.close()
  })

  it('messages 이벤트 수신', async () => {
    const agent = request.agent(app)
    const res = await agent
      .set('Origin', process.env.CLIENT_URL)
      .post('/api/auth/register')
      .send({ username: 'username', password: 'password' })
    await agent
      .set('Origin', process.env.CLIENT_URL)
      .post('/api/auth/login')
      .send({ username: 'username', password: 'password' })

    const cookies = res.headers['set-cookie']
    const cookieHeader = Array.isArray(cookies) ? cookies.join('; ') : cookies || ''

    const client1 = Client(url, {
      path: '/api/socket.io',
      withCredentials: true,
      extraHeaders: { Cookie: cookieHeader, Origin: process.env.CLIENT_URL! },
    })

    await new Promise<void>((resolve) => {
      client1.on('connect', resolve)
    })

    const createRes = await agent.set('Origin', process.env.CLIENT_URL).post('/api/room').send({ name: 'room' })
    const roomId = createRes.body.room._id

    client1.emit('join', roomId)
    await new Promise((resolve) => client1.once('messages', resolve))

    client1.emit('message', { roomId, content: 'Hello World!' })
    await new Promise((resolve) => client1.once('message', resolve))

    const client2 = Client(url, {
      path: '/api/socket.io',
      withCredentials: true,
      extraHeaders: { Cookie: cookieHeader, Origin: process.env.CLIENT_URL! },
    })

    await new Promise<void>((resolve) => {
      client2.on('connect', resolve)
    })

    client2.emit('join', roomId)

    const history = await new Promise<any[]>((resolve) => {
      client2.once('messages', resolve)
    })

    expect(history.length).toBe(1)
    expect(history[0].content).toBe('Hello World!')
    expect(history[0].username).toBe('username')
    expect(history[0]).toHaveProperty('_id')

    client1.close()
    client2.close()
  })

  it('없는 방에 메시지 전송 시 error 이벤트 수신', async () => {
    const agent = request.agent(app)
    const res = await agent
      .set('Origin', process.env.CLIENT_URL)
      .post('/api/auth/register')
      .send({ username: 'username', password: 'password' })
    await agent
      .set('Origin', process.env.CLIENT_URL)
      .post('/api/auth/login')
      .send({ username: 'username', password: 'password' })

    const cookies = res.headers['set-cookie']
    const cookieHeader = Array.isArray(cookies) ? cookies.join('; ') : cookies || ''

    const client = Client(url, {
      path: '/api/socket.io',
      withCredentials: true,
      extraHeaders: { Cookie: cookieHeader, Origin: process.env.CLIENT_URL! },
    })

    await new Promise<void>((resolve) => {
      client.on('connect', resolve)
    })

    client.emit('message', { roomId: '507f1f77bcf86cd799439011', content: 'Hello World!' })

    const err = await new Promise<any>((resolve) => {
      client.once('error', resolve)
    })

    expect(err).toBeTruthy()

    client.close()
  })

  it('rate limit 초과 시 error 이벤트 수신 (message)', async () => {
    const agent = request.agent(app)
    const res = await agent
      .set('Origin', process.env.CLIENT_URL)
      .post('/api/auth/register')
      .send({ username: 'username', password: 'password' })

    const cookies = res.headers['set-cookie']
    const cookieHeader = Array.isArray(cookies) ? cookies.join('; ') : cookies || ''

    const client = Client(url, {
      path: '/api/socket.io',
      withCredentials: true,
      extraHeaders: { Cookie: cookieHeader, Origin: process.env.CLIENT_URL! },
    })

    await new Promise<void>((resolve) => {
      client.on('connect', resolve)
    })

    const createRes = await agent.set('Origin', process.env.CLIENT_URL).post('/api/room').send({ name: 'room' })
    const roomId = createRes.body.room._id

    client.emit('join', roomId)
    await new Promise((resolve) => client.once('messages', resolve))

    const limiter = createTestRateLimiter(1)
    setRateLimitOverride('message', limiter)

    client.emit('message', { roomId, content: 'Hello World!' })
    const received = await new Promise<any>((resolve) => {
      client.once('message', resolve)
    })
    expect(received.content).toBe('Hello World!')

    client.emit('message', { roomId, content: 'Hello World!' })
    const err = await new Promise<any>((resolve) => {
      client.once('error', resolve)
    })
    expect(err).toBeTruthy()

    client.close()
    setRateLimitOverride('message', { consume: async () => {} })
  })
})
