import { useEffect, useMemo, useState } from 'react'
import toast from 'react-hot-toast'
import { Heart, HandHeart, ThumbsUp } from 'lucide-react'

import { ROOMS, type Room } from '@/data/rooms'
import { readJSON, uid, writeJSON } from '@/lib/storage'
import Skeleton from '@/components/shared/Skeleton'
import { CRISIS_SUPPORT } from '@/lib/constants'

type ChatMsg = { id: string; alias: string; content: string; reactions: Record<string, number>; timestamp: string; reported: boolean }

const reactionIcons: Record<string, React.ReactNode> = {
  heart: <Heart className="h-4 w-4" />,
  hug: <HandHeart className="h-4 w-4" />,
  thumbs: <ThumbsUp className="h-4 w-4" />,
}

export default function PeerRooms() {
  const [rooms, setRooms] = useState<Room[]>([])
  const [loading, setLoading] = useState(true)
  const [activeRoom, setActiveRoom] = useState<Room | null>(null)
  const [alias, setAlias] = useState<string>('')
  const [online, setOnline] = useState(0)
  const [messages, setMessages] = useState<ChatMsg[]>([])
  const [text, setText] = useState('')
  const [typing, setTyping] = useState<string | null>(null)

  useEffect(() => {
    setRooms(ROOMS)
    setLoading(false)
  }, [])

  useEffect(() => {
    const adjectives = ['Quiet', 'Kind', 'Brave', 'Bright', 'Gentle', 'Curious', 'Calm', 'Hopeful']
    const nouns = ['River', 'Sky', 'Forest', 'Lamp', 'Mountain', 'Lotus', 'Breeze', 'Rain']
    const a = adjectives[Math.floor(Math.random() * adjectives.length)]
    const n = nouns[Math.floor(Math.random() * nouns.length)]
    const num = Math.floor(10 + Math.random() * 90)
    setAlias(`${a}${n}${num}`)
  }, [])

  useEffect(() => {
    if (!activeRoom) return
    const channel = new BroadcastChannel(`bharatcare_room_${activeRoom.id}`)
    const presenceKey = `bc_room_presence_${activeRoom.id}`
    const messagesKey = `bc_room_messages_${activeRoom.id}`
    const now = Date.now()
    const cutoff = now - 24 * 60 * 60 * 1000

    const initial = readJSON<ChatMsg[]>(messagesKey, []).filter((m) => new Date(m.timestamp).getTime() >= cutoff)
    setMessages(initial)
    setTyping(null)

    const bumpPresence = () => {
      const pres = readJSON<Record<string, number>>(presenceKey, {})
      pres[alias] = Date.now()
      writeJSON(presenceKey, pres)
      const alive = Object.values(pres).filter((ts) => Date.now() - ts < 12_000).length
      setOnline(alive)
      channel.postMessage({ type: 'presence', alias })
    }

    const interval = window.setInterval(bumpPresence, 4000)
    bumpPresence()

    channel.onmessage = (ev) => {
      const msg = ev.data
      if (!msg || typeof msg !== 'object') return
      if (msg.type === 'presence') {
        bumpPresence()
      }
      if (msg.type === 'typing') {
        if (msg.alias !== alias) setTyping(msg.isTyping ? msg.alias : null)
      }
      if (msg.type === 'new-message') {
        setMessages((prev) => {
          if (prev.some((m) => m.id === msg.message.id)) return prev
          const next = [...prev, msg.message]
          writeJSON(messagesKey, next)
          return next
        })
      }
      if (msg.type === 'react') {
        setMessages((prev) => {
          const next = prev.map((m) => (m.id === msg.messageId ? { ...m, reactions: msg.reactions } : m))
          writeJSON(messagesKey, next)
          return next
        })
      }
      if (msg.type === 'reported') {
        setMessages((prev) => {
          const next = prev.map((m) => (m.id === msg.messageId ? { ...m, reported: true } : m))
          writeJSON(messagesKey, next)
          return next
        })
      }
      if (msg.type === 'moderation') {
        toast(msg.message)
      }
    }

    return () => {
      window.clearInterval(interval)
      channel.close()
      setOnline(0)
    }
  }, [activeRoom, alias])

  const categories = useMemo(() => {
    const m = new Map<string, Room[]>()
    rooms.forEach((r) => {
      const list = m.get(r.category) || []
      list.push(r)
      m.set(r.category, list)
    })
    return Array.from(m.entries())
  }, [rooms])

  const send = () => {
    if (!activeRoom) return
    const content = text.trim()
    if (!content) return

    const harmful = [/kill yourself/i, /suicide/i, /go die/i, /harm yourself/i].some((p) => p.test(content))
    const channel = new BroadcastChannel(`bharatcare_room_${activeRoom.id}`)
    if (harmful) {
      channel.postMessage({
        type: 'moderation',
        message:
          "I can't allow harmful messages here. If you're going through something serious, iCall (9152987821) and Vandrevala Foundation (1860-2662-345) are free and available 24/7.",
      })
      channel.close()
      return
    }

    const message: ChatMsg = {
      id: uid('msg'),
      alias,
      content,
      reactions: {},
      timestamp: new Date().toISOString(),
      reported: false,
    }
    channel.postMessage({ type: 'new-message', message })
    channel.close()
    setMessages((prev) => [...prev, message])
    setText('')
  }

  const react = (messageId: string, reaction: string) => {
    if (!activeRoom) return
    const allowed = ['heart', 'hug', 'thumbs']
    if (!allowed.includes(reaction)) return
    const channel = new BroadcastChannel(`bharatcare_room_${activeRoom.id}`)
    const next = messages.map((m) => {
      if (m.id !== messageId) return m
      const reactions = { ...(m.reactions || {}) }
      reactions[reaction] = (reactions[reaction] || 0) + 1
      channel.postMessage({ type: 'react', messageId, reactions })
      return { ...m, reactions }
    })
    channel.close()
    setMessages(next)
  }

  const report = (messageId: string) => {
    if (!activeRoom) return
    const channel = new BroadcastChannel(`bharatcare_room_${activeRoom.id}`)
    channel.postMessage({ type: 'reported', messageId })
    channel.close()
    setMessages((prev) => prev.map((m) => (m.id === messageId ? { ...m, reported: true } : m)))
  }

  return (
    <div className="grid gap-4 lg:grid-cols-3">
      <div className="rounded-card border border-brand-border bg-white/75 p-5 shadow-ambient lg:col-span-1">
        <div className="font-display text-[18px] font-medium tracking-tight">Peer support rooms</div>
        <div className="mt-2 text-sm text-brand-muted">Completely anonymous. Messages auto-expire after 24 hours.</div>

        {loading ? (
          <div className="mt-4 space-y-2">
            <Skeleton className="h-12" />
            <Skeleton className="h-12" />
            <Skeleton className="h-12" />
          </div>
        ) : (
          <div className="mt-4 space-y-4">
            {categories.map(([cat, list]) => (
              <div key={cat}>
                <div className="text-xs font-medium text-brand-dark/70">{cat}</div>
                <div className="mt-2 space-y-2">
                  {list.map((r) => (
                    <button
                      key={r.id}
                      type="button"
                      onClick={() => setActiveRoom(r)}
                      className={
                        'w-full rounded-control border px-3 py-3 text-left shadow-subtle ' +
                        (activeRoom?.id === r.id
                          ? 'border-brand-primary bg-white/70'
                          : 'border-brand-border bg-brand-bg/60 hover:bg-white')
                      }
                    >
                      <div className="text-sm font-medium">{r.name}</div>
                      <div className="mt-1 text-xs text-brand-muted">{r.description || 'A safe space to talk.'}</div>
                    </button>
                  ))}
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      <div className="rounded-card border border-brand-border bg-white/75 shadow-ambient lg:col-span-2">
        <div className="border-b border-brand-border px-4 py-3">
          <div className="flex items-center justify-between gap-3">
            <div>
              <div className="text-sm font-medium">{activeRoom ? activeRoom.name : 'Choose a room'}</div>
              <div className="mt-1 text-xs text-brand-dark/70">
                {activeRoom ? `You are ${alias || '…'} • ${online} online` : 'You stay anonymous here.'}
              </div>
            </div>
            <div className="text-xs text-brand-dark/70">{CRISIS_SUPPORT}</div>
          </div>
        </div>

        <div className="h-[calc(100vh-260px)] min-h-[420px] overflow-y-auto px-4 py-4">
          {activeRoom ? (
            <div className="space-y-3">
              {messages.map((m) => (
                <div key={m.id} className="rounded-card border border-brand-border bg-brand-bg/60 p-3">
                  <div className="flex items-start justify-between gap-2">
                    <div>
                      <div className="text-xs font-medium text-brand-dark/70">{m.alias}</div>
                      <div className="mt-1 text-sm">{m.reported ? '[Reported]' : m.content}</div>
                    </div>
                    <button
                      type="button"
                      className="h-8 rounded-control border border-brand-border bg-white/80 px-2 text-xs hover:bg-white"
                      onClick={() => report(m.id)}
                    >
                      Report
                    </button>
                  </div>
                  <div className="mt-2 flex flex-wrap items-center gap-2">
                    {['heart', 'hug', 'thumbs'].map((r) => (
                      <button
                        key={r}
                        type="button"
                        className="inline-flex h-8 items-center gap-1 rounded-full border border-brand-border bg-white/80 px-3 text-xs hover:bg-white"
                        onClick={() => react(m.id, r)}
                      >
                        <span className="text-brand-primary">{reactionIcons[r]}</span>
                        <span>{m.reactions?.[r] || 0}</span>
                      </button>
                    ))}
                  </div>
                </div>
              ))}
              {typing ? <div className="text-xs text-brand-dark/70">{typing} is typing…</div> : null}
              {messages.length === 0 ? (
                <div className="rounded-card border border-brand-border bg-brand-bg p-4 text-sm text-brand-dark/80">
                  No messages yet. You can start with something small, like “I’m feeling stressed today.”
                </div>
              ) : null}
            </div>
          ) : (
            <div className="rounded-card border border-brand-border bg-brand-bg p-4 text-sm text-brand-dark/80">
              Choose a room on the left to join.
            </div>
          )}
        </div>

        <div className="border-t border-brand-border px-4 py-3">
          <div className="flex items-center gap-2">
            <input
              className="h-11 flex-1 rounded-control border border-brand-border bg-white/70 px-3 text-sm shadow-subtle"
              placeholder={activeRoom ? 'Write a message…' : 'Choose a room first'}
              disabled={!activeRoom}
              value={text}
              onChange={(e) => {
                setText(e.target.value)
                if (!activeRoom) return
                const channel = new BroadcastChannel(`bharatcare_room_${activeRoom.id}`)
                channel.postMessage({ type: 'typing', alias, isTyping: true })
                window.setTimeout(() => {
                  const ch = new BroadcastChannel(`bharatcare_room_${activeRoom.id}`)
                  ch.postMessage({ type: 'typing', alias, isTyping: false })
                  ch.close()
                }, 600)
                channel.close()
              }}
              onKeyDown={(e) => {
                if (e.key === 'Enter') send()
              }}
            />
            <button
              className="h-11 rounded-control bg-brand-primary px-4 text-sm font-medium text-white shadow-ambient hover:opacity-95 disabled:opacity-50"
              disabled={!activeRoom || !text.trim()}
              type="button"
              onClick={send}
            >
              Send
            </button>
          </div>
        </div>
      </div>
    </div>
  )
}
