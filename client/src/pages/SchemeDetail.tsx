import { useEffect, useMemo, useState } from 'react'
import { Link, useParams } from 'react-router-dom'
import toast from 'react-hot-toast'
import { Bookmark, Download, ExternalLink, ThumbsDown, ThumbsUp } from 'lucide-react'

import Skeleton from '@/components/shared/Skeleton'
import { Button } from '@/components/ui/button'
import { mockApi } from '@/lib/mockApi'
import { ROUTES } from '@/lib/constants'
import type { Scheme } from '@/types/api'
import { deriveBenefitAmount, deriveBenefitType, scoreScheme } from '@/lib/schemeMatcher'
import { schemesRepo } from '@/lib/schemesRepo'
import { getSchemeTips } from '@/lib/schemeTips'
import { formatSchemeName } from '@/lib/utils'
import { useSchemeFinderStore } from '@/store/useSchemeFinderStore'

type Feedback = { helpful: boolean; note?: string; createdAt: string }

function keyFor(id: string) {
  return `si_scheme_feedback_${id}`
}

function formatDate(d?: string | null) {
  if (!d) return '—'
  const dt = new Date(d)
  if (Number.isNaN(dt.getTime())) return '—'
  return dt.toLocaleDateString(undefined, { year: 'numeric', month: 'short', day: '2-digit' })
}

