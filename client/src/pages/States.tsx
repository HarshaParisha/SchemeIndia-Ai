import { useMemo, useState } from 'react'
import { Link } from 'react-router-dom'
import { MapPin, Search } from 'lucide-react'

import { IN_STATES, ROUTES } from '@/lib/constants'
import { slugify } from '@/lib/slug'

export default function StatesPage() {
  const [q, setQ] = useState('')

  const items = useMemo(() => {
    const t = q.trim().toLowerCase()
    if (!t) return IN_STATES
    return IN_STATES.filter((s) => s.toLowerCase().includes(t))
  }, [q])

  return (
    <div className="space-y-6">
      <div className="rounded-card border border-brand-border bg-white p-6 shadow-subtle">
        <div className="flex items-start justify-between gap-4">
          <div>
            <div className="flex items-center gap-2">
              <MapPin className="h-5 w-5 text-brand-primary" />
              <div className="text-[28px] font-semibold tracking-tight text-brand-dark">Browse by state</div>
            </div>
            <div className="mt-2 text-[16px] text-brand-muted">Open any state to see state schemes + central schemes.</div>
          </div>
        </div>

        <div className="mt-5 flex items-center gap-2 rounded-control border border-brand-border bg-brand-bg px-3 py-2">
          <Search className="h-4 w-4 text-brand-muted" />
          <input
            className="h-8 w-full bg-transparent text-sm outline-none"
            value={q}
            onChange={(e) => setQ(e.target.value)}
            placeholder="Search a state or UT"
            aria-label="Search states"
          />
        </div>
      </div>

      <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
        {items.map((s) => (
          <Link
            key={s}
            to={ROUTES.stateDetail.replace(':stateSlug', slugify(s))}
            className="rounded-card border border-brand-border bg-white p-4 shadow-subtle hover:bg-brand-bg"
          >
            <div className="text-sm font-semibold text-brand-dark">{s}</div>
            <div className="mt-1 text-xs text-brand-muted">View schemes and official helplines</div>
          </Link>
        ))}
      </div>
    </div>
  )
}

