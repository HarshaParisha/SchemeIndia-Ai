import { useEffect, useMemo, useRef, useState } from 'react'
import toast from 'react-hot-toast'
import { SendHorizonal } from 'lucide-react'

import { mockApi } from '@/lib/mockApi'
import Skeleton from '@/components/shared/Skeleton'

type Msg = { role: 'user' | 'assistant'; content: string; timestamp: string }

const intro =
  "Hi, I'm Disha. I'm here to guide you — whether it's college admissions, scholarship applications, career decisions, or anything else you're figuring out. Ask me anything. There are no wrong questions here."

const suggestionsByDefault = [
  'I’m a first year student from a small town. What should I do first?',
  'How do I find scholarships for my course?',
  'I feel stuck and overwhelmed. What can I do today?',
]

export default function Disha() {
  const [messages, setMessages] = useState<Msg[]>([])
  const [loading, setLoading] = useState(true)
  const [sending, setSending] = useState(false)
  const [text, setText] = useState('')
  const bottomRef = useRef<HTMLDivElement | null>(null)

  const suggestions = useMemo(() => suggestionsByDefault, [])

  useEffect(() => {
    let mounted = true
    ;(async () => {
      try {
        const serverMsgs = (await mockApi.getDishaHistory()) as Array<{ role: string; content: string; timestamp: string }>
        if (!mounted) return
        const normalized = serverMsgs
          .filter((m) => m.role === 'user' || m.role === 'assistant')
          .map((m) => ({ role: m.role as any, content: m.content, timestamp: m.timestamp }))
        setMessages(normalized.length ? normalized : [{ role: 'assistant', content: intro, timestamp: new Date().toISOString() }])
      } catch {
        setMessages([{ role: 'assistant', content: intro, timestamp: new Date().toISOString() }])
      } finally {
        if (mounted) setLoading(false)
      }
    })()
    return () => {
      mounted = false
    }
  }, [])

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: 'smooth' })
  }, [messages, sending])

  const send = async (content: string) => {
    const msg = content.trim()
    if (!msg) return

    setSending(true)
    setText('')
    const userMsg: Msg = { role: 'user', content: msg, timestamp: new Date().toISOString() }
    const placeholderId = `tmp-${Date.now()}`
    setMessages((m) => [...m, userMsg, { role: 'assistant', content: '', timestamp: placeholderId }])
    try {
      const reply = await mockApi.dishaChat(msg)

      const maxMs = 900
      const minStep = 18
      const steps = Math.max(6, Math.min(36, Math.ceil(reply.length / 30)))
      const stepSize = Math.max(minStep, Math.ceil(reply.length / steps))
      const intervalMs = Math.max(18, Math.floor(maxMs / steps))

      let i = 0
      const timer = window.setInterval(() => {
        i += stepSize
        const chunk = reply.slice(0, i)
        setMessages((prev) => {
          const next = prev.slice()
          const idx = next.findIndex((x) => x.timestamp === placeholderId && x.role === 'assistant')
          if (idx === -1) return prev
          next[idx] = { ...next[idx], content: chunk }
          return next
        })
        if (i >= reply.length) {
          window.clearInterval(timer)
          setMessages((prev) => {
            const next = prev.slice()
            const idx = next.findIndex((x) => x.timestamp === placeholderId && x.role === 'assistant')
            if (idx === -1) return prev
            next[idx] = { ...next[idx], content: reply, timestamp: new Date().toISOString() }
            return next
          })
        }
      }, intervalMs)
    } catch {
      toast.error('Disha is taking a moment. Please try again.')
      setMessages((prev) => prev.filter((m) => m.timestamp !== placeholderId))
    } finally {
      setSending(false)
    }
  }

  return (
    <div className="rounded-card border border-brand-border bg-white/75 shadow-ambient">
      <div className="flex items-center justify-between border-b border-brand-border px-4 py-3">
        <div className="flex items-center gap-3">
          <div className="flex h-9 w-9 items-center justify-center rounded-full bg-brand-accent text-white shadow-subtle">D</div>
          <div>
            <div className="font-display text-sm font-medium tracking-tight">Disha</div>
            <div className="text-xs text-brand-muted">Your calm guide</div>
          </div>
        </div>
        <button
          className="h-9 rounded-control border border-brand-border bg-white/80 px-3 text-xs hover:bg-white"
          onClick={async () => {
            try {
              await mockApi.clearDishaHistory()
              const seed = await mockApi.getDishaHistory()
              setMessages(seed as any)
              toast.success('Chat cleared.')
            } catch {
              toast.error('Could not clear chat. Please try again.')
            }
          }}
        >
          Clear
        </button>
      </div>

      <div className="h-[calc(100vh-240px)] min-h-[420px] overflow-y-auto px-4 py-4">
        {loading ? (
          <div className="space-y-3">
            <Skeleton className="h-16 w-3/4" />
            <Skeleton className="h-16 w-2/3 ml-auto" />
            <Skeleton className="h-16 w-3/4" />
          </div>
        ) : (
          <div className="space-y-3">
            {messages.map((m, idx) => (
              <div key={idx} className={m.role === 'user' ? 'flex justify-end' : 'flex justify-start'}>
                <div
                  className={
                    'max-w-[85%] rounded-card px-4 py-3 text-sm leading-relaxed ' +
                    (m.role === 'user'
                      ? 'bg-brand-primary text-white shadow-subtle'
                      : 'border border-brand-border bg-white/70 text-brand-dark')
                  }
                >
                  {m.content}
                </div>
              </div>
            ))}
            {sending ? (
              <div className="flex justify-start">
                <div className="rounded-card border border-brand-border bg-white/70 px-4 py-3 text-sm">
                  <span className="inline-flex gap-1">
                    <span className="h-2 w-2 animate-bounce rounded-full bg-brand-border" />
                    <span className="h-2 w-2 animate-bounce rounded-full bg-brand-border [animation-delay:120ms]" />
                    <span className="h-2 w-2 animate-bounce rounded-full bg-brand-border [animation-delay:240ms]" />
                  </span>
                </div>
              </div>
            ) : null}
            <div ref={bottomRef} />
          </div>
        )}
      </div>

      <div className="border-t border-brand-border px-4 py-3">
        <div className="mb-2 flex flex-wrap gap-2">
          {suggestions.map((s) => (
            <button
              key={s}
              className="h-9 rounded-full border border-brand-border bg-brand-bg/60 px-3 text-xs text-brand-dark hover:bg-white"
              onClick={() => send(s)}
              type="button"
            >
              {s}
            </button>
          ))}
        </div>
        <form
          className="flex items-center gap-2"
          onSubmit={(e) => {
            e.preventDefault()
            if (!sending) send(text)
          }}
        >
          <input
            className="h-11 flex-1 rounded-control border border-brand-border bg-white/70 px-3 text-sm shadow-subtle"
            placeholder="Ask Disha…"
            value={text}
            onChange={(e) => setText(e.target.value)}
          />
          <button
            className="inline-flex h-11 w-11 items-center justify-center rounded-control bg-brand-primary text-white shadow-ambient hover:opacity-95 disabled:opacity-50"
            disabled={sending || !text.trim()}
            type="submit"
            aria-label="Send"
          >
            <SendHorizonal className="h-5 w-5" />
          </button>
        </form>
      </div>
    </div>
  )
}