export default function SchemeDetail() {
  const { id } = useParams()
  const answers = useSchemeFinderStore((s) => s.answers)

  const [scheme, setScheme] = useState<Scheme | null>(null)
  const [loading, setLoading] = useState(true)
  const [similar, setSimilar] = useState<Scheme[]>([])
  const [checked, setChecked] = useState<Record<string, boolean>>({})
  const [saved, setSaved] = useState(false)
  const [feedback, setFeedback] = useState<Feedback | null>(null)
  const [feedbackNote, setFeedbackNote] = useState('')

  useEffect(() => {
    let mounted = true
    ;(async () => {
      try {
        const s = await schemesRepo.getScheme(String(id))
        if (!mounted) return
        setScheme(s)
      } catch {
        toast.error('Could not load scheme details.')
      } finally {
        if (mounted) setLoading(false)
      }
    })()
    return () => {
      mounted = false
    }
  }, [id])

  useEffect(() => {
    if (!scheme) return
    let cancelled = false
    ;(async () => {
      const r = await schemesRepo.listSchemes({ category: scheme.category, page: 1, pageSize: 6 })
      if (cancelled) return
      setSimilar(r.items.filter((s) => s.id !== scheme.id).slice(0, 4))
    })()
    return () => {
      cancelled = true
    }
  }, [scheme])

  useEffect(() => {
    if (!id) return
    const raw = window.localStorage.getItem(keyFor(String(id)))
    if (!raw) return
    try {
      setFeedback(JSON.parse(raw) as Feedback)
    } catch {
      return
    }
  }, [id])

  useEffect(() => {
    ;(async () => {
      try {
        const list = await mockApi.listSavedSchemes()
        setSaved(list.some((x) => x.schemeId === String(id)))
      } catch {
        return
      }
    })()
  }, [id])

  const score = useMemo(() => {
    if (!scheme) return null
    return scoreScheme(scheme, answers)
  }, [answers, scheme])

  const benefitType = useMemo(() => (scheme ? deriveBenefitType(scheme.benefit) : null), [scheme])
  const benefitAmount = useMemo(() => (scheme ? deriveBenefitAmount(scheme.benefit) : 0), [scheme])

  const documents = useMemo(() => scheme?.documents || [], [scheme])
  const tips = useMemo(() => (scheme ? getSchemeTips(scheme) : []), [scheme])

  const apply = async () => {
    if (!scheme) return
    try {
      await mockApi.applyScheme({ schemeId: scheme.id, schemeName: scheme.name, status: 'Applied' })
      toast.success('Marked as applied')
    } catch {
      toast.error('Could not update status. Please try again.')
    }
  }

  const save = async () => {
    if (!scheme) return
    try {
      await mockApi.saveScheme(scheme.id)
      setSaved(true)
      toast.success('Saved')
    } catch {
      toast.error('Could not save. Please try again.')
    }
  }

  const download = async () => {
    if (!scheme) return
    toast('Download is available on the official portal for most schemes.')
    if (scheme.officialLink) window.open(scheme.officialLink, '_blank', 'noreferrer')
  }

  const submitFeedback = (helpful: boolean) => {
    if (!id) return
    const next: Feedback = { helpful, note: feedbackNote.trim() || undefined, createdAt: new Date().toISOString() }
    window.localStorage.setItem(keyFor(String(id)), JSON.stringify(next))
    setFeedback(next)
    toast.success('Thanks for your feedback')
  }

  return (
    <div className="space-y-6">
      {loading ? <Skeleton className="h-56" /> : null}

      {!loading && !scheme ? (
        <div className="rounded-card border border-brand-border bg-white p-6 shadow-subtle">
          <div className="text-sm font-semibold text-brand-dark">Scheme not found</div>
          <div className="mt-2 text-sm text-brand-muted">Go back to browse schemes.</div>
          <div className="mt-4">
            <Button asChild>
              <Link to={ROUTES.schemes}>Back to Scheme Finder</Link>
            </Button>
          </div>
        </div>
      ) : null}

      {scheme ? (
        <div className="grid gap-4 lg:grid-cols-[1fr_360px]">
          <div className="space-y-4">
            <div className="rounded-card border border-brand-border bg-white p-6 shadow-subtle">
              <div className="flex flex-wrap items-start justify-between gap-3">
                <div>
                  <div className="text-[28px] font-semibold tracking-tight text-brand-dark">{formatSchemeName(scheme.name)}</div>
                  <div className="mt-2 text-sm text-brand-muted">{scheme.ministry}</div>
                </div>
                <div className="flex flex-wrap gap-2">
                  <span className="rounded-full border border-brand-border bg-brand-bg px-3 py-1 text-xs text-brand-muted">
                    {scheme.state ? 'State scheme' : 'Central scheme'}
                  </span>
                  <span className="rounded-full border border-brand-border bg-brand-bg px-3 py-1 text-xs text-brand-muted">{scheme.category}</span>
                  {benefitType ? (
                    <span className="rounded-full border border-brand-border bg-brand-bg px-3 py-1 text-xs text-brand-muted">{benefitType}</span>
                  ) : null}
                </div>
              </div>

              <div className="mt-4 text-sm leading-relaxed text-brand-muted">{scheme.description}</div>

              <div className="mt-5 grid gap-3 sm:grid-cols-2">
                <div className="rounded-card border border-brand-border bg-brand-bg p-4">
                  <div className="text-xs font-semibold text-brand-muted">Last updated</div>
                  <div className="mt-1 text-sm font-semibold text-brand-dark">{formatDate(scheme.updatedAt)}</div>
                </div>
                <div className="rounded-card border border-brand-border bg-brand-bg p-4">
                  <div className="text-xs font-semibold text-brand-muted">Benefit</div>
                  <div className="mt-1 text-sm text-brand-dark">{scheme.benefit}</div>
                </div>
              </div>
            </div>

            <div className="rounded-card border border-brand-border bg-white p-6 shadow-subtle">
              <div className="text-[20px] font-semibold text-brand-dark">Eligibility</div>
              <div className="mt-4 grid gap-3 sm:grid-cols-2">
                <div className="rounded-card border border-brand-border bg-brand-bg p-4">
                  <div className="text-xs font-semibold text-brand-muted">Age</div>
                  <div className="mt-1 text-sm text-brand-dark">
                    {scheme.eligibility?.minAge || scheme.eligibility?.maxAge
                      ? `${scheme.eligibility?.minAge ?? '—'} to ${scheme.eligibility?.maxAge ?? '—'}`
                      : 'Not specified'}
                  </div>
                </div>
                <div className="rounded-card border border-brand-border bg-brand-bg p-4">
                  <div className="text-xs font-semibold text-brand-muted">Max income</div>
                  <div className="mt-1 text-sm text-brand-dark">
                    {scheme.eligibility?.maxIncome ? `₹${scheme.eligibility.maxIncome.toLocaleString()}/year` : 'Not specified'}
                  </div>
                </div>
                <div className="rounded-card border border-brand-border bg-brand-bg p-4">
                  <div className="text-xs font-semibold text-brand-muted">Gender</div>
                  <div className="mt-1 text-sm text-brand-dark">
                    {scheme.eligibility?.gender?.length ? scheme.eligibility.gender.join(', ') : 'Any'}
                  </div>
                </div>
                <div className="rounded-card border border-brand-border bg-brand-bg p-4">
                  <div className="text-xs font-semibold text-brand-muted">Category</div>
                  <div className="mt-1 text-sm text-brand-dark">
                    {scheme.eligibility?.casteCategory?.length ? scheme.eligibility.casteCategory.join(', ') : 'Any'}
                  </div>
                </div>
              </div>
            </div>

            <div className="rounded-card border border-brand-border bg-white p-6 shadow-subtle">
              <div className="text-[20px] font-semibold text-brand-dark">Documents (checklist)</div>
              <div className="mt-4 space-y-2">
                {documents.map((d) => (
                  <label key={d} className="flex items-center gap-3 rounded-control border border-brand-border bg-white px-3 py-3 shadow-subtle">
                    <input
                      type="checkbox"
                      checked={Boolean(checked[d])}
                      onChange={(e) => setChecked((c) => ({ ...c, [d]: e.target.checked }))}
                    />
                    <div className="text-sm text-brand-dark">{d}</div>
                  </label>
                ))}
              </div>
            </div>

            <div className="rounded-card border border-brand-border bg-white p-6 shadow-subtle">
              <div className="text-[20px] font-semibold text-brand-dark">Application steps</div>
              <div className="mt-4 space-y-2">
                {scheme.applicationSteps.map((s, idx) => (
                  <div key={idx} className="rounded-control border border-brand-border bg-brand-bg px-3 py-3 text-sm text-brand-dark">
                    {idx + 1}. {s}
                  </div>
                ))}
              </div>
            </div>

            <div className="rounded-card border border-brand-border bg-white p-6 shadow-subtle">
              <div className="text-[20px] font-semibold text-brand-dark">Tips to apply</div>
              <div className="mt-4 space-y-2">
                {tips.map((t) => (
                  <div key={t} className="rounded-control border border-brand-border bg-brand-bg px-3 py-3 text-sm text-brand-dark">
                    {t}
                  </div>
                ))}
              </div>
            </div>

            <div className="rounded-card border border-brand-border bg-white p-6 shadow-subtle">
              <div className="text-[20px] font-semibold text-brand-dark">Official links</div>
              <div className="mt-3">
                <a
                  className="inline-flex items-center gap-2 text-sm font-semibold text-brand-accent hover:underline"
                  href={scheme.officialLink}
                  target="_blank"
                  rel="noreferrer"
                >
                  Open official portal <ExternalLink className="h-4 w-4" />
                </a>
              </div>
              {scheme.deadline ? <div className="mt-2 text-sm text-brand-muted">Deadline: {scheme.deadline}</div> : null}
            </div>

            <div className="rounded-card border border-brand-border bg-white p-6 shadow-subtle">
              <div className="text-[20px] font-semibold text-brand-dark">Similar schemes</div>
              <div className="mt-4 grid gap-3 sm:grid-cols-2">
                {similar.map((s) => (
                  <Link
                    key={s.id}
                    to={`/schemes/${s.id}`}
                    className="rounded-card border border-brand-border bg-brand-bg p-4 text-sm font-semibold text-brand-dark hover:bg-white"
                  >
                    {formatSchemeName(s.name)}
                    <div className="mt-1 text-xs font-normal text-brand-muted">{s.ministry}</div>
                  </Link>
                ))}
              </div>
            </div>

            <div className="rounded-card border border-brand-border bg-white p-6 shadow-subtle">
              <div className="text-[20px] font-semibold text-brand-dark">Feedback</div>
              <div className="mt-2 text-sm text-brand-muted">Was this page helpful?</div>

              {feedback ? (
                <div className="mt-4 rounded-card border border-brand-border bg-brand-bg p-4 text-sm text-brand-dark">
                  Thanks. You marked this as <span className="font-semibold">{feedback.helpful ? 'Helpful' : 'Not helpful'}</span>.
                </div>
              ) : (
                <div className="mt-4 space-y-3">
                  <textarea
                    className="w-full rounded-control border border-brand-border bg-white p-3 text-sm shadow-subtle"
                    rows={3}
                    maxLength={200}
                    placeholder="Optional note (max 200 chars)"
                    value={feedbackNote}
                    onChange={(e) => setFeedbackNote(e.target.value)}
                  />
                  <div className="flex flex-col gap-2 sm:flex-row">
                    <button
                      type="button"
                      onClick={() => submitFeedback(true)}
                      className="inline-flex h-11 items-center justify-center gap-2 rounded-control bg-brand-primary px-5 text-sm font-semibold text-white shadow-subtle"
                    >
                      <ThumbsUp className="h-4 w-4" />
                      Helpful
                    </button>
                    <button
                      type="button"
                      onClick={() => submitFeedback(false)}
                      className="inline-flex h-11 items-center justify-center gap-2 rounded-control border border-brand-border bg-white px-5 text-sm font-semibold text-brand-dark shadow-subtle"
                    >
                      <ThumbsDown className="h-4 w-4" />
                      Not helpful
                    </button>
                  </div>
                </div>
              )}
            </div>
          </div>

          <div className="space-y-4 lg:sticky lg:top-20 lg:self-start">
            <div className="rounded-card border border-brand-border bg-white p-6 shadow-subtle">
              <div className="text-sm font-semibold text-brand-dark">Summary</div>
              <div className="mt-3 space-y-2 text-sm text-brand-muted">
                <div>
                  <span className="font-semibold text-brand-dark">Government:</span> {scheme.state ? scheme.state : 'Central'}
                </div>
                <div>
                  <span className="font-semibold text-brand-dark">Category:</span> {scheme.category}
                </div>
                <div>
                  <span className="font-semibold text-brand-dark">Benefit type:</span> {benefitType}
                </div>
                <div>
                  <span className="font-semibold text-brand-dark">Last updated:</span> {formatDate(scheme.updatedAt)}
                </div>
                {benefitAmount ? (
                  <div>
                    <span className="font-semibold text-brand-dark">Estimated value:</span> ₹{benefitAmount.toLocaleString()}
                  </div>
                ) : null}
              </div>

              {typeof score === 'number' ? (
                <div className="mt-4">
                  <div className="flex items-center justify-between text-xs text-brand-muted">
                    <span>Match score</span>
                    <span className="font-semibold text-brand-dark">{score}%</span>
                  </div>
                  <div className="mt-2 h-2 w-full rounded-full bg-brand-border">
                    <div className="h-2 rounded-full bg-brand-primary" style={{ width: `${score}%` }} />
                  </div>
                </div>
              ) : null}

              <div className="mt-5 flex flex-col gap-2">
                <Button onClick={apply}>Apply / Mark as applied</Button>
                <button
                  type="button"
                  onClick={save}
                  className={
                    'inline-flex h-11 items-center justify-center gap-2 rounded-control border px-5 text-sm font-semibold shadow-subtle ' +
                    (saved ? 'border-brand-primary bg-brand-bg text-brand-dark' : 'border-brand-border bg-white text-brand-dark')
                  }
                >
                  <Bookmark className="h-4 w-4" />
                  {saved ? 'Saved' : 'Save'}
                </button>
                <button
                  type="button"
                  onClick={download}
                  className="inline-flex h-11 items-center justify-center gap-2 rounded-control border border-brand-border bg-white px-5 text-sm font-semibold text-brand-dark shadow-subtle"
                >
                  <Download className="h-4 w-4" />
                  Download form
                </button>
              </div>

              <div className="mt-4 text-xs text-brand-muted">
                Always confirm eligibility and deadlines on the official portal.
              </div>
            </div>

            <div className="rounded-card border border-brand-border bg-brand-bg p-5">
              <div className="text-sm font-semibold text-brand-dark">Next</div>
              <div className="mt-2 space-y-2">
                <Link to={ROUTES.schemes} className="block text-sm font-semibold text-brand-accent hover:underline">
                  Back to Scheme Finder
                </Link>
                <a
                  href={scheme.officialLink}
                  target="_blank"
                  rel="noreferrer"
                  className="block text-sm font-semibold text-brand-accent hover:underline"
                >
                  Open official portal
                </a>
              </div>
            </div>
          </div>
        </div>
      ) : null}
    </div>
  )
}
