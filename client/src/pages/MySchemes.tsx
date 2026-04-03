import { useEffect, useMemo, useState } from 'react'
import { Link } from 'react-router-dom'
import toast from 'react-hot-toast'

import Skeleton from '@/components/shared/Skeleton'
import { Button } from '@/components/ui/button'
import { api, withAuthHeader } from '@/lib/api'
import { useAuth } from '@/lib/auth'
import { ROUTES } from '@/lib/constants'
import { SCHEMES } from '@/data/schemes'
import { mockApi } from '@/lib/mockApi'
import { cn } from '@/lib/utils'

type Tab = 'saved' | 'applied' | 'recommended'

type DashboardData = {
  savedSchemes: Array<{ schemeId: string; savedAt: string; applicationStatus?: 'saved' | 'applied' | 'approved' | 'rejected'; notes?: string }>
  applications: Array<{ schemeId: string; schemeName: string; status: 'Applied' | 'Pending' | 'Approved'; notes?: string; appliedAt?: string; updatedAt?: string }>
  recommended: Array<{ id: string; name: string; state: string | null; ministry: string; category: string; benefit: string }>
}

function schemeMeta(id: string) {
  const hit = SCHEMES.find((s) => s.id === id)
  if (hit) return { id: hit.id, name: hit.name, ministry: hit.ministry, category: hit.category, state: hit.state, benefit: hit.benefit }
  return { id, name: id, ministry: '', category: '', state: null as string | null, benefit: '' }
}

