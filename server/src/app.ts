import compression from 'compression'
import cors from 'cors'
import dotenv from 'dotenv'
import express from 'express'
import helmet from 'helmet'

import { clerkMiddleware } from '@clerk/express'

import { errorHandler } from './middleware/errorHandler.js'
import { rateLimit } from './middleware/rateLimit.js'
import { requestLogger } from './middleware/requestLogger.js'
import { authRouter } from './routes/auth.js'
import { dishaRouter } from './routes/disha.js'
import { documentsRouter } from './routes/documents.js'
import { roomsRouter } from './routes/rooms.js'
import { savedRouter } from './routes/saved.js'
import { schemesRouter } from './routes/schemes.js'
import { searchRouter } from './routes/search.js'
import { statsRouter } from './routes/stats.js'
import { userRouter } from './routes/user.js'
import { wellnessRouter } from './routes/wellness.js'

dotenv.config()

export function createApp() {
  const app = express()

  app.use(helmet())
  app.use(compression())
  app.use(express.json({ limit: '1mb' }))
  app.use(
    cors({
      origin: process.env.CLIENT_URL || 'http://localhost:5173',
      credentials: true,
    }),
  )

  if (process.env.CLERK_SECRET_KEY) {
    app.use(clerkMiddleware())
  }

  app.use(
    '/api',
    rateLimit({
      windowMs: 60_000,
      max: 120,
    }),
  )

  app.use(requestLogger)

  app.get('/api/health', (_req, res) => {
    res.json({ ok: true })
  })

  app.use('/api/auth', authRouter)
  app.use('/api/disha', dishaRouter)
  app.use('/api/schemes', schemesRouter)
  app.use('/api/search', searchRouter)
  app.use('/api/saved', savedRouter)
  app.use('/api/stats', statsRouter)
  app.use('/api/wellness', wellnessRouter)
  app.use('/api/rooms', roomsRouter)
  app.use('/api/documents', documentsRouter)
  app.use('/api/user', userRouter)

  app.use(errorHandler)

  return app
}
