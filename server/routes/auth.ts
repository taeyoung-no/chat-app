import express from 'express'
import bcrypt from 'bcrypt'
import User from '../models/Users'
import isAuthenticated from '../middleware/auth'

const router = express.Router()

router.post('/register', async (req, res) => {
  const { username, password } = req.body

  const existingUser = await User.findOne({ username: username })
  if (existingUser) return res.status(400).json({ message: 'username 중복임' })

  const hashedPassword = await bcrypt.hash(password, 10)
  await User.create({
    username: username,
    password: hashedPassword,
  })

  res.status(201).json({ message: '회원가입 성공' })
})

router.post('/login', async (req, res) => {
  const { username, password } = req.body

  const user = await User.findOne({ username: username })
  if (!user) return res.status(400).json({ message: '뭔가 잘못 입력함' })

  const isMatch = await bcrypt.compare(password, user.password)
  if (!isMatch) return res.status(400).json({ message: '뭔가 잘못 입력함' })

  req.session.userId = user._id.toString()
  req.session.username = user.username

  res.json({
    message: '로그인 성공',
    username: user.username,
  })
})

router.post('/logout', (req, res) => {
  if (!req.session.userId)
    return res.status(401).json({ message: '로그인부터 하세요' })

  req.session.destroy((err) => {
    if (err) return res.status(500).json({ message: '로그아웃 실패' })
    res.clearCookie('connect.sid')
    res.json({ message: '로그아웃 성공' })
  })
})

router.get('/me', isAuthenticated, (req, res) => {
  res.json({
    userId: req.session.userId,
    username: req.session.username,
  })
})

export default router
