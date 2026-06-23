import express from 'express'
import bcrypt from 'bcrypt'
import User from '../models/User'
import isAuthenticated from '../middleware/auth'
import AppError from '../utils/AppError'
import { loginSchema, registerSchema } from '../../shared/schemas/auth'
import validate from '../utils/validate'

const router = express.Router()

router.post('/register', async (req, res, next) => {
  try {
    const { username, password } = validate(registerSchema, req.body)

    const existingUser = await User.findOne({ username })
    if (existingUser) return next(new AppError('username 중복임', 400))

    const hashedPassword = await bcrypt.hash(password, 10)
    const user = await User.create({
      username,
      password: hashedPassword,
    })

    res.status(201).json({
      success: true,
      message: '회원가입 성공',
      user: {
        _id: user._id.toString(),
        username: user.username,
      },
    })
  } catch (err) {
    next(err)
  }
})

router.post('/login', async (req, res, next) => {
  try {
    const { username, password } = validate(loginSchema, req.body)

    const user = await User.findOne({ username })
    if (!user) return next(new AppError('뭔가 잘못 입력함', 400))

    const isMatch = await bcrypt.compare(password, user.password)
    if (!isMatch) return next(new AppError('뭔가 잘못 입력함', 400))

    req.session.userId = user._id.toString()
    req.session.username = user.username

    res.json({
      success: true,
      message: '로그인 성공',
      user: {
        _id: user._id.toString(),
        username: user.username,
      },
    })
  } catch (err) {
    next(err)
  }
})

router.post('/logout', (req, res, next) => {
  if (!req.session.userId) return next(new AppError('로그인부터 하세요', 401))

  req.session.destroy((err) => {
    if (err) return next(err)
    res.clearCookie('connect.sid')
    res.json({
      success: true,
      message: '로그아웃 성공',
    })
  })
})

router.get('/me', isAuthenticated, (req, res) => {
  res.json({
    success: true,
    message: '유저 정보 조회 성공',
    user: {
      _id: req.session.userId,
      username: req.session.username,
    },
  })
})

export default router
