import { Request, Response, NextFunction } from 'express'
import AppError from '../utils/AppError.js'

const isAuthenticated = (req: Request, res: Response, next: NextFunction) => {
  if (!req.session.userId) return next(new AppError('로그인부터 하세요', 401))
  next()
}

export default isAuthenticated
