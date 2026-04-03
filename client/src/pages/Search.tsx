import { useEffect, useMemo, useRef, useState } from 'react'
import { Link, useNavigate, useSearchParams } from 'react-router-dom'
import { Search as SearchIcon, X } from 'lucide-react'
import toast from 'react-hot-toast'

import Skeleton from '@/components/shared/Skeleton'
import { Button } from '@/components/ui/button'
import { api } from '@/lib/api'
import { ROUTES } from '@/lib/constants'
import { slugify } from '@/lib/slug'
import { cn, formatSchemeName } from '@/lib/utils'
import { schemesRepo } from '@/lib/schemesRepo'

type SuggestScheme = {
  id: string
  name: string
  slug: string
  governmentLevel: 'central' | 'state'
  state: string | null
}

type SuggestResponse = {
  schemes: SuggestScheme[]
  categories: string[]
  ministries: string[]
}

type ListedScheme = {
  id: string
  name: string
  slug?: string
  governmentLevel?: 'central' | 'state'
  state?: string | null
  ministry?: string
  category?: string
  shortDescription?: string
}

function escapeRegExp(s: string) {
  return s.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')
}

function highlightText(text: string, query: string) {
  const parts = query
    .trim()
    .split(/\s+/)
    .map((x) => x.trim())
    .filter((x) => x.length >= 2)

  if (!parts.length) return text

  const re = new RegExp(`(${parts.map(escapeRegExp).join('|')})`, 'ig')
  const tokens = String(text).split(re)
  return tokens.map((t, i) => {
    const isHit = parts.some((p) => p.toLowerCase() === t.toLowerCase())
    if (!isHit) return <span key={i}>{t}</span>
    return (
      <mark key={i} className="rounded bg-[#FEF9C3] px-1 text-brand-dark">
        {t}
      </mark>
    )
  })
}

function useDebounced<T>(value: T, delayMs: number) {
  const [v, setV] = useState(value)
  useEffect(() => {
    const t = window.setTimeout(() => setV(value), delayMs)
    return () => window.clearTimeout(t)
  }, [value, delayMs])
  return v
}

const RECENT_KEY = 'si_recent_searches'

function readRecentSearches(): string[] {
  try {
    const raw = window.localStorage.getItem(RECENT_KEY)
    return raw ? (JSON.parse(raw) as string[]) : []
  } catch {
    return []
  }
}

function writeRecentSearches(next: string[]) {
  try {
    window.localStorage.setItem(RECENT_KEY, JSON.stringify(next))
  } catch {
    return
  }
}

function pushRecent(q: string) {
  const t = q.trim()
  if (!t) return
  const prev = readRecentSearches()
  const next = [t, ...prev.filter((x) => x !== t)].slice(0, 8)
  writeRecentSearches(next)
}

const POPULAR = ['pm kisan', 'ayushman', 'pm awas', 'ujjwala', 'mudra', 'scholarship']

