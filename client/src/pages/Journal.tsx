import { useEffect, useMemo, useState } from 'react'
import toast from 'react-hot-toast'

import { mockApi } from '@/lib/mockApi'
import { formatDateShort } from '@/lib/utils'
import Skeleton from '@/components/shared/Skeleton'

export default function Journal() {
  const [loading, setLoading] = useState(true)
  const [entries, setEntries] = useState<any[]>([])
  const [title, setTitle] = useState('')
  const [body, setBody] = useState('')

  useEffect(() => {
    let mounted = true
    ;(async () => {
      try {
        const res = await mockApi.listJournalEntries()
        if (!mounted) return
        setEntries(res)
      } catch {
        setEntries([])
      } finally {
        if (mounted) setLoading(false)
      }
    })()
    return () => {
      mounted = false
    }
  }, [])

  const wordCount = useMemo(() => body.trim().split(/\s+/).filter(Boolean).length, [body])

  const save = async () => {
    if (!title.trim() || !body.trim()) {
      toast.error('Add a title and a few lines first.')
      return
    }
    const optimistic = { id: `tmp-${Date.now()}`, title, body, wordCount, createdAt: new Date().toISOString() }
    setEntries((e) => [optimistic, ...e])
    setTitle('')
    setBody('')
    try {
      await mockApi.createJournalEntry({ title: optimistic.title, body: optimistic.body })
      toast.success('Saved')
    } catch {
      toast.error('Could not save. Please try again.')
    }
  }

  const del = async (id: string) => {
    setEntries((e) => e.filter((x) => x.id !== id))
    try {
      await mockApi.deleteJournalEntry(id)
      toast.success('Deleted')
    } catch {
      toast.error('Could not delete. Please try again.')
    }
  }

  return (
    <div className="space-y-6">
      <div className="rounded-card border border-brand-border bg-white/75 p-6 shadow-ambient">
        <div className="font-display text-[28px] font-medium tracking-tight">Journal</div>
        <div className="mt-2 text-sm text-brand-muted">A private note to yourself. Simple and safe.</div>
      </div>

      <div className="rounded-card border border-brand-border bg-white/75 p-6 shadow-subtle">
        <div className="font-display text-[18px] font-medium tracking-tight">New entry</div>
        <div className="mt-4 space-y-3">
          <input
            className="h-11 w-full rounded-control border border-brand-border bg-white/70 px-3 text-sm shadow-subtle"
            placeholder="Title"
            value={title}
            onChange={(e) => setTitle(e.target.value)}
            maxLength={80}
          />
          <textarea
            className="w-full rounded-control border border-brand-border bg-white/70 p-3 text-sm shadow-subtle"
            rows={6}
            placeholder="Write here…"
            value={body}
            onChange={(e) => setBody(e.target.value)}
            maxLength={6000}
          />
          <div className="flex items-center justify-between text-xs text-brand-muted">
            <div>{wordCount} words</div>
            <div>{body.length}/6000</div>
          </div>
          <button
            className="h-11 rounded-control bg-brand-primary px-5 text-sm font-medium text-white shadow-ambient hover:opacity-95"
            type="button"
            onClick={save}
          >
            Save entry
          </button>
        </div>
      </div>

      <div className="rounded-card border border-brand-border bg-white/75 p-6 shadow-subtle">
        <div className="font-display text-[18px] font-medium tracking-tight">Past entries</div>
        {loading ? (
          <div className="mt-4 space-y-2">
            <Skeleton className="h-16" />
            <Skeleton className="h-16" />
          </div>
        ) : (
          <div className="mt-4 space-y-2">
            {entries.map((e) => (
              <div key={e.id} className="rounded-card border border-brand-border bg-brand-bg/60 p-4">
                <div className="flex items-start justify-between gap-3">
                  <div>
                    <div className="text-sm font-medium">{e.title}</div>
                    <div className="mt-1 text-xs text-brand-muted">{formatDateShort(e.createdAt)}</div>
                  </div>
                  <button
                    className="h-9 rounded-control border border-brand-border bg-white/75 px-3 text-xs hover:bg-white"
                    type="button"
                    onClick={() => del(e.id)}
                  >
                    Delete
                  </button>
                </div>
                <div className="mt-3 text-sm text-brand-muted line-clamp-4">{e.body}</div>
              </div>
            ))}
            {entries.length === 0 ? (
              <div className="mt-3 text-sm text-brand-muted">No entries yet. Your first note can be very small.</div>
            ) : null}
          </div>
        )}
      </div>
    </div>
  )
}
