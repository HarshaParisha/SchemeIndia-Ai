import { Router } from 'express'
import { z } from 'zod'

import { requireAuth, type AuthedRequest } from '../middleware/auth.js'
import { ConversationModel } from '../models/Conversation.js'
import { groqChat } from '../services/groqService.js'
import { demoStore, isDemoMode } from '../services/demoStore.js'

export const dishaRouter = Router()

const chatSchema = z.object({
  message: z.string().min(1).max(2000),
})

dishaRouter.post('/chat', requireAuth, async (req: AuthedRequest, res, next) => {
  try {
    const { message } = chatSchema.parse(req.body)
    const clerkId = req.auth!.clerkId

    if (isDemoMode()) {
      const convo = await demoStore.getConversation(clerkId)
      await demoStore.appendMessage(clerkId, 'user', message)
      const assistant = await groqChat({
        messages: convo.messages.map((m) => ({ role: m.role, content: m.content })),
      })
      await demoStore.appendMessage(clerkId, 'assistant', assistant.content)
      return res.json({ ok: true, data: { reply: assistant.content } })
    }

    const convo =
      (await ConversationModel.findOne({ userId: clerkId })) ||
      (await ConversationModel.create({ userId: clerkId, messages: [] }))

    convo.messages.push({ role: 'user', content: message, timestamp: new Date() })

    const assistant = await groqChat({
      messages: convo.messages
        .filter((m: { role: string }) => m.role === 'user' || m.role === 'assistant')
        .map((m: { role: string; content: string }) => ({
          role: m.role as 'user' | 'assistant',
          content: m.content,
        })),
    })

    convo.messages.push({ role: 'assistant', content: assistant.content, timestamp: new Date() })
    await convo.save()

    res.json({ ok: true, data: { reply: assistant.content } })
  } catch (err) {
    next(err)
  }
})

dishaRouter.get('/history', requireAuth, async (req: AuthedRequest, res, next) => {
  try {
    const clerkId = req.auth!.clerkId
    if (isDemoMode()) {
      const convo = await demoStore.getConversation(clerkId)
      return res.json({ ok: true, data: { messages: convo.messages || [] } })
    }
    const convo = await ConversationModel.findOne({ userId: clerkId })
    res.json({ ok: true, data: { messages: convo?.messages || [] } })
  } catch (err) {
    next(err)
  }
})

dishaRouter.delete('/history', requireAuth, async (req: AuthedRequest, res, next) => {
  try {
    const clerkId = req.auth!.clerkId
    if (isDemoMode()) {
      await demoStore.clearConversation(clerkId)
      return res.json({ ok: true })
    }
    await ConversationModel.deleteOne({ userId: clerkId })
    res.json({ ok: true })
  } catch (err) {
    next(err)
  }
})