export default function SearchPage() {
  const navigate = useNavigate()
  const [params, setParams] = useSearchParams()
  const qParam = (params.get('q') || '').trim()

  const [input, setInput] = useState(qParam)
  const debouncedInput = useDebounced(input.trim(), 300)
  const [open, setOpen] = useState(false)
  const [suggestLoading, setSuggestLoading] = useState(false)
  const [suggest, setSuggest] = useState<SuggestResponse>({ schemes: [], categories: [], ministries: [] })
  const [recent, setRecent] = useState<string[]>(() => readRecentSearches())

  const [page, setPage] = useState(1)
  const [loading, setLoading] = useState(false)
  const [items, setItems] = useState<ListedScheme[]>([])
  const [total, setTotal] = useState(0)

  const boxRef = useRef<HTMLDivElement | null>(null)

  useEffect(() => {
    setInput(qParam)
    setPage(1)
  }, [qParam])

  useEffect(() => {
    if (!open) return
    const onDoc = (e: MouseEvent) => {
      const el = boxRef.current
      if (!el) return
      if (!el.contains(e.target as Node)) setOpen(false)
    }
    document.addEventListener('mousedown', onDoc)
    return () => document.removeEventListener('mousedown', onDoc)
  }, [open])

  useEffect(() => {
    const q = debouncedInput
    if (!open) return
    if (!q) {
      setSuggest({ schemes: [], categories: [], ministries: [] })
      return
    }
    let cancelled = false
    ;(async () => {
      try {
        setSuggestLoading(true)
        const r = await api.get('/api/search', { params: { q } })
        const data = (r.data?.data || {}) as SuggestResponse
        if (!cancelled) setSuggest(data)
      } catch {
        if (!cancelled) setSuggest({ schemes: [], categories: [], ministries: [] })
      } finally {
        if (!cancelled) setSuggestLoading(false)
      }
    })()
    return () => {
      cancelled = true
    }
  }, [debouncedInput, open])

  const runSearch = (q: string) => {
    const t = q.trim()
    if (!t) return
    pushRecent(t)
    setRecent(readRecentSearches())
    setParams({ q: t })
    setOpen(false)
  }

  useEffect(() => {
    const q = qParam
    if (!q) {
      setItems([])
      setTotal(0)
      return
    }

    let cancelled = false
    ;(async () => {
      try {
        setLoading(true)
        const pageSize = 12
        const r = await schemesRepo.listSchemes({ q, page, pageSize })
        const mapped: ListedScheme[] = r.items.map((s) => ({
          id: s.id,
          name: s.name,
          slug: s.id,
          governmentLevel: s.state ? 'state' : 'central',
          state: s.state,
          ministry: s.ministry,
          category: s.category,
          shortDescription: s.description,
        }))
        if (!cancelled) {
          setItems(mapped)
          setTotal(r.total)
        }
      } finally {
        if (!cancelled) setLoading(false)
      }
    })()

    return () => {
      cancelled = true
    }
  }, [page, qParam])

  const maxPage = useMemo(() => Math.max(1, Math.ceil(total / 12)), [total])

  const showEmpty = !loading && qParam && items.length === 0

  const suggestionGroups = useMemo(() => {
    const q = debouncedInput
    const recentShown = !q ? recent : []
    const popularShown = !q ? POPULAR : []
    const schemes = q ? suggest.schemes : []
    const categories = q ? suggest.categories : []
    const ministries = q ? suggest.ministries : []
    return { recentShown, popularShown, schemes, categories, ministries }
  }, [debouncedInput, recent, suggest])

  return (
    <div className="space-y-6">
      <div className="rounded-card border border-brand-border bg-white p-6 shadow-subtle">
        <div className="text-[28px] font-semibold tracking-tight text-brand-dark">Search schemes</div>
        <div className="mt-2 text-[16px] text-brand-muted">Type keywords like “pm kisan”, “scholarship”, “solar”, or a ministry.</div>

        <div ref={boxRef} className="relative mt-4">
          <div className="flex items-center gap-2">
            <div className="relative flex-1">
              <SearchIcon className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-brand-muted" />
              <input
                className="h-11 w-full rounded-control border border-brand-border bg-white pl-9 pr-10 text-sm shadow-subtle"
                placeholder="Search schemes, benefits, ministries…"
                value={input}
                onChange={(e) => setInput(e.target.value)}
                onFocus={() => {
                  setOpen(true)
                  setRecent(readRecentSearches())
                }}
                onKeyDown={(e) => {
                  if (e.key === 'Enter') {
                    e.preventDefault()
                    runSearch(input)
                  }
                  if (e.key === 'Escape') setOpen(false)
                }}
                aria-label="Search"
              />
              {input ? (
                <button
                  type="button"
                  className="absolute right-1 top-1/2 inline-flex h-9 w-9 -translate-y-1/2 items-center justify-center rounded-control hover:bg-brand-bg"
                  onClick={() => {
                    setInput('')
                    setOpen(true)
                  }}
                  aria-label="Clear"
                >
                  <X className="h-4 w-4 text-brand-muted" />
                </button>
              ) : null}
            </div>
            <Button
              className="h-11"
              onClick={() => {
                if (!input.trim()) {
                  toast('Type something to search')
                  return
                }
                runSearch(input)
              }}
            >
              Search
            </Button>
          </div>

          {open ? (
            <div className="absolute left-0 right-0 top-[52px] z-30 rounded-card border border-brand-border bg-white shadow-ambient">
              <div className="max-h-72 overflow-auto p-2">
                {!debouncedInput ? (
                  <div className="space-y-3 p-2">
                    {suggestionGroups.recentShown.length ? (
                      <div>
                        <div className="text-xs font-semibold uppercase tracking-wide text-brand-muted">Recent</div>
                        <div className="mt-2 flex flex-wrap gap-2">
                          {suggestionGroups.recentShown.map((r) => (
                            <button
                              key={r}
                              type="button"
                              className="h-9 rounded-full border border-brand-border bg-brand-bg px-3 text-sm text-brand-dark hover:bg-white"
                              onClick={() => runSearch(r)}
                            >
                              {r}
                            </button>
                          ))}
                        </div>
                      </div>
                    ) : null}

                    <div>
                      <div className="text-xs font-semibold uppercase tracking-wide text-brand-muted">Popular</div>
                      <div className="mt-2 flex flex-wrap gap-2">
                        {suggestionGroups.popularShown.map((r) => (
                          <button
                            key={r}
                            type="button"
                            className="h-9 rounded-full border border-brand-border bg-white px-3 text-sm text-brand-dark hover:bg-brand-bg"
                            onClick={() => runSearch(r)}
                          >
                            {r}
                          </button>
                        ))}
                      </div>
                    </div>
                  </div>
                ) : (
                  <div className="space-y-2">
                    <div className="px-2 pt-2 text-xs text-brand-muted">Suggestions</div>
                    {suggestLoading ? <div className="px-2 pb-2 text-sm text-brand-muted">Searching…</div> : null}

                    {suggestionGroups.schemes.map((s) => (
                      <button
                        key={s.id}
                        type="button"
                        className="flex w-full items-start gap-3 rounded-control px-3 py-2 text-left hover:bg-brand-bg"
                        onClick={() => {
                          setOpen(false)
                          navigate(`/schemes/${s.slug || s.id}`)
                        }}
                      >
                        <div
                          className={cn(
                            'mt-0.5 rounded-full border px-2 py-0.5 text-[11px]',
                            s.governmentLevel === 'central' ? 'border-brand-border bg-white text-brand-muted' : 'border-brand-border bg-brand-bg text-brand-muted',
                          )}
                        >
                          {s.governmentLevel === 'central' ? 'Central' : s.state || 'State'}
                        </div>
                        <div className="min-w-0">
                          <div className="truncate text-sm font-medium text-brand-dark">{highlightText(s.name, debouncedInput)}</div>
                          <div className="mt-0.5 truncate text-xs text-brand-muted">Open scheme</div>
                        </div>
                      </button>
                    ))}

                    {suggestionGroups.categories.length ? (
                      <div className="pt-1">
                        <div className="px-2 pt-2 text-xs font-semibold uppercase tracking-wide text-brand-muted">Categories</div>
                        {suggestionGroups.categories.map((c) => (
                          <button
                            key={c}
                            type="button"
                            className="flex w-full items-center justify-between rounded-control px-3 py-2 text-left hover:bg-brand-bg"
                            onClick={() => {
                              setOpen(false)
                              navigate(ROUTES.categoryDetail.replace(':slug', slugify(c)))
                            }}
                          >
                            <div className="text-sm text-brand-dark">{highlightText(c, debouncedInput)}</div>
                            <div className="text-xs text-brand-muted">Open</div>
                          </button>
                        ))}
                      </div>
                    ) : null}

                    {suggestionGroups.ministries.length ? (
                      <div className="pt-1">
                        <div className="px-2 pt-2 text-xs font-semibold uppercase tracking-wide text-brand-muted">Ministries</div>
                        {suggestionGroups.ministries.map((m) => (
                          <button
                            key={m}
                            type="button"
                            className="flex w-full items-center justify-between rounded-control px-3 py-2 text-left hover:bg-brand-bg"
                            onClick={() => runSearch(m)}
                          >
                            <div className="text-sm text-brand-dark">{highlightText(m, debouncedInput)}</div>
                            <div className="text-xs text-brand-muted">Search</div>
                          </button>
                        ))}
                      </div>
                    ) : null}

                    {!suggestLoading && !suggestionGroups.schemes.length && !suggestionGroups.categories.length && !suggestionGroups.ministries.length ? (
                      <div className="px-2 pb-2 text-sm text-brand-muted">No suggestions.</div>
                    ) : null}
                  </div>
                )}
              </div>
            </div>
          ) : null}
        </div>
      </div>

      {qParam ? (
        <div className="rounded-card border border-brand-border bg-white p-6 shadow-subtle">
          <div className="flex flex-wrap items-end justify-between gap-3">
            <div>
              <div className="text-sm font-semibold text-brand-dark">Results for</div>
              <div className="mt-1 text-[20px] font-semibold text-brand-dark">“{qParam}”</div>
              <div className="mt-1 text-sm text-brand-muted">{total.toLocaleString()} matches</div>
            </div>
            <div className="flex items-center gap-2">
              <button
                type="button"
                className="h-11 rounded-control border border-brand-border bg-white px-4 text-sm shadow-subtle hover:bg-brand-bg disabled:opacity-50"
                onClick={() => setPage((p) => Math.max(1, p - 1))}
                disabled={page <= 1}
              >
                Prev
              </button>
              <div className="text-sm text-brand-muted">
                Page {page} / {maxPage}
              </div>
              <button
                type="button"
                className="h-11 rounded-control border border-brand-border bg-white px-4 text-sm shadow-subtle hover:bg-brand-bg disabled:opacity-50"
                onClick={() => setPage((p) => Math.min(maxPage, p + 1))}
                disabled={page >= maxPage}
              >
                Next
              </button>
            </div>
          </div>

          <div className="mt-5 grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
            {loading ? (
              Array.from({ length: 6 }).map((_, i) => <Skeleton key={i} className="h-40" />)
            ) : (
              items.map((s) => {
                const level = s.governmentLevel ? s.governmentLevel : s.state ? 'state' : 'central'
                const label = level === 'central' ? 'Central' : s.state || 'State'
                return (
                  <div key={s.id} className="flex flex-col rounded-card border border-brand-border bg-white p-5 shadow-subtle">
                    <div className="flex items-start justify-between gap-3">
                      <div className="min-w-0">
                        <div className="truncate text-sm font-semibold text-brand-dark">{highlightText(formatSchemeName(s.name), qParam)}</div>
                        {s.ministry ? <div className="mt-1 truncate text-xs text-brand-muted">{highlightText(s.ministry, qParam)}</div> : null}
                      </div>
                      <div className="shrink-0 rounded-full border border-brand-border bg-brand-bg px-2 py-0.5 text-[11px] text-brand-muted">{label}</div>
                    </div>

                    {s.shortDescription ? (
                      <div className="mt-3 text-sm text-brand-muted line-clamp-3">{highlightText(s.shortDescription, qParam)}</div>
                    ) : null}

                    <div className="mt-auto pt-4">
                      <Button asChild className="h-10 w-full">
                        <Link to={`/schemes/${s.slug || s.id}`}>View details</Link>
                      </Button>
                    </div>
                  </div>
                )
              })
            )}
          </div>

          {showEmpty ? <div className="mt-6 text-sm text-brand-muted">No schemes found. Try another keyword.</div> : null}
        </div>
      ) : null}
    </div>
  )
}
