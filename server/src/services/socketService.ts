import type { Server as HttpServer } from 'http'

import { Server } from 'socket.io'

import { MessageModel } from '../models/Message.js'
import { isDemoMode } from './demoStore.js'

function randomAlias() {
  const adjectives = ['Quiet', 'Kind', 'Brave', 'Bright', 'Gentle', 'Curious', 'Calm', 'Hopeful']
  const nouns = ['River', 'Sky', 'Forest', 'Lamp', 'Mountain', 'Lotus', 'Breeze', 'Rain']
  const a = adjectives[Math.floor(Math.random() * adjectives.length)]
  const n = nouns[Math.floor(Math.random() * nouns.length)]
  const num = Math.floor(10 + Math.random() * 90)
  return `${a}${n}${num}`
}

function isHarmful(content: string) {
  const patterns = [/kill yourself/i, /suicide/i, /go die/i, /harm yourself/i]
  return patterns.some((p) => p.test(content))
}

export function initSocket(server: HttpServer) {
  const io = new Server(server, {
    cors: {
      origin: process.env.CLIENT_URL || 'http://localhost:5173',
      credentials: true,
    },
  })

  const roomCounts = new Map<string, number>()
  const demoMessages = new Map<string, { id: string; roomId: string; alias: string; content: string; reactions: Record<string, number>; timestamp: Date; reported: boolean }>()

  io.on('connection', (socket) => {
    let currentRoomId: string | null = null
    let alias: string | null = null

    socket.on('join-room', async (roomId: string) => {
      currentRoomId = roomId
      alias = randomAlias()
      socket.join(roomId)
      socket.emit('alias', alias)

      const next = (roomCounts.get(roomId) || 0) + 1
      roomCounts.set(roomId, next)
      io.to(roomId).emit('user-count', next)
    })

    socket.on('leave-room', () => {
      if (!currentRoomId) return
      socket.leave(currentRoomId)
      const next = Math.max(0, (roomCounts.get(currentRoomId) || 1) - 1)
      roomCounts.set(currentRoomId, next)
      io.to(currentRoomId).emit('user-count', next)
      currentRoomId = null
      alias = null
    })

    socket.on('typing', (isTyping: boolean) => {
      if (!currentRoomId || !alias) return
      socket.to(currentRoomId).emit('typing', { alias, isTyping })
    })

    socket.on('send-message', async (payload: { content: string }) => {
      if (!currentRoomId || !alias) return
      const content = (payload.content || '').trim()
      if (!content) return

      if (isHarmful(content)) {
        socket.emit('moderation', {
          message:
            "I can't allow harmful messages here. If you're going through something serious, iCall (9152987821) and Vandrevala Foundation (1860-2662-345) are free and available 24/7.",
        })
        return
      }

      if (isDemoMode()) {
        const msg = {
          id: randomAlias() + '-' + Date.now().toString(36),
          roomId: currentRoomId,
          alias,
          content,
          reactions: {},
          timestamp: new Date(),
          reported: false,
        }
        demoMessages.set(msg.id, msg)
        io.to(currentRoomId).emit('new-message', msg)
        return
      }

      const msg = await MessageModel.create({ roomId: currentRoomId, alias, content, reactions: {}, reported: false })
      io.to(currentRoomId).emit('new-message', {
        id: String(msg._id),
        roomId: currentRoomId,
        alias,
        content,
        reactions: msg.reactions,
        timestamp: msg.timestamp,
        reported: msg.reported,
      })
    })

    socket.on('react', async (payload: { messageId: string; reaction: string }) => {
      if (!currentRoomId) return
      const { messageId, reaction } = payload
      const allowed = ['heart', 'hug', 'thumbs']
      if (!allowed.includes(reaction)) return

      if (isDemoMode()) {
        const msg = demoMessages.get(messageId)
        if (!msg) return
        msg.reactions[reaction] = (msg.reactions[reaction] || 0) + 1
        demoMessages.set(messageId, msg)
        io.to(currentRoomId).emit('react', { messageId, reactions: msg.reactions })
        return
      }

      const msg = await MessageModel.findById(messageId)
      if (!msg) return
      const reactions = (msg.reactions || {}) as Record<string, number>
      reactions[reaction] = (reactions[reaction] || 0) + 1
      msg.reactions = reactions
      await msg.save()
      io.to(currentRoomId).emit('react', { messageId, reactions })
    })

    socket.on('report-message', async (payload: { messageId: string }) => {
      if (isDemoMode()) {
        const msg = demoMessages.get(payload.messageId)
        if (!msg) return
        msg.reported = true
        demoMessages.set(payload.messageId, msg)
        if (currentRoomId) io.to(currentRoomId).emit('reported', { messageId: payload.messageId })
        return
      }
      const msg = await MessageModel.findById(payload.messageId)
      if (!msg) return
      msg.reported = true
      await msg.save()
      if (currentRoomId) io.to(currentRoomId).emit('reported', { messageId: payload.messageId })
    })

    socket.on('disconnect', () => {
      if (!currentRoomId) return
      const next = Math.max(0, (roomCounts.get(currentRoomId) || 1) - 1)
      roomCounts.set(currentRoomId, next)
      io.to(currentRoomId).emit('user-count', next)
      currentRoomId = null
      alias = null
    })
  })

  return io
}
