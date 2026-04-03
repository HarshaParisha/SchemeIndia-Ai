import { useEffect, useMemo, useState } from 'react'
import { Link, useParams } from 'react-router-dom'
import { BarChart3, ExternalLink, MapPin } from 'lucide-react'
import { Bar, BarChart, ResponsiveContainer, Tooltip, XAxis, YAxis } from 'recharts'

import { Button } from '@/components/ui/button'
import { IN_STATES, ROUTES } from '@/lib/constants'
import { slugify } from '@/lib/slug'
import { schemesRepo } from '@/lib/schemesRepo'
import type { Scheme } from '@/types/api'
import { formatSchemeName } from '@/lib/utils'

function guessHelpline(stateName: string) {
  const base = 'https://www.india.gov.in/my-government/schemes'
  const label = `${stateName} official schemes directory`
  return { label, url: base }
}

export default function StateDetailPage() {
  const { stateSlug } = useParams()
  const [tab, setTab] = useState<'state' | 'central'>('state')
  const [q, setQ] = useState('')
  const [stateCount, setStateCount] = useState(0)
  const [centralCount, setCentralCount] = useState(0)
  const [listSchemes, setListSchemes] = useState<Scheme[]>([])
  const [chartData, setChartData] = useState<Array<{ category: string; count: number }>>([])

  const stateName = useMemo(() => {
    const hit = IN_STATES.find((s) => slugify(s) === stateSlug)
    return hit || 'State'
  }, [stateSlug])

  useEffect(() => {
    let cancelled = false
    ;(async () => {
      const [stateRes, centralRes] = await Promise.all([
        schemesRepo.listSchemes({ state: stateName, scope: 'state', page: 1, pageSize: 1 }),
        schemesRepo.listSchemes({ scope: 'central', page: 1, pageSize: 1 }),
      ])
      if (cancelled) return
      setStateCount(stateRes.total)
      setCentralCount(centralRes.total)
    })()
    return () => {
      cancelled = true
    }
  }, [stateName])

  useEffect(() => {
    let cancelled = false
    ;(async () => {
      const scope = tab
      const res = await schemesRepo.listSchemes({
        q,
        state: scope === 'state' ? stateName : undefined,
        scope,
        page: 1,
        pageSize: 18,
      })
      if (cancelled) return
      setListSchemes(res.items)
    })()
    return () => {
      cancelled = true
    }
  }, [q, stateName, tab])

  useEffect(() => {
    let cancelled = false
    ;(async () => {
      const scopeForChart = tab === 'state' && stateCount > 0 ? 'state' : 'central'
      const stateForChart = scopeForChart === 'state' ? stateName : undefined

      const pages = [1, 2, 3, 4]
      const batches = await Promise.all(
        pages.map((p) => schemesRepo.listSchemes({ scope: scopeForChart, state: stateForChart, page: p, pageSize: 50 }))
      )
      if (cancelled) return

      const sample = batches.flatMap((b) => b.items)
      const counts = new Map<string, number>()
      for (const s of sample) counts.set(s.category, (counts.get(s.category) || 0) + 1)
      const chart = Array.from(counts.entries())
        .map(([category, count]) => ({ category, count }))
        .sort((a, b) => b.count - a.count)
        .slice(0, 8)
      setChartData(chart)
    })()
    return () => {
      cancelled = true
    }
  }, [stateCount, stateName, tab])

  const help = guessHelpline(stateName)

  return (
    <div className="space-y-6">
      <div className="rounded-card border border-brand-border bg-white p-6 shadow-subtle">
        <div className="flex flex-wrap items-start justify-between gap-4">
          <div>
            <div className="flex items-center gap-2">
              <MapPin className="h-5 w-5 text-brand-primary" />
              <div className="text-[28px] font-semibold tracking-tight text-brand-dark">{stateName}</div>
            </div>
            <div className="mt-2 text-[16px] text-brand-muted">
              Browse state schemes (when listed) and central schemes available across India.
            </div>
            <div className="mt-4 flex flex-wrap gap-2 text-xs text-brand-muted">
              <span className="rounded-full border border-brand-border bg-brand-bg px-3 py-1">State schemes: {stateCount}</span>
              <span className="rounded-full border border-brand-border bg-brand-bg px-3 py-1">Central schemes: {centralCount}</span>
            </div>
          </div>

          <div className="flex flex-col gap-2 sm:flex-row">
            <Button asChild variant="ghost">
              <Link to={ROUTES.states}>Change state</Link>
            </Button>
            <Button asChild>
              <Link to={ROUTES.schemes}>Find schemes</Link>
            </Button>
          </div>
        </div>
      </div>

      <div className="grid gap-4 lg:grid-cols-[0.95fr_1.05fr]">
        <div className="rounded-card border border-brand-border bg-white p-6 shadow-subtle">
          <div className="flex items-center gap-2">
            <BarChart3 className="h-5 w-5 text-brand-accent" />
            <div className="text-[20px] font-semibold text-brand-dark">Top categories</div>
          </div>
          <div className="mt-4 h-64">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={chartData} layout="vertical" margin={{ left: 8, right: 8, top: 0, bottom: 0 }}>
                <XAxis type="number" hide />
                <YAxis type="category" dataKey="category" width={110} tick={{ fontSize: 12, fill: 'rgb(var(--bc-muted))' }} />
                <Tooltip cursor={{ fill: 'rgba(26,107,60,0.08)' }} />
                <Bar dataKey="count" fill="rgb(var(--bc-primary))" radius={[6, 6, 6, 6]} />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </div>

        <div className="rounded-card border border-brand-border bg-white p-6 shadow-subtle">
          <div className="text-[20px] font-semibold text-brand-dark">Helpline</div>
          <div className="mt-2 text-[16px] text-brand-muted">For the latest contacts and official guidance, use the directory below.</div>
          <a
            className="mt-4 inline-flex items-center gap-2 text-sm font-medium text-brand-accent"
            href={help.url}
            target="_blank"
            rel="noreferrer"
          >
            {help.label} <ExternalLink className="h-4 w-4" />
          </a>
          <div className="mt-6 rounded-card border border-brand-border bg-brand-bg p-4">
            <div className="text-sm font-semibold text-brand-dark">Tip</div>
            <div className="mt-1 text-sm text-brand-muted">Start with State schemes, then check Central schemes for wider coverage.</div>
          </div>
        </div>
      </div>

      <div className="rounded-card border border-brand-border bg-white p-6 shadow-subtle">
        <div className="flex flex-col gap-3 sm:flex-row sm:items-end sm:justify-between">
          <div>
            <div className="text-[20px] font-semibold text-brand-dark">Schemes in {stateName}</div>
            <div className="mt-2 text-[16px] text-brand-muted">
              {tab === 'state'
                ? 'State government schemes for your selected state.'
                : 'Central government schemes available across India (eligibility may vary).'}
            </div>
          </div>

          <div className="flex flex-col gap-2 sm:flex-row sm:items-center">
            <div className="inline-flex rounded-control border border-brand-border bg-white p-1 shadow-subtle">
              <button
                type="button"
                onClick={() => setTab('state')}
                className={
                  'h-10 rounded-control px-4 text-sm font-medium ' +
                  (tab === 'state' ? 'bg-brand-primary text-white' : 'bg-white text-brand-dark')
                }
              >
                State ({stateCount})
              </button>
              <button
                type="button"
                onClick={() => setTab('central')}
                className={
                  'h-10 rounded-control px-4 text-sm font-medium ' +
                  (tab === 'central' ? 'bg-brand-primary text-white' : 'bg-white text-brand-dark')
                }
              >
                Central ({centralCount})
              </button>
            </div>

            <input
              value={q}
              onChange={(e) => setQ(e.target.value)}
              className="h-11 w-full rounded-control border border-brand-border bg-white px-3 text-sm shadow-subtle sm:w-[260px]"
              placeholder="Search schemes in this list"
            />
          </div>
        </div>

        {tab === 'state' && stateCount === 0 ? (
          <div className="mt-5 rounded-card border border-brand-border bg-brand-bg p-4 text-sm text-brand-muted">
            State schemes for {stateName} are being added. You can still browse Central schemes using the tab above.
          </div>
        ) : null}

        <div className="mt-5 grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
          {listSchemes.slice(0, 18).map((s) => (
            <Link key={s.id} to={`/schemes/${s.id}`} className="rounded-card border border-brand-border bg-brand-bg p-4 hover:bg-white">
              <div className="text-sm font-semibold text-brand-dark">{formatSchemeName(s.name)}</div>
              <div className="mt-1 text-xs text-brand-muted">{s.ministry}</div>
              <div className="mt-3 text-sm text-brand-muted line-clamp-2">{s.benefit}</div>
            </Link>
          ))}
        </div>
      </div>
    </div>
  )
}
