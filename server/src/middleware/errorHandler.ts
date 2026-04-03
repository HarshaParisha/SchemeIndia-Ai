import type { NextFunction, Request, Response } from 'express'

export function errorHandler(err: unknown, _req: Request, res: Response, _next: NextFunction) {
  const message = err instanceof Error ? err.message : 'Something went wrong'
  const status = 500
  res.status(status).json({ ok: false, error: { message } })
}

