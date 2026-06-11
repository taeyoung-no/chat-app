import { Request, Response, NextFunction } from 'express'

const isAuthenticated = (req: Request, res: Response, next: NextFunction) => {
  if (!req.session.userId) return res.status(401).json({ message: '로그인부터 하세요' })
  next()
}

export default isAuthenticated
