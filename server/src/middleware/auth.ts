import type { NextFunction, Request, Response } from 'express'

import { getAuth, requireAuth as clerkRequireAuth } from '@clerk/express'

export type AuthedRequest = Request & { auth?: { clerkId: string } }

export function requireAuth(req: AuthedRequest, res: Response, next: NextFunction) {
  if (!process.env.CLERK_SECRET_KEY) {
    req.auth = { clerkId: 'demo-user' }
    return next()
  }
  return clerkRequireAuth()(req, res, (err?: unknown) => {
    if (err) return next(err)
    const auth = getAuth(req)
    const clerkId = auth.userId
    if (!clerkId) {
      return res.status(401).json({ ok: false, error: { message: 'Please sign in to continue.' } })
    }
    req.auth = { clerkId }
    next()
  })
}
