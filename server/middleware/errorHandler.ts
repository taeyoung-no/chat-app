import { NextFunction, Request, Response } from 'express'
import AppError from '../utils/AppError.js'

const errorHandler = (err: any, _req: Request, res: Response, _next: NextFunction) => {
  if (err instanceof AppError) return res.status(err.status).json({ success: false, message: err.message })
  console.error('[Error]', err)
  res.status(500).json({ success: false, message: '서버 문제인 듯' })
}

export default errorHandler
