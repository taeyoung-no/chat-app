import { Request, Response, NextFunction } from 'express'
import CustomError from '../utils/CustomError'

const isAuthenticated = (req: Request, res: Response, next: NextFunction) => {
  if (!req.session.userId) return next(new CustomError('로그인부터 하세요', 401))
  next()
}

export default isAuthenticated
