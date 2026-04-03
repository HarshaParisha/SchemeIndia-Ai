import { useEffect, useMemo, useState } from 'react'
import toast from 'react-hot-toast'
import { Link } from 'react-router-dom'
import { LineChart, Line, ResponsiveContainer, XAxis, YAxis, Tooltip } from 'recharts'

import { mockApi } from '@/lib/mockApi'
import { CRISIS_SUPPORT, ROUTES } from '@/lib/constants'
import Skeleton from '@/components/shared/Skeleton'

const moods = [
  { v: 1, label: 'Very low' },
  { v: 2, label: 'Low' },
  { v: 3, label: 'Okay' },
  { v: 4, label: 'Good' },
  { v: 5, label: 'Great' },
]

export default function Wellness() {
  const [loading, setLoading] = useState(true)
  const [entries, setEntries] = useState<any[]>([])
  const [selectedMood, setSelectedMood] = useState<number | null>(null)
  const [note, setNote] = useState('')

  useEffect(() => {
    let mounted = true
    ;(async () => {
      try {
        const res = await mockApi.listMoodEntries(30)
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

  const todayKey = new Date().toDateString()
  const doneToday = useMemo(() => entries.some((e) => new Date(e.timestamp).toDateString() === todayKey), [entries, todayKey])

  const submit = async () => {
    if (!selectedMood) {
      toast.error('Pick a mood first.')
      return
    }
    const optimistic = { _id: `tmp-${Date.now()}`, mood: selectedMood, note, timestamp: new Date().toISOString() }
    setEntries((e) => [...e, optimistic])
    setSelectedMood(null)
    setNote('')
    try {
      await mockApi.addMoodEntry({ mood: optimistic.mood, note: optimistic.note })
      toast.success('Saved')
    } catch {
      toast.error('Could not save. Please try again.')
    }
  }

  const chartData = useMemo(
    () =>
      entries
        .slice(-14)
        .map((e) => ({
          day: new Date(e.timestamp).toLocaleDateString(undefined, { month: 'short', day: 'numeric' }),
          mood: e.mood,
        })),
    [entries],
  )

  return (
    <div className="space-y-6">
      <div className="rounded-card border border-brand-border bg-white/75 p-6 shadow-ambient">
        <div className="font-display text-[28px] font-medium tracking-tight">You matter. This is your space.</div>
        <div className="mt-2 text-sm text-brand-muted">This section stays anonymous by default. No name is shown here.</div>
      </div>

      <div className="rounded-card border border-brand-border bg-white/75 p-6 shadow-subtle">
        <div className="font-display text-[18px] font-medium tracking-tight">Daily mood check‑in</div>
        {doneToday ? (
          <div className="mt-3 rounded-card border border-brand-border bg-brand-bg/60 p-4 text-sm text-brand-muted">
            You’ve already checked in today. Thank you for showing up for yourself.
          </div>
        ) : (
          <div className="mt-4 space-y-4">
            <div className="grid grid-cols-2 gap-2 sm:grid-cols-5">
              {moods.map((m) => (
                <button
                  key={m.v}
                  type="button"
                  className={
                    'h-11 rounded-control border px-3 text-sm shadow-subtle ' +
                    (selectedMood === m.v
                      ? 'border-brand-primary bg-white/80'
                      : 'border-brand-border bg-white/70 hover:bg-white')
                  }
                  onClick={() => setSelectedMood(m.v)}
                >
                  {m.label}
                </button>
              ))}
            </div>
            <div>
              <div className="text-sm font-medium">What’s on your mind today? (optional)</div>
              <textarea
                className="mt-2 w-full rounded-control border border-brand-border bg-white/70 p-3 text-sm shadow-subtle"
                maxLength={200}
                rows={3}
                value={note}
                onChange={(e) => setNote(e.target.value)}
              />
              <div className="mt-1 text-xs text-brand-muted">{note.length}/200</div>
            </div>
            <button
              className="h-11 rounded-control bg-brand-primary px-5 text-sm font-medium text-white shadow-ambient hover:opacity-95"
              type="button"
              onClick={submit}
            >
              Save check-in
            </button>
          </div>
        )}
      </div>

      <div className="rounded-card border border-brand-border bg-white/75 p-6 shadow-subtle">
        <div className="font-display text-[18px] font-medium tracking-tight">Mood history (last 14 days)</div>
        {loading ? (
          <Skeleton className="mt-4 h-56" />
        ) : (
          <div className="mt-4 h-56">
            <ResponsiveContainer width="100%" height="100%">
              <LineChart data={chartData}>
                <XAxis dataKey="day" tick={{ fontSize: 12 }} />
                <YAxis domain={[1, 5]} ticks={[1, 2, 3, 4, 5]} tick={{ fontSize: 12 }} />
                <Tooltip />
                <Line type="monotone" dataKey="mood" stroke="rgb(43 42 127)" strokeWidth={3} dot={false} />
              </LineChart>
            </ResponsiveContainer>
          </div>
        )}
      </div>

      <div className="rounded-card border border-brand-border bg-white/75 p-6 shadow-subtle">
        <div className="font-display text-[18px] font-medium tracking-tight">Quick relief tools</div>
        <div className="mt-4 grid gap-3 sm:grid-cols-3">
          <div className="rounded-card border border-brand-border bg-brand-bg/60 p-4">
            <div className="text-sm font-medium">4-7-8 breathing</div>
            <div className="mt-1 text-sm text-brand-muted">Breathe in 4, hold 7, out 8.</div>
          </div>
          <div className="rounded-card border border-brand-border bg-brand-bg/60 p-4">
            <div className="text-sm font-medium">Body scan</div>
            <div className="mt-1 text-sm text-brand-muted">A calm 3-minute reset.</div>
          </div>
          <div className="rounded-card border border-brand-border bg-brand-bg/60 p-4">
            <div className="text-sm font-medium">5-4-3-2-1 grounding</div>
            <div className="mt-1 text-sm text-brand-muted">Come back to the present safely.</div>
          </div>
        </div>
        <div className="mt-5">
          <Link
            to={ROUTES.journal}
            className="inline-flex h-11 items-center justify-center rounded-control border border-brand-border bg-white/80 px-5 text-sm shadow-subtle hover:bg-white"
          >
            Open journal
          </Link>
        </div>
        <div className="mt-5 rounded-card border border-brand-border bg-white/70 p-4 text-sm text-brand-dark">
          {CRISIS_SUPPORT}
        </div>
      </div>
    </div>
  )
}