export default function MySchemesPage() {
  const { getToken } = useAuth()
  const [tab, setTab] = useState<Tab>('saved')
  const [loading, setLoading] = useState(true)
  const [data, setData] = useState<DashboardData>({ savedSchemes: [], applications: [], recommended: [] })

  const [savedEdits, setSavedEdits] = useState<Record<string, { applicationStatus: 'saved' | 'applied' | 'approved' | 'rejected'; notes: string }>>({})
  const [appliedEdits, setAppliedEdits] = useState<Record<string, { status: 'Applied' | 'Pending' | 'Approved'; notes: string }>>({})

  useEffect(() => {
    let cancelled = false
    ;(async () => {
      try {
        setLoading(true)
        try {
          const headers = await withAuthHeader(getToken)
          const r = await api.get('/api/user/dashboard', { headers })
          const d = r.data?.data || {}
          if (!cancelled) {
            setData({
              savedSchemes: (d.savedSchemes || []) as any,
              applications: (d.applications || []) as any,
              recommended: (d.recommended || []) as any,
            })
          }
        } catch {
          const fallback = await mockApi.getDashboard()
          if (!cancelled) {
            setData({
              savedSchemes: (fallback.savedSchemes || []) as any,
              applications: (fallback.applications || []) as any,
              recommended: (fallback.recommended || []) as any,
            })
          }
        }
      } finally {
        if (!cancelled) setLoading(false)
      }
    })()
    return () => {
      cancelled = true
    }
  }, [getToken])

  useEffect(() => {
    const next: Record<string, { applicationStatus: 'saved' | 'applied' | 'approved' | 'rejected'; notes: string }> = {}
    for (const s of data.savedSchemes) {
      next[s.schemeId] = {
        applicationStatus: (s.applicationStatus || 'saved') as any,
        notes: s.notes || '',
      }
    }
    setSavedEdits(next)
  }, [data.savedSchemes])

  useEffect(() => {
    const next: Record<string, { status: 'Applied' | 'Pending' | 'Approved'; notes: string }> = {}
    for (const a of data.applications) {
      next[a.schemeId] = { status: a.status, notes: a.notes || '' }
    }
    setAppliedEdits(next)
  }, [data.applications])

  const counts = useMemo(
    () => ({ saved: data.savedSchemes.length, applied: data.applications.length, recommended: data.recommended.length }),
    [data.applications.length, data.recommended.length, data.savedSchemes.length],
  )

  const exportPdf = () => {
    toast('Export to PDF is coming soon.')
  }

  const saveSavedRow = async (schemeId: string) => {
    const patch = savedEdits[schemeId]
    if (!patch) return
    try {
      const headers = await withAuthHeader(getToken)
      await api.put(`/api/saved/${schemeId}/status`, patch, { headers })
      toast.success('Updated')
    } catch {
      await mockApi.updateSavedScheme({ schemeId, applicationStatus: patch.applicationStatus, notes: patch.notes })
      toast.success('Updated (local)')
    }
  }

  const saveAppliedRow = async (schemeId: string) => {
    const patch = appliedEdits[schemeId]
    if (!patch) return
    const meta = schemeMeta(schemeId)
    try {
      const headers = await withAuthHeader(getToken)
      await api.post(
        '/api/schemes/apply',
        {
          schemeId,
          schemeName: meta.name,
          status: patch.status,
          notes: patch.notes || undefined,
        },
        { headers },
      )
      toast.success('Updated')
    } catch {
      await mockApi.applyScheme({ schemeId, schemeName: meta.name, status: patch.status, notes: patch.notes || undefined })
      toast.success('Updated (local)')
    }
  }

  return (
    <div className="space-y-6">
      <div className="rounded-card border border-brand-border bg-white p-6 shadow-subtle">
        <div className="flex flex-wrap items-start justify-between gap-4">
          <div>
            <div className="text-[28px] font-semibold tracking-tight text-brand-dark">My schemes</div>
            <div className="mt-2 text-[16px] text-brand-muted">Track saved and applied schemes in one place.</div>
          </div>
          <div className="flex flex-col gap-2 sm:flex-row">
            <Button variant="ghost" className="h-11" onClick={exportPdf}>
              Export to PDF
            </Button>
            <Button asChild className="h-11">
              <Link to={ROUTES.schemes}>Find more schemes</Link>
            </Button>
          </div>
        </div>
      </div>

      <div className="rounded-card border border-brand-border bg-white p-2 shadow-subtle">
        <div className="grid grid-cols-3 gap-2">
          {([
            { key: 'saved', label: `Saved (${counts.saved})` },
            { key: 'applied', label: `Applied (${counts.applied})` },
            { key: 'recommended', label: `Recommended (${counts.recommended})` },
          ] as Array<{ key: Tab; label: string }>).map((t) => (
            <button
              key={t.key}
              type="button"
              className={cn(
                'h-11 rounded-control border px-3 text-sm font-medium shadow-subtle',
                tab === t.key ? 'border-brand-primary bg-brand-bg text-brand-dark' : 'border-brand-border bg-white text-brand-muted hover:bg-brand-bg',
              )}
              onClick={() => setTab(t.key)}
            >
              {t.label}
            </button>
          ))}
        </div>
      </div>

      {loading ? (
        <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
          {Array.from({ length: 6 }).map((_, i) => (
            <Skeleton key={i} className="h-48" />
          ))}
        </div>
      ) : null}

      {!loading && tab === 'saved' ? (
        <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
          {data.savedSchemes.map((s) => {
            const meta = schemeMeta(s.schemeId)
            const edit = savedEdits[s.schemeId] || { applicationStatus: 'saved', notes: '' }
            return (
              <div key={s.schemeId} className="rounded-card border border-brand-border bg-white p-5 shadow-subtle">
                <div className="text-sm font-semibold text-brand-dark">{meta.name}</div>
                {meta.ministry ? <div className="mt-1 text-xs text-brand-muted">{meta.ministry}</div> : null}

                <div className="mt-4 grid gap-3">
                  <div>
                    <div className="text-xs font-semibold text-brand-muted">Status</div>
                    <select
                      className="mt-2 h-11 w-full rounded-control border border-brand-border bg-white px-3 text-sm shadow-subtle"
                      value={edit.applicationStatus}
                      onChange={(e) =>
                        setSavedEdits((prev) => ({
                          ...prev,
                          [s.schemeId]: { ...edit, applicationStatus: e.target.value as any },
                        }))
                      }
                    >
                      <option value="saved">Saved</option>
                      <option value="applied">Applied</option>
                      <option value="approved">Approved</option>
                      <option value="rejected">Rejected</option>
                    </select>
                  </div>

                  <div>
                    <div className="text-xs font-semibold text-brand-muted">Notes</div>
                    <textarea
                      className="mt-2 w-full rounded-control border border-brand-border bg-white p-3 text-sm shadow-subtle"
                      rows={3}
                      value={edit.notes}
                      placeholder="Add notes (documents, deadlines, next steps)"
                      onChange={(e) =>
                        setSavedEdits((prev) => ({
                          ...prev,
                          [s.schemeId]: { ...edit, notes: e.target.value },
                        }))
                      }
                    />
                  </div>
                </div>

                <div className="mt-4 flex gap-2">
                  <Button asChild className="h-11 flex-1">
                    <Link to={`/schemes/${meta.id}`}>View</Link>
                  </Button>
                  <button
                    type="button"
                    className="h-11 flex-1 rounded-control border border-brand-border bg-white text-sm font-medium text-brand-dark shadow-subtle hover:bg-brand-bg"
                    onClick={() => saveSavedRow(s.schemeId)}
                  >
                    Save
                  </button>
                </div>
              </div>
            )
          })}

          {data.savedSchemes.length === 0 ? (
            <div className="rounded-card border border-brand-border bg-white p-6 text-sm text-brand-muted shadow-subtle sm:col-span-2 lg:col-span-3">
              No saved schemes yet. Save a scheme from results or a scheme detail page.
            </div>
          ) : null}
        </div>
      ) : null}

      {!loading && tab === 'applied' ? (
        <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
          {data.applications.map((a) => {
            const edit = appliedEdits[a.schemeId] || { status: a.status, notes: a.notes || '' }
            return (
              <div key={a.schemeId} className="rounded-card border border-brand-border bg-white p-5 shadow-subtle">
                <div className="text-sm font-semibold text-brand-dark">{a.schemeName}</div>
                <div className="mt-1 text-xs text-brand-muted">Scheme ID: {a.schemeId}</div>

                <div className="mt-4 grid gap-3">
                  <div>
                    <div className="text-xs font-semibold text-brand-muted">Application status</div>
                    <select
                      className="mt-2 h-11 w-full rounded-control border border-brand-border bg-white px-3 text-sm shadow-subtle"
                      value={edit.status}
                      onChange={(e) =>
                        setAppliedEdits((prev) => ({
                          ...prev,
                          [a.schemeId]: { ...edit, status: e.target.value as any },
                        }))
                      }
                    >
                      <option value="Applied">Applied</option>
                      <option value="Pending">Pending</option>
                      <option value="Approved">Approved</option>
                    </select>
                  </div>

                  <div>
                    <div className="text-xs font-semibold text-brand-muted">Notes</div>
                    <textarea
                      className="mt-2 w-full rounded-control border border-brand-border bg-white p-3 text-sm shadow-subtle"
                      rows={3}
                      value={edit.notes}
                      placeholder="Add notes (reference number, documents submitted, etc.)"
                      onChange={(e) =>
                        setAppliedEdits((prev) => ({
                          ...prev,
                          [a.schemeId]: { ...edit, notes: e.target.value },
                        }))
                      }
                    />
                  </div>
                </div>

                <div className="mt-4 flex gap-2">
                  <Button asChild className="h-11 flex-1">
                    <Link to={`/schemes/${a.schemeId}`}>View</Link>
                  </Button>
                  <button
                    type="button"
                    className="h-11 flex-1 rounded-control border border-brand-border bg-white text-sm font-medium text-brand-dark shadow-subtle hover:bg-brand-bg"
                    onClick={() => saveAppliedRow(a.schemeId)}
                  >
                    Save
                  </button>
                </div>
              </div>
            )
          })}

          {data.applications.length === 0 ? (
            <div className="rounded-card border border-brand-border bg-white p-6 text-sm text-brand-muted shadow-subtle sm:col-span-2 lg:col-span-3">
              No applied schemes yet. Mark a scheme as applied from the scheme detail page.
            </div>
          ) : null}
        </div>
      ) : null}

      {!loading && tab === 'recommended' ? (
        <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
          {data.recommended.map((s) => (
            <div key={s.id} className="flex flex-col rounded-card border border-brand-border bg-white p-5 shadow-subtle">
              <div className="text-sm font-semibold text-brand-dark">{s.name}</div>
              <div className="mt-1 text-xs text-brand-muted">{s.ministry}</div>
              <div className="mt-3 text-sm text-brand-muted line-clamp-3">{s.benefit}</div>
              <div className="mt-auto pt-4">
                <Button asChild className="h-11 w-full">
                  <Link to={`/schemes/${s.id}`}>View details</Link>
                </Button>
              </div>
            </div>
          ))}

          {data.recommended.length === 0 ? (
            <div className="rounded-card border border-brand-border bg-white p-6 text-sm text-brand-muted shadow-subtle sm:col-span-2 lg:col-span-3">
              No recommendations yet. Complete onboarding or fill the Scheme Finder to get personalised results.
            </div>
          ) : null}
        </div>
      ) : null}
    </div>
  )
}

