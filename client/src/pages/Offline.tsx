import { useEffect, useMemo, useState } from 'react'
import { Link } from 'react-router-dom'

import Skeleton from '@/components/shared/Skeleton'
import { SCHEMES } from '@/data/schemes'
import { ROUTES } from '@/lib/constants'
import { mockApi } from '@/lib/mockApi'

export default function Offline() {
  const [loading, setLoading] = useState(true)
  const [saved, setSaved] = useState<Array<{ schemeId: string; savedAt: string }>>([])

  useEffect(() => {
    let cancelled = false
    ;(async () => {
      try {
        const list = await mockApi.listSavedSchemes()
        if (!cancelled) setSaved(list as any)
      } finally {
        if (!cancelled) setLoading(false)
      }
    })()
    return () => {
      cancelled = true
    }
  }, [])

  const savedDetails = useMemo(() => {
    return saved
      .map((s) => {
        const hit = SCHEMES.find((x) => x.id === s.schemeId)
        return { schemeId: s.schemeId, savedAt: s.savedAt, name: hit?.name || s.schemeId, ministry: hit?.ministry || '' }
      })
      .slice(0, 12)
  }, [saved])

  return (
    <div className="mx-auto max-w-3xl space-y-4">
      <div className="rounded-card border border-brand-border bg-white p-6 shadow-subtle">
        <div className="text-[22px] font-medium">You're offline.</div>
        <div className="mt-2 text-sm text-brand-dark/80">
          Some features like live search and fetching official links need internet. Your saved schemes are shown below (if available on this device).
        </div>
        <div className="mt-5 flex flex-col gap-3 sm:flex-row">
          <Link
            to={ROUTES.schemes}
            className="inline-flex h-11 items-center justify-center rounded-control bg-brand-primary px-5 text-sm font-medium text-white shadow-subtle hover:opacity-95"
          >
            Open Scheme Finder
          </Link>
          <Link
            to={ROUTES.mySchemes}
            className="inline-flex h-11 items-center justify-center rounded-control border border-brand-border bg-white px-5 text-sm shadow-subtle hover:bg-[#fbfbfa]"
          >
            Open My Schemes
          </Link>
        </div>
      </div>

      <div className="rounded-card border border-brand-border bg-white p-6 shadow-subtle">
        <div className="text-sm font-semibold text-brand-dark">Saved schemes (cached)</div>
        <div className="mt-2 text-sm text-brand-muted">These come from local storage, so they work offline.</div>

        <div className="mt-4 grid gap-3 sm:grid-cols-2">
          {loading ? (
            Array.from({ length: 4 }).map((_, i) => <Skeleton key={i} className="h-24" />)
          ) : savedDetails.length ? (
            savedDetails.map((s) => (
              <Link
                key={s.schemeId}
                to={`/schemes/${s.schemeId}`}
                className="rounded-card border border-brand-border bg-brand-bg p-4 hover:bg-white"
              >
                <div className="text-sm font-semibold text-brand-dark">{s.name}</div>
                {s.ministry ? <div className="mt-1 text-xs text-brand-muted">{s.ministry}</div> : null}
                <div className="mt-2 text-xs text-brand-muted">Saved: {new Date(s.savedAt).toLocaleDateString()}</div>
              </Link>
            ))
          ) : (
            <div className="rounded-card border border-brand-border bg-brand-bg p-4 text-sm text-brand-muted sm:col-span-2">
              No cached saved schemes found.
            </div>
          )}
        </div>
      </div>
    </div>
  )
}
