import express from 'express'
import bcrypt from 'bcrypt'
import User from '../models/Users'

const router = express.Router()

router.post('/register', async (req, res) => {
  const { username, password } = req.body

  const existingUser = await User.findOne({
    username: username,
    password: password,
  })
  if (existingUser) return res.status(400).json({ message: 'username 중복임' })

  const hashedPassword = await bcrypt.hash(password, 10)
  await User.create({
    username: username,
    password: hashedPassword,
  })

  res.status(201).json({ message: '회원가입 성공' })
})

export default router