import { describe, expect, it } from 'vitest'
import { registerSchema, loginSchema } from '../../shared/schemas/auth'
import { createRoomSchema } from '../../shared/schemas/room'
import { sendMessageSchema } from '../../shared/schemas/message'

describe('registerSchema', () => {
  it('유효한 입력', () => {
    const result = registerSchema.safeParse({
      username: 'username',
      password: 'password',
    })

    expect(result.success).toBe(true)
    if (result.success) {
      expect(result.data.username).toBe('username')
      expect(result.data.password).toBe('password')
    }
  })

  it('trim', () => {
    const result = registerSchema.safeParse({
      username: ' username ',
      password: ' password ',
    })

    expect(result.success).toBe(true)
    if (result.success) {
      expect(result.data.username).toBe('username')
      expect(result.data.password).toBe('password')
    }
  })

  it('username 공백 시 실패', () => {
    const result = registerSchema.safeParse({
      username: '',
      password: 'password',
    })

    expect(result.success).toBe(false)
  })

  it('password 공백 시 실패', () => {
    const result = registerSchema.safeParse({
      username: 'username',
      password: '',
    })

    expect(result.success).toBe(false)
  })
})

describe('loginSchema', () => {
  it('유효한 입력', () => {
    const result = loginSchema.safeParse({
      username: 'username',
      password: 'password',
    })

    expect(result.success).toBe(true)
  })

  it('username 공백 시 실패', () => {
    const result = loginSchema.safeParse({
      username: ' ',
      password: 'password',
    })

    expect(result.success).toBe(false)
  })

  it('password 공백 시 실패한다', () => {
    const result = loginSchema.safeParse({
      username: 'username',
      password: ' ',
    })

    expect(result.success).toBe(false)
  })
})

describe('createRoomSchema', () => {
  it('유효한 입력', () => {
    const result = createRoomSchema.safeParse({
      name: 'room',
    })

    expect(result.success).toBe(true)
    if (result.success) {
      expect(result.data.name).toBe('room')
    }
  })

  it('trim', () => {
    const result = createRoomSchema.safeParse({
      name: ' room ',
    })

    expect(result.success).toBe(true)
    if (result.success) {
      expect(result.data.name).toBe('room')
    }
  })

  it('방 이름 공백 시 실패', () => {
    const result = createRoomSchema.safeParse({
      name: '',
    })

    expect(result.success).toBe(false)
  })
})

describe('sendMessageSchema', () => {
  it('유효한 입력', () => {
    const result = sendMessageSchema.safeParse({
      roomId: '507f1f77bcf86cd799439011',
      content: 'Hello World!',
    })

    expect(result.success).toBe(true)
    if (result.success) {
      expect(result.data.content).toBe('Hello World!')
    }
  })

  it('trim', () => {
    const result = sendMessageSchema.safeParse({
      roomId: '507f1f77bcf86cd799439011',
      content: ' Hello World! ',
    })

    expect(result.success).toBe(true)
    if (result.success) {
      expect(result.data.content).toBe('Hello World!')
    }
  })

  it('roomId 공백 시 실패한다', () => {
    const result = sendMessageSchema.safeParse({
      roomId: ' ',
      content: 'Hello World!',
    })

    expect(result.success).toBe(false)
  })

  it('content 공백 시 실패한다', () => {
    const result = sendMessageSchema.safeParse({
      roomId: '507f1f77bcf86cd799439011',
      content: '',
    })

    expect(result.success).toBe(false)
  })
})
