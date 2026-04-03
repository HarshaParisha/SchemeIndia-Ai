import type { NextFunction, Request, Response } from 'express'

export function requestLogger(req: Request, res: Response, next: NextFunction) {
  const start = Date.now()
  res.on('finish', () => {
    const ms = Date.now() - start
    if (process.env.NODE_ENV !== 'production') {
      console.log(`${req.method} ${req.originalUrl} ${res.statusCode} ${ms}ms`)
    }
  })
  next()
}

