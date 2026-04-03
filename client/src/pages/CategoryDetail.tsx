import { useEffect, useMemo, useState } from 'react'
import { Link, useParams } from 'react-router-dom'

import { ROUTES } from '@/lib/constants'
import { schemesRepo } from '@/lib/schemesRepo'
import type { Scheme } from '@/types/api'
import { formatSchemeName } from '@/lib/utils'

const LABELS: Record<string, { title: string; mode: 'category' | 'keyword'; value: string }> = {
  agriculture: { title: 'Agriculture', mode: 'category', value: 'Agriculture' },
  education: { title: 'Education', mode: 'category', value: 'Education' },
  housing: { title: 'Housing', mode: 'category', value: 'Housing' },
  health: { title: 'Health', mode: 'category', value: 'Health' },
  women: { title: 'Women', mode: 'category', value: 'Women' },
  msme: { title: 'MSME', mode: 'category', value: 'Business' },
  'sc-st-obc': { title: 'SC/ST/OBC', mode: 'category', value: 'SC-ST' },
  solar: { title: 'Solar', mode: 'keyword', value: 'solar' },
  disability: { title: 'Disability', mode: 'category', value: 'Disability' },
  skill: { title: 'Skill', mode: 'keyword', value: 'skill' },
  finance: { title: 'Finance', mode: 'category', value: 'Business' },
  'senior-citizens': { title: 'Senior Citizens', mode: 'keyword', value: 'pension' },
}

export default function CategoryDetail() {
  const { slug } = useParams()
  const meta = LABELS[String(slug || '')] || { title: 'Category', mode: 'keyword' as const, value: String(slug || '') }

  const [items, setItems] = useState<Scheme[]>([])
  const [total, setTotal] = useState(0)

  const query = useMemo(() => {
    if (meta.mode === 'category') return { category: meta.value }
    return { q: meta.value }
  }, [meta.mode, meta.value])

  useEffect(() => {
    let cancelled = false
    ;(async () => {
      const r = await schemesRepo.listSchemes({ ...query, page: 1, pageSize: 24 })
      if (cancelled) return
      setItems(r.items)
      setTotal(r.total)
    })()
    return () => {
      cancelled = true
    }
  }, [query])

  return (
    <div className="space-y-6">
      <div className="rounded-card border border-brand-border bg-white p-6 shadow-subtle">
        <div className="text-[28px] font-semibold tracking-tight text-brand-dark">{meta.title}</div>
        <div className="mt-2 text-sm text-brand-muted">{total.toLocaleString()} schemes found in this category.</div>
      </div>

      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
        {items.map((s) => (
          <div key={s.id} className="rounded-card border border-brand-border bg-white p-5 shadow-subtle">
            <div className="text-sm font-semibold text-brand-dark">{formatSchemeName(s.name)}</div>
            <div className="mt-1 text-xs text-brand-muted">{s.ministry}</div>
            <div className="mt-3 text-sm text-brand-muted line-clamp-3">{s.benefit}</div>
            <div className="mt-4">
              <Link to={`/schemes/${s.id}`} className="text-sm font-semibold text-brand-primary hover:underline">
                View details
              </Link>
            </div>
          </div>
        ))}
      </div>

      <div className="rounded-card border border-brand-border bg-brand-bg p-5 text-sm text-brand-muted">
        Want a personalised list? <Link to={ROUTES.schemes} className="font-semibold text-brand-accent hover:underline">Use the matcher</Link>.
      </div>
    </div>
  )
}
