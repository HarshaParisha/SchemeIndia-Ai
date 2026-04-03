import { Router } from 'express'

export const authRouter = Router()

authRouter.get('/me', (req, res) => {
  const authHeader = req.header('authorization') || ''
  const token = authHeader.startsWith('Bearer ') ? authHeader.slice('Bearer '.length) : ''
  res.json({ ok: true, data: { tokenPresent: Boolean(token) } })
})

