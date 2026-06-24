import app, { createTestSocketServer } from './setup'
import request from 'supertest'
import { beforeAll, afterAll, describe, expect, it } from 'vitest'
import { io as Client } from 'socket.io-client'

describe('Socket / Message', () => {
  let url: string
  let httpServer: any
  let ioServer: any

  beforeAll(async () => {
    const srv = await createTestSocketServer()
    url = srv.url
    httpServer = srv.httpServer
    ioServer = srv.io
  })

  afterAll(() => {
    ioServer?.close()
    httpServer?.close()
  })

  it('인증 없이 소켓 연결하면 실패', async () => {
    const client = Client(url, {
      withCredentials: true,
    })

    const err = await new Promise<any>((resolve) => {
      client.on('connect_error', (e) => {
        resolve(e)
        client.close()
      })
      client.on('connect', () => {
        client.close()
        resolve(null)
      })
    })

    expect(err).toBeTruthy()
    expect(err.message).toBeDefined()
  })

  it('로그인 후 join, messages 수신, 메시지 전송, broadcast 수신', async () => {
    const agent = request.agent(app)

    await agent.post('/auth/register').send({ username: 'username', password: 'password' })
    const loginRes = await agent.post('/auth/login').send({ username: 'username', password: 'password' })

    const cookies = loginRes.headers['set-cookie']
    const cookieHeader = Array.isArray(cookies) ? cookies.join('; ') : cookies || ''

    const client = Client(url, {
      withCredentials: true,
      extraHeaders: { Cookie: cookieHeader },
    })

    await new Promise<void>((resolve) => {
      client.on('connect', resolve)
    })

    const createRes = await agent.post('/room').send({ name: 'room' })
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
    await agent.post('/auth/register').send({ username: 'username', password: 'password' })
    const loginRes = await agent.post('/auth/login').send({ username: 'username', password: 'password' })

    const cookies = loginRes.headers['set-cookie']
    const cookieHeader = Array.isArray(cookies) ? cookies.join('; ') : cookies || ''

    const client = Client(url, {
      withCredentials: true,
      extraHeaders: { Cookie: cookieHeader },
    })

    await new Promise<void>((resolve) => client.on('connect', resolve))

    const createRes = await agent.post('/room').send({ name: 'room' })
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

  it('방 생성/삭제 시 create, delete 이벤트 수신', async () => {
    const agent = request.agent(app)
    await agent.post('/auth/register').send({ username: 'username', password: 'password' })
    const loginRes = await agent.post('/auth/login').send({ username: 'username', password: 'password' })

    const cookies = loginRes.headers['set-cookie']
    const cookieHeader = Array.isArray(cookies) ? cookies.join('; ') : cookies || ''

    const client = Client(url, {
      withCredentials: true,
      extraHeaders: { Cookie: cookieHeader },
    })

    await new Promise<void>((resolve) => client.on('connect', resolve))

    const createPromise = new Promise<any>((resolve) => {
      client.once('create', resolve)
    })

    const createRes = await agent.post('/room').send({ name: 'room' })
    const roomId = createRes.body.room._id

    await createPromise

    const deletePromise = new Promise<any>((resolve) => {
      client.once('delete', resolve)
    })

    await agent.delete(`/room/${roomId}`)

    await deletePromise

    client.close()
  })

  it('메시지 브로드캐스트', async () => {
    const agent1 = request.agent(app)
    await agent1.post('/auth/register').send({ username: 'username', password: 'password' })
    const login1 = await agent1.post('/auth/login').send({ username: 'username', password: 'password' })
    const cookies1 = login1.headers['set-cookie']
    const cookieHeader1 = Array.isArray(cookies1) ? cookies1.join('; ') : cookies1 || ''

    const agent2 = request.agent(app)
    await agent2.post('/auth/register').send({ username: 'other', password: 'password' })
    const login2 = await agent2.post('/auth/login').send({ username: 'other', password: 'password' })
    const cookies2 = login2.headers['set-cookie']
    const cookieHeader2 = Array.isArray(cookies2) ? cookies2.join('; ') : cookies2 || ''

    const client1 = Client(url, {
      withCredentials: true,
      extraHeaders: { Cookie: cookieHeader1 },
    })
    const client2 = Client(url, {
      withCredentials: true,
      extraHeaders: { Cookie: cookieHeader2 },
    })

    await Promise.all([
      new Promise<void>((resolve) => client1.on('connect', resolve)),
      new Promise<void>((resolve) => client2.on('connect', resolve)),
    ])

    const createRes = await agent1.post('/room').send({ name: 'room' })
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
    await agent.post('/auth/register').send({ username: 'username', password: 'password' })
    const loginRes = await agent.post('/auth/login').send({ username: 'username', password: 'password' })

    const cookies = loginRes.headers['set-cookie']
    const cookieHeader = Array.isArray(cookies) ? cookies.join('; ') : cookies || ''

    const client1 = Client(url, {
      withCredentials: true,
      extraHeaders: { Cookie: cookieHeader },
    })

    await new Promise<void>((resolve) => {
      client1.on('connect', resolve)
    })

    const createRes = await agent.post('/room').send({ name: 'room' })
    const roomId = createRes.body.room._id

    client1.emit('join', roomId)
    await new Promise((resolve) => client1.once('messages', resolve))

    client1.emit('message', { roomId, content: 'Hello World!' })
    await new Promise((resolve) => client1.once('message', resolve))

    const client2 = Client(url, {
      withCredentials: true,
      extraHeaders: { Cookie: cookieHeader },
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
})
