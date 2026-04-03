import { useEffect, useMemo, useState } from 'react'
import { useUser } from '@/lib/auth'
import { Link } from 'react-router-dom'
import toast from 'react-hot-toast'
import { CalendarDays, HeartHandshake, Sparkles } from 'lucide-react'

import { mockApi } from '@/lib/mockApi'
import { ROUTES } from '@/lib/constants'
import { formatDateShort, getGreeting } from '@/lib/utils'
import Skeleton from '@/components/shared/Skeleton'

type DashboardData = {
  user: any
  applications: any[]
  savedSchemes: any[]
  moodEntries: any[]
  recentConversations: any[]
  recommended: any[]
  scholarshipDeadlines: Array<{ name: string; date: string }>
}

export default function Dashboard() {
  const { user } = useUser()
  const [data, setData] = useState<DashboardData | null>(null)
  const [loading, setLoading] = useState(true)

  const name = user?.firstName || user?.fullName || 'friend'
  const greeting = useMemo(() => getGreeting(), [])

  useEffect(() => {
    let mounted = true
    ;(async () => {
      try {
        const res = await mockApi.getDashboard()
        if (!mounted) return
        setData(res as any)
      } catch {
        toast.error('Could not load your dashboard. Please try again.')
      } finally {
        if (mounted) setLoading(false)
      }
    })()
    return () => {
      mounted = false
    }
  }, [])

  return (
    <div className="space-y-6">
      <div className="rounded-card border border-brand-border bg-white p-6 shadow-subtle">
        <div className="text-[28px] font-medium">{greeting}, {name}. Here's what matters today.</div>
        <div className="mt-2 text-sm text-brand-dark/80">Small steps. Clear guidance. You’ve got this.</div>
        <div className="mt-5 grid gap-3 sm:grid-cols-3">
          <Link to={ROUTES.disha} className="rounded-card border border-brand-border bg-brand-bg p-4 shadow-subtle hover:bg-white">
            <div className="flex items-center gap-2 text-sm font-medium"><Sparkles className="h-4 w-4 text-brand-accent" /> Talk to Disha</div>
            <div className="mt-1 text-sm text-brand-dark/80">Ask a question and get a calm plan.</div>
          </Link>
          <Link to={ROUTES.schemes} className="rounded-card border border-brand-border bg-brand-bg p-4 shadow-subtle hover:bg-white">
            <div className="flex items-center gap-2 text-sm font-medium"><CalendarDays className="h-4 w-4 text-brand-accent" /> Find Schemes</div>
            <div className="mt-1 text-sm text-brand-dark/80">Discover benefits you qualify for.</div>
          </Link>
          <Link to={ROUTES.wellness} className="rounded-card border border-brand-border bg-brand-bg p-4 shadow-subtle hover:bg-white">
            <div className="flex items-center gap-2 text-sm font-medium"><HeartHandshake className="h-4 w-4 text-brand-accent" /> Wellness Check-in</div>
            <div className="mt-1 text-sm text-brand-dark/80">A gentle check-in, just for you.</div>
          </Link>
        </div>
      </div>

      <div className="grid gap-4 lg:grid-cols-2">
        <div className="rounded-card border border-brand-border bg-white p-6 shadow-subtle">
          <div className="text-[18px] font-medium">Active scheme applications</div>
          {loading ? (
            <div className="mt-4 space-y-2">
              <Skeleton className="h-12" />
              <Skeleton className="h-12" />
              <Skeleton className="h-12" />
            </div>
          ) : (
            <div className="mt-4 space-y-2">
              {(data?.applications || []).slice(0, 5).map((a) => (
                <div key={a._id} className="flex items-center justify-between rounded-control border border-brand-border bg-brand-bg p-3">
                  <div>
                    <div className="text-sm font-medium">{a.schemeName}</div>
                    <div className="text-xs text-brand-dark/70">Updated {a.updatedAt ? formatDateShort(a.updatedAt) : 'recently'}</div>
                  </div>
                  <div className="rounded-full border border-brand-border bg-white px-3 py-1 text-xs">{a.status}</div>
                </div>
              ))}
              {(data?.applications || []).length === 0 ? (
                <div className="mt-3 text-sm text-brand-dark/70">No applications yet. When you mark a scheme as applied, it shows up here.</div>
              ) : null}
            </div>
          )}
        </div>

        <div className="rounded-card border border-brand-border bg-white p-6 shadow-subtle">
          <div className="text-[18px] font-medium">Recommended schemes</div>
          {loading ? (
            <div className="mt-4 space-y-2">
              <Skeleton className="h-16" />
              <Skeleton className="h-16" />
              <Skeleton className="h-16" />
            </div>
          ) : (
            <div className="mt-4 space-y-2">
              {(data?.recommended || []).map((s: any) => (
                <Link
                  key={s.id}
                  to={`/schemes/${s.id}`}
                  className="block rounded-control border border-brand-border bg-brand-bg p-3 hover:bg-white"
                >
                  <div className="text-sm font-medium">{s.name}</div>
                  <div className="mt-1 text-xs text-brand-dark/70">{s.ministry}</div>
                </Link>
              ))}
              {(data?.recommended || []).length === 0 ? (
                <div className="mt-3 text-sm text-brand-dark/70">Complete onboarding to get better recommendations.</div>
              ) : null}
            </div>
          )}
        </div>
      </div>

      <div className="grid gap-4 lg:grid-cols-2">
        <div className="rounded-card border border-brand-border bg-white p-6 shadow-subtle">
          <div className="text-[18px] font-medium">Wellness streak</div>
          <div className="mt-3 rounded-card border border-brand-border bg-brand-bg p-4">
            <div className="text-sm text-brand-dark/80">Check in daily to build a gentle streak.</div>
            <div className="mt-2 text-[28px] font-medium text-brand-primary">{data?.user?.wellnessStreak ?? 0} days</div>
          </div>
        </div>
        <div className="rounded-card border border-brand-border bg-white p-6 shadow-subtle">
          <div className="text-[18px] font-medium">Upcoming scholarship deadlines</div>
          <div className="mt-4 space-y-2">
            {(data?.scholarshipDeadlines || []).map((d) => (
              <div key={d.name} className="flex items-center justify-between rounded-control border border-brand-border bg-brand-bg p-3">
                <div className="text-sm font-medium">{d.name}</div>
                <div className="text-xs text-brand-dark/70">{formatDateShort(d.date)}</div>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  )
}
