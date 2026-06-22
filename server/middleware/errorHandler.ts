import { NextFunction, Request, Response } from 'express'

const errorHandler = (err: any, req: Request, res: Response, _: NextFunction) => {
  res.status(err.status || 500).json({ success: false, message: err.message || '서버 문제인 듯' })
}

export default errorHandler
