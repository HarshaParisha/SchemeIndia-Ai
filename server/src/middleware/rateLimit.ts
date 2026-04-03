import type { RequestHandler } from 'express'

export type RateLimitOptions = {
  windowMs: number
  max: number
}

type Bucket = {
  count: number
  resetAt: number
}

export function rateLimit(options: RateLimitOptions): RequestHandler {
  const store = new Map<string, Bucket>()
  const windowMs = Math.max(1000, options.windowMs)
  const max = Math.max(1, options.max)

  return (req, res, next) => {
    const ip = (req.headers['x-forwarded-for'] as string) || req.ip || 'unknown'
    const key = `${ip}:${req.method}:${req.path}`
    const now = Date.now()

    const existing = store.get(key)
    if (!existing || existing.resetAt <= now) {
      store.set(key, { count: 1, resetAt: now + windowMs })
      res.setHeader('X-RateLimit-Limit', String(max))
      res.setHeader('X-RateLimit-Remaining', String(max - 1))
      res.setHeader('X-RateLimit-Reset', String(Math.ceil((now + windowMs) / 1000)))
      return next()
    }

    existing.count += 1
    store.set(key, existing)
    const remaining = Math.max(0, max - existing.count)
    res.setHeader('X-RateLimit-Limit', String(max))
    res.setHeader('X-RateLimit-Remaining', String(remaining))
    res.setHeader('X-RateLimit-Reset', String(Math.ceil(existing.resetAt / 1000)))

    if (existing.count > max) {
      return res.status(429).json({
        ok: false,
        error: { message: 'Too many requests. Please try again shortly.' },
      })
    }

    next()
  }
}

