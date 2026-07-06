import { describe, expect, it } from 'vitest'
import validate from '../utils/validate'
import { registerSchema, loginSchema } from 'shared/schemas/auth'
import { createRoomSchema } from 'shared/schemas/room'
import { sendMessageSchema } from 'shared/schemas/message'

describe('validate', () => {
  describe('register', () => {
    it('유효한 입력', () => {
      const data = validate(registerSchema, {
        username: 'username',
        password: 'password',
      })

      expect(data.username).toBe('username')
      expect(data.password).toBe('password')
    })

    it('trim', () => {
      const data = validate(registerSchema, {
        username: ' username ',
        password: ' password ',
      })

      expect(data.username).toBe('username')
      expect(data.password).toBe('password')
    })

    it('username 공백 시 실패', () => {
      expect(() =>
        validate(registerSchema, {
          username: '',
          password: 'password',
        })
      ).toThrow()
    })

    it('password 공백 시 실패', () => {
      expect(() =>
        validate(registerSchema, {
          username: 'username',
          password: '',
        })
      ).toThrow()
    })

    it('password 8자 미만이면 실패', () => {
      expect(() =>
        validate(registerSchema, {
          username: 'username',
          password: 'pwd',
        })
      ).toThrow()
    })
  })

  describe('login', () => {
    it('유효한 입력', () => {
      const data = validate(loginSchema, {
        username: 'username',
        password: 'password',
      })

      expect(data.username).toBe('username')
      expect(data.password).toBe('password')
    })

    it('username 공백 시 실패', () => {
      expect(() =>
        validate(loginSchema, {
          username: ' ',
          password: 'password',
        })
      ).toThrow()
    })

    it('password 공백 시 실패', () => {
      expect(() =>
        validate(loginSchema, {
          username: 'username',
          password: ' ',
        })
      ).toThrow()
    })

    it('password 8자 미만이면 실패', () => {
      expect(() =>
        validate(loginSchema, {
          username: 'username',
          password: 'pwd',
        })
      ).toThrow()
    })
  })

  describe('createRoom', () => {
    it('유효한 입력', () => {
      const data = validate(createRoomSchema, {
        name: 'room',
      })

      expect(data.name).toBe('room')
    })

    it('trim', () => {
      const data = validate(createRoomSchema, {
        name: ' room ',
      })

      expect(data.name).toBe('room')
    })

    it('방 이름 공백 시 실패', () => {
      expect(() =>
        validate(createRoomSchema, {
          name: '',
        })
      ).toThrow()
    })

    it('방 이름 32자 초과이면 실패', () => {
      expect(() =>
        validate(createRoomSchema, {
          name: 'a'.repeat(33),
        })
      ).toThrow()
    })
  })

  describe('sendMessage', () => {
    it('유효한 입력', () => {
      const data = validate(sendMessageSchema, {
        roomId: '507f1f77bcf86cd799439011',
        content: 'Hello World!',
      })

      expect(data.roomId).toBe('507f1f77bcf86cd799439011')
      expect(data.content).toBe('Hello World!')
    })

    it('trim', () => {
      const data = validate(sendMessageSchema, {
        roomId: '507f1f77bcf86cd799439011',
        content: ' Hello World! ',
      })

      expect(data.content).toBe('Hello World!')
    })

    it('roomId 공백 시 실패', () => {
      expect(() =>
        validate(sendMessageSchema, {
          roomId: ' ',
          content: 'Hello World!',
        })
      ).toThrow()
    })

    it('content 공백 시 실패', () => {
      expect(() =>
        validate(sendMessageSchema, {
          roomId: '507f1f77bcf86cd799439011',
          content: '',
        })
      ).toThrow()
    })

    it('content 32자 초과이면 실패', () => {
      expect(() =>
        validate(sendMessageSchema, {
          roomId: '507f1f77bcf86cd799439011',
          content: 'a'.repeat(33),
        })
      ).toThrow()
    })
  })
})
