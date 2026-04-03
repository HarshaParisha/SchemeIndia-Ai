import { useEffect, useMemo, useState } from 'react'
import { useForm } from 'react-hook-form'
import { z } from 'zod'
import { zodResolver } from '@hookform/resolvers/zod'
import toast from 'react-hot-toast'
import { Link } from 'react-router-dom'
import { Bookmark, ChevronLeft, ChevronRight, Copy, Filter, Search, Share2 } from 'lucide-react'

import { Button } from '@/components/ui/button'
import Skeleton from '@/components/shared/Skeleton'
import { getDistrictsForState } from '@/data/districts'
import { APP_NAME, IN_STATES, ROUTES } from '@/lib/constants'
import { deriveBenefitAmount, deriveBenefitType, scoreScheme, type BenefitType } from '@/lib/schemeMatcher'
import { mockApi } from '@/lib/mockApi'
import type { Scheme } from '@/types/api'
import { formatSchemeName } from '@/lib/utils'
import {
  type Caste,
  type Condition,
  type Gender,
  type IncomeRange,
  type Need,
  type UserType,
  useSchemeFinderStore,
} from '@/store/useSchemeFinderStore'

const USER_TYPES: UserType[] = [
  'Farmer',
  'Student',
  'Salaried',
  'Business',
  'Daily wage',
  'Senior citizen',
  'Disabled',
  'Woman entrepreneur',
  'Unemployed',
  'Other',
]

const GENDERS: Gender[] = ['Male', 'Female', 'Other']

const INCOME_RANGES: IncomeRange[] = ['<1L', '1-2.5L', '2.5-5L', '5-8L', '8L+']

const CASTES: Caste[] = ['General', 'OBC', 'SC', 'ST', 'NT', 'EWS']

const CONDITIONS: Condition[] = [
  'Land ownership',
  'Ration card',
  'Student',
  'Disability',
  'Woman head',
  'Business owner',
  'Worker',
  'No income',
  'House ownership',
  'Jan Dhan',
  'Insurance',
  'KCC',
]

const NEEDS: Need[] = [
  'Financial help',
  'Housing',
  'Education',
  'Health',
  'Farming',
  'Business',
  'Solar',
  'Jobs',
  'Food',
  'Pension',
  'Women',
  'All',
]

const schema = z.object({
  userType: z.custom<UserType | null>().nullable(),
  state: z.string().min(2, 'Select your state'),
  district: z.string().min(1, 'Select your district'),
  age: z.coerce.number().min(0).max(120).nullable(),
  gender: z.custom<Gender | null>().nullable(),
  incomeRange: z.custom<IncomeRange | null>().nullable(),
  caste: z.custom<Caste | null>().nullable(),
  conditions: z.array(z.custom<Condition>()).default([]),
  needs: z.array(z.custom<Need>()).default([]),
})

type Values = z.infer<typeof schema>

function clamp(n: number, a: number, b: number) {
  return Math.max(a, Math.min(b, n))
}

function useDebounced<T>(value: T, delayMs: number) {
  const [v, setV] = useState(value)
  useEffect(() => {
    const t = window.setTimeout(() => setV(value), delayMs)
    return () => window.clearTimeout(t)
  }, [value, delayMs])
  return v
}

const steps = [
  { title: 'User type', desc: 'Choose what best describes you' },
  { title: 'Location', desc: 'State and district (for state schemes)' },
  { title: 'Personal details', desc: 'Age, gender, income, caste category' },
  { title: 'Conditions', desc: 'Select any that apply' },
  { title: 'Needs', desc: 'What do you need help with?' },
] as const

export default function SchemesPage() {
  const step = useSchemeFinderStore((s) => s.step)
  const setStep = useSchemeFinderStore((s) => s.setStep)
  const storeAnswers = useSchemeFinderStore((s) => s.answers)
  const setAnswer = useSchemeFinderStore((s) => s.setAnswer)
  const toggleCondition = useSchemeFinderStore((s) => s.toggleCondition)
  const toggleNeed = useSchemeFinderStore((s) => s.toggleNeed)
  const filters = useSchemeFinderStore((s) => s.filters)
  const setFilter = useSchemeFinderStore((s) => s.setFilter)

  const [loadingSaved, setLoadingSaved] = useState(true)
  const [savedIds, setSavedIds] = useState<Set<string>>(new Set())
  const [filterOpen, setFilterOpen] = useState(false)
  const [allSchemes, setAllSchemes] = useState<Scheme[] | null>(null)

  const form = useForm<Values>({
    resolver: zodResolver(schema),
    defaultValues: storeAnswers as any,
    mode: 'onChange',
  })

  useEffect(() => {
    form.reset(storeAnswers as any)
  }, [])

  useEffect(() => {
    let cancelled = false
    ;(async () => {
      try {
        const mod = await import('@/data/schemes')
        if (!cancelled) setAllSchemes(mod.SCHEMES as Scheme[])
      } catch {
        if (!cancelled) setAllSchemes([])
      }
    })()
    return () => {
      cancelled = true
    }
  }, [])

  useEffect(() => {
    ;(async () => {
      try {
        const saved = await mockApi.listSavedSchemes()
        setSavedIds(new Set(saved.map((s) => s.schemeId)))
      } finally {
        setLoadingSaved(false)
      }
    })()
  }, [])

  const values = form.watch()
  const debouncedQ = useDebounced(filters.q, 300)

  useEffect(() => {
    const t = debouncedQ.trim()
    if (!t) return
    const key = 'si_search_history'
    const raw = window.localStorage.getItem(key)
    const prev = raw ? (JSON.parse(raw) as string[]) : []
    const next = [t, ...prev.filter((x) => x !== t)].slice(0, 8)
    window.localStorage.setItem(key, JSON.stringify(next))
  }, [debouncedQ])

  const districts = useMemo(() => getDistrictsForState(values.state || ''), [values.state])

  const computed = useMemo(() => {
    const source = allSchemes || []
    const list: Array<{ scheme: Scheme; score: number; benefitType: BenefitType; benefitAmount: number }> = []
    for (const s of source) {
      const sc = scoreScheme(s, values as any)
      if (sc === null) continue
      list.push({ scheme: s, score: sc, benefitType: deriveBenefitType(s.benefit), benefitAmount: deriveBenefitAmount(s.benefit) })
    }

    const centralAll = list.filter((x) => x.scheme.state === null)
    const stateAll = list.filter((x) => x.scheme.state !== null && (!values.state || x.scheme.state === values.state))
    return { all: list, centralAll, stateAll }
  }, [allSchemes, values])

  const ministries = useMemo(() => {
    const set = new Set<string>()
    for (const x of computed.all) set.add(x.scheme.ministry)
    return Array.from(set).sort((a, b) => a.localeCompare(b))
  }, [computed.all])

  const results = useMemo(() => {
    const q = debouncedQ.trim().toLowerCase()
    const base = filters.tab === 'central' ? computed.centralAll : computed.stateAll
    let list = base

    if (filters.category) list = list.filter((x) => x.scheme.category === filters.category)
    if (filters.benefitType) list = list.filter((x) => x.benefitType === filters.benefitType)
    if (filters.ministry) list = list.filter((x) => x.scheme.ministry === filters.ministry)

    if (q) {
      list = list.filter((x) => {
        const s = x.scheme
        return (
          s.name.toLowerCase().includes(q) ||
          s.ministry.toLowerCase().includes(q) ||
          s.category.toLowerCase().includes(q) ||
          (s.state ? s.state.toLowerCase().includes(q) : false)
        )
      })
    }

    if (filters.sort === 'relevant') list = list.slice().sort((a, b) => b.score - a.score)
    if (filters.sort === 'newest')
      list = list.slice().sort((a, b) => String(b.scheme.updatedAt || '').localeCompare(String(a.scheme.updatedAt || '')))
    if (filters.sort === 'highest_benefit') list = list.slice().sort((a, b) => b.benefitAmount - a.benefitAmount)

    return list
  }, [computed.centralAll, computed.stateAll, debouncedQ, filters])

  const goNext = async () => {
    const ok = step === 1 ? await form.trigger(['state', 'district']) : true
    if (!ok) return
    const nextStep = clamp(step + 1, 0, steps.length - 1)
    setStep(nextStep)
    const v = form.getValues()
    ;(Object.keys(v) as Array<keyof Values>).forEach((k) => setAnswer(k as any, (v as any)[k]))
  }

  const goPrev = () => setStep(clamp(step - 1, 0, steps.length - 1))

  const onSave = async (id: string) => {
    try {
      await mockApi.saveScheme(id)
      setSavedIds((prev) => new Set([...prev, id]))
      toast.success('Saved')
    } catch {
      toast.error('Could not save')
    }
  }

  const onShare = async (id: string) => {
    const url = `${window.location.origin}/schemes/${id}`
    try {
      const nav: any = navigator
      if (nav.share) {
        await nav.share({ title: APP_NAME, url })
        return
      }
      await navigator.clipboard.writeText(url)
      toast.success('Link copied')
    } catch {
      toast.error('Could not share')
    }
  }

  const onCopy = async (id: string) => {
    const url = `${window.location.origin}/schemes/${id}`
    try {
      await navigator.clipboard.writeText(url)
      toast.success('Copied')
    } catch {
      toast.error('Could not copy')
    }
  }

  const filtersUI = (
    <div className="space-y-4">
      <div>
        <div className="text-sm font-semibold text-brand-dark">Category</div>
        <select
          className="mt-2 h-11 w-full rounded-control border border-brand-border bg-white px-3 text-sm shadow-subtle"
          value={filters.category}
          onChange={(e) => setFilter('category', e.target.value)}
        >
          <option value="">All</option>
          {Array.from(new Set((allSchemes || []).map((s) => s.category)))
            .sort((a, b) => a.localeCompare(b))
            .map((c) => (
              <option key={c} value={c}>
                {c}
              </option>
            ))}
        </select>
      </div>

      <div>
        <div className="text-sm font-semibold text-brand-dark">Benefit type</div>
        <select
          className="mt-2 h-11 w-full rounded-control border border-brand-border bg-white px-3 text-sm shadow-subtle"
          value={filters.benefitType}
          onChange={(e) => setFilter('benefitType', e.target.value)}
        >
          <option value="">All</option>
          {(['Cash', 'Loan', 'Subsidy', 'Insurance', 'Scholarship', 'Food', 'Service'] as BenefitType[]).map((b) => (
            <option key={b} value={b}>
              {b}
            </option>
          ))}
        </select>
      </div>

      <div>
        <div className="text-sm font-semibold text-brand-dark">Ministry</div>
        <select
          className="mt-2 h-11 w-full rounded-control border border-brand-border bg-white px-3 text-sm shadow-subtle"
          value={filters.ministry}
          onChange={(e) => setFilter('ministry', e.target.value)}
        >
          <option value="">All</option>
          {ministries.map((m) => (
            <option key={m} value={m}>
              {m}
            </option>
          ))}
        </select>
      </div>

      <div>
        <div className="text-sm font-semibold text-brand-dark">Sort</div>
        <select
          className="mt-2 h-11 w-full rounded-control border border-brand-border bg-white px-3 text-sm shadow-subtle"
          value={filters.sort}
          onChange={(e) => setFilter('sort', e.target.value as any)}
        >
          <option value="relevant">Relevant</option>
          <option value="newest">Newest</option>
          <option value="highest_benefit">Highest benefit</option>
        </select>
      </div>

      <button
        type="button"
        className="h-11 w-full rounded-control border border-brand-border bg-brand-bg text-sm font-semibold text-brand-dark shadow-subtle hover:bg-white"
        onClick={() => {
          setFilter('category', '')
          setFilter('benefitType', '')
          setFilter('ministry', '')
          setFilter('sort', 'relevant')
        }}
      >
        Reset filters
      </button>
    </div>
  )

  return (
    <div className="space-y-6">
      <div className="rounded-card border border-brand-border bg-white p-6 shadow-subtle">
        <div className="flex flex-wrap items-start justify-between gap-4">
          <div>
            <div className="text-[28px] font-semibold tracking-tight text-brand-dark">Scheme Finder</div>
            <div className="mt-2 text-[16px] text-brand-muted">User answers questions. System matches schemes. Clear results with filters.</div>
          </div>
          <div className="flex gap-2">
            <Button asChild variant="ghost">
              <Link to={ROUTES.states}>Browse states</Link>
            </Button>
          </div>
        </div>
      </div>

      <div className="grid gap-4 lg:grid-cols-[420px_1fr]">
        <div className="rounded-card border border-brand-border bg-white p-6 shadow-subtle">
          <div className="flex items-center justify-between gap-3">
            <div>
              <div className="text-xs font-semibold text-brand-muted">Step {step + 1} of {steps.length}</div>
              <div className="mt-1 text-[20px] font-semibold text-brand-dark">{steps[step].title}</div>
              <div className="mt-1 text-sm text-brand-muted">{steps[step].desc}</div>
            </div>
            <div className="flex gap-2">
              <button
                type="button"
                className="inline-flex h-10 w-10 items-center justify-center rounded-control border border-brand-border bg-white shadow-subtle hover:bg-brand-bg disabled:opacity-50"
                disabled={step <= 0}
                onClick={goPrev}
                aria-label="Previous"
              >
                <ChevronLeft className="h-4 w-4" />
              </button>
              <button
                type="button"
                className="inline-flex h-10 w-10 items-center justify-center rounded-control border border-brand-border bg-white shadow-subtle hover:bg-brand-bg disabled:opacity-50"
                disabled={step >= steps.length - 1}
                onClick={goNext}
                aria-label="Next"
              >
                <ChevronRight className="h-4 w-4" />
              </button>
            </div>
          </div>

          <div className="mt-5 space-y-4">
            {step === 0 ? (
              <div className="grid gap-2">
                <div className="text-sm font-semibold text-brand-dark">Select user type</div>
                <div className="grid gap-2 sm:grid-cols-2">
                  {USER_TYPES.map((t) => (
                    <button
                      key={t}
                      type="button"
                      onClick={() => {
                        form.setValue('userType', t)
                        setAnswer('userType', t)
                      }}
                      className={
                        'h-11 rounded-control border px-3 text-left text-sm shadow-subtle ' +
                        (form.watch('userType') === t ? 'border-brand-primary bg-brand-bg' : 'border-brand-border bg-white hover:bg-brand-bg')
                      }
                    >
                      {t}
                    </button>
                  ))}
                </div>
                <div className="text-xs text-brand-muted">Optional. If unsure, choose “Other”.</div>
              </div>
            ) : null}

            {step === 1 ? (
              <div className="space-y-3">
                <div>
                  <div className="text-sm font-semibold text-brand-dark">State</div>
                  <select
                    className="mt-2 h-11 w-full rounded-control border border-brand-border bg-white px-3 text-sm shadow-subtle"
                    value={form.watch('state')}
                    onChange={(e) => {
                      form.setValue('state', e.target.value, { shouldValidate: true })
                      form.setValue('district', '', { shouldValidate: true })
                      setAnswer('state', e.target.value)
                      setAnswer('district', '')
                    }}
                  >
                    <option value="">Select</option>
                    {IN_STATES.map((s) => (
                      <option key={s} value={s}>
                        {s}
                      </option>
                    ))}
                  </select>
                  {form.formState.errors.state?.message ? (
                    <div className="mt-2 text-sm text-brand-warning">{String(form.formState.errors.state.message)}</div>
                  ) : null}
                </div>

                <div>
                  <div className="text-sm font-semibold text-brand-dark">District</div>
                  <select
                    className="mt-2 h-11 w-full rounded-control border border-brand-border bg-white px-3 text-sm shadow-subtle"
                    value={form.watch('district')}
                    onChange={(e) => {
                      form.setValue('district', e.target.value, { shouldValidate: true })
                      setAnswer('district', e.target.value)
                    }}
                    disabled={!form.watch('state')}
                  >
                    <option value="">Select</option>
                    {districts.map((d) => (
                      <option key={d} value={d}>
                        {d}
                      </option>
                    ))}
                  </select>
                  {form.formState.errors.district?.message ? (
                    <div className="mt-2 text-sm text-brand-warning">{String(form.formState.errors.district.message)}</div>
                  ) : null}
                  <div className="mt-2 text-xs text-brand-muted">District helps us show state schemes correctly.</div>
                </div>
              </div>
            ) : null}

            {step === 2 ? (
              <div className="grid gap-3">
                <div className="grid gap-3 sm:grid-cols-2">
                  <div>
                    <div className="text-sm font-semibold text-brand-dark">Age</div>
                    <input
                      className="mt-2 h-11 w-full rounded-control border border-brand-border bg-white px-3 text-sm shadow-subtle"
                      inputMode="numeric"
                      placeholder="e.g. 28"
                      value={form.watch('age') ?? ''}
                      onChange={(e) => {
                        const v = e.target.value ? Number(e.target.value) : null
                        form.setValue('age', v as any)
                        setAnswer('age', v)
                      }}
                    />
                  </div>
                  <div>
                    <div className="text-sm font-semibold text-brand-dark">Gender</div>
                    <select
                      className="mt-2 h-11 w-full rounded-control border border-brand-border bg-white px-3 text-sm shadow-subtle"
                      value={form.watch('gender') || ''}
                      onChange={(e) => {
                        const v = (e.target.value || null) as any
                        form.setValue('gender', v)
                        setAnswer('gender', v)
                      }}
                    >
                      <option value="">Select</option>
                      {GENDERS.map((g) => (
                        <option key={g} value={g}>
                          {g}
                        </option>
                      ))}
                    </select>
                  </div>
                </div>

                <div className="grid gap-3 sm:grid-cols-2">
                  <div>
                    <div className="text-sm font-semibold text-brand-dark">Income range (yearly)</div>
                    <select
                      className="mt-2 h-11 w-full rounded-control border border-brand-border bg-white px-3 text-sm shadow-subtle"
                      value={form.watch('incomeRange') || ''}
                      onChange={(e) => {
                        const v = (e.target.value || null) as any
                        form.setValue('incomeRange', v)
                        setAnswer('incomeRange', v)
                      }}
                    >
                      <option value="">Select</option>
                      {INCOME_RANGES.map((r) => (
                        <option key={r} value={r}>
                          {r}
                        </option>
                      ))}
                    </select>
                  </div>
                  <div>
                    <div className="text-sm font-semibold text-brand-dark">Caste</div>
                    <select
                      className="mt-2 h-11 w-full rounded-control border border-brand-border bg-white px-3 text-sm shadow-subtle"
                      value={form.watch('caste') || ''}
                      onChange={(e) => {
                        const v = (e.target.value || null) as any
                        form.setValue('caste', v)
                        setAnswer('caste', v)
                      }}
                    >
                      <option value="">Select</option>
                      {CASTES.map((c) => (
                        <option key={c} value={c}>
                          {c}
                        </option>
                      ))}
                    </select>
                  </div>
                </div>
              </div>
            ) : null}

            {step === 3 ? (
              <div>
                <div className="text-sm font-semibold text-brand-dark">Conditions (multi-select)</div>
                <div className="mt-3 grid gap-2 sm:grid-cols-2">
                  {CONDITIONS.map((c) => {
                    const selected = (form.watch('conditions') || []).includes(c as any)
                    return (
                      <button
                        key={c}
                        type="button"
                        onClick={() => {
                          toggleCondition(c)
                          const next = new Set(form.watch('conditions') || [])
                          if (next.has(c as any)) next.delete(c as any)
                          else next.add(c as any)
                          form.setValue('conditions', Array.from(next) as any)
                        }}
                        className={
                          'h-11 rounded-control border px-3 text-left text-sm shadow-subtle ' +
                          (selected ? 'border-brand-primary bg-brand-bg' : 'border-brand-border bg-white hover:bg-brand-bg')
                        }
                      >
                        {c}
                      </button>
                    )
                  })}
                </div>
              </div>
            ) : null}

            {step === 4 ? (
              <div>
                <div className="text-sm font-semibold text-brand-dark">Needs</div>
                <div className="mt-3 grid gap-2 sm:grid-cols-2">
                  {NEEDS.map((c) => {
                    const selected = (form.watch('needs') || []).includes(c as any)
                    return (
                      <button
                        key={c}
                        type="button"
                        onClick={() => {
                          toggleNeed(c)
                          const current = new Set(form.watch('needs') || [])
                          if (c === 'All') {
                            const next = current.has('All') ? [] : ['All']
                            form.setValue('needs', next as any)
                            return
                          }
                          current.delete('All')
                          if (current.has(c as any)) current.delete(c as any)
                          else current.add(c as any)
                          form.setValue('needs', Array.from(current) as any)
                        }}
                        className={
                          'h-11 rounded-control border px-3 text-left text-sm shadow-subtle ' +
                          (selected ? 'border-brand-primary bg-brand-bg' : 'border-brand-border bg-white hover:bg-brand-bg')
                        }
                      >
                        {c}
                      </button>
                    )
                  })}
                </div>
              </div>
            ) : null}
          </div>

          <div className="mt-6 rounded-card border border-brand-border bg-brand-bg p-4">
            <div className="text-xs font-semibold text-brand-muted">Your answers</div>
            <div className="mt-2 grid gap-2 text-sm text-brand-dark">
              <div>
                State: {values.state || '—'}
                {values.district ? ` • ${values.district}` : ''}
              </div>
              <div>User type: {values.userType || '—'}</div>
              <div>Age: {typeof values.age === 'number' ? values.age : '—'}</div>
              <div>Gender: {values.gender || '—'}</div>
              <div>Income: {values.incomeRange || '—'}</div>
              <div>Caste: {values.caste || '—'}</div>
            </div>
          </div>
        </div>

        <div className="space-y-4">
          <div className="rounded-card border border-brand-border bg-white p-5 shadow-subtle">
            <div className="flex flex-wrap items-center justify-between gap-3">
              <div className="flex items-center gap-2 rounded-control border border-brand-border bg-brand-bg px-3 py-2">
                <Search className="h-4 w-4 text-brand-muted" />
                <input
                  className="h-8 w-[220px] bg-transparent text-sm outline-none sm:w-[320px]"
                  value={filters.q}
                  onChange={(e) => setFilter('q', e.target.value)}
                  placeholder="Search schemes"
                  aria-label="Search schemes"
                />
              </div>

              <div className="flex flex-wrap items-center gap-2">
                <button
                  type="button"
                  className={
                    'h-10 rounded-control border px-4 text-sm font-semibold shadow-subtle ' +
                    (filters.tab === 'central' ? 'border-brand-primary bg-brand-bg' : 'border-brand-border bg-white hover:bg-brand-bg')
                  }
                  onClick={() => setFilter('tab', 'central')}
                >
                  Central Schemes
                </button>
                <button
                  type="button"
                  className={
                    'h-10 rounded-control border px-4 text-sm font-semibold shadow-subtle ' +
                    (filters.tab === 'state' ? 'border-brand-primary bg-brand-bg' : 'border-brand-border bg-white hover:bg-brand-bg')
                  }
                  onClick={() => setFilter('tab', 'state')}
                >
                  State Schemes
                </button>

                <button
                  type="button"
                  className="inline-flex h-10 items-center gap-2 rounded-control border border-brand-border bg-white px-4 text-sm font-semibold shadow-subtle hover:bg-brand-bg"
                  onClick={() => setFilterOpen((v) => !v)}
                >
                  <Filter className="h-4 w-4" />
                  Filters
                </button>
              </div>
            </div>

            {filterOpen ? <div className="mt-5 border-t border-brand-border pt-5">{filtersUI}</div> : null}
          </div>

          <div className="rounded-card border border-brand-border bg-white p-5 shadow-subtle">
            <div className="flex items-center justify-between gap-3">
              <div>
                <div className="text-[20px] font-semibold text-brand-dark">Results</div>
                <div className="mt-1 text-sm text-brand-muted">
                  {filters.tab === 'central'
                    ? `${computed.centralAll.length.toLocaleString()} Central Schemes Found`
                    : `${computed.stateAll.length.toLocaleString()} State Schemes Found`}
                </div>
              </div>
            </div>

            {loadingSaved ? (
              <div className="mt-4 grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
                {Array.from({ length: 6 }).map((_, i) => (
                  <Skeleton key={i} className="h-44" />
                ))}
              </div>
            ) : results.length === 0 ? (
              <div className="mt-5 rounded-card border border-brand-border bg-brand-bg p-5">
                <div className="text-sm font-semibold text-brand-dark">No matches yet</div>
                <div className="mt-2 text-sm text-brand-muted">Complete the 5 steps to improve accuracy. State + income range usually helps a lot.</div>
              </div>
            ) : (
              <div className="mt-4 grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
                {results.slice(0, 24).map((x) => (
                  <div key={x.scheme.id} className="rounded-card border border-brand-border bg-white p-4 shadow-subtle">
                    <div className="flex items-start justify-between gap-3">
                      <div>
                        <div className="text-sm font-semibold text-brand-dark">{formatSchemeName(x.scheme.name)}</div>
                        <div className="mt-1 text-xs text-brand-muted">{x.scheme.ministry}</div>
                        <div className="mt-2 flex flex-wrap gap-2">
                          <span className="rounded-full border border-brand-border bg-brand-bg px-2 py-1 text-xs text-brand-muted">{x.scheme.category}</span>
                          <span className="rounded-full border border-brand-border bg-brand-bg px-2 py-1 text-xs text-brand-muted">{x.benefitType}</span>
                        </div>
                      </div>
                      <div className="rounded-full border border-brand-border bg-brand-bg px-2 py-1 text-xs text-brand-muted">
                        {x.scheme.state ? 'State' : 'Central'}
                      </div>
                    </div>

                    <div className="mt-3 text-sm text-brand-muted line-clamp-3">{x.scheme.benefit}</div>

                    <div className="mt-4">
                      <div className="flex items-center justify-between text-xs text-brand-muted">
                        <span>Match score</span>
                        <span className="font-semibold text-brand-dark">{x.score}%</span>
                      </div>
                      <div className="mt-2 h-2 w-full rounded-full bg-brand-border">
                        <div className="h-2 rounded-full bg-brand-primary" style={{ width: `${x.score}%` }} />
                      </div>
                    </div>

                    <div className="mt-4 flex gap-2">
                      <Button asChild className="flex-1">
                        <Link to={`/schemes/${x.scheme.id}`}>View</Link>
                      </Button>

                      <button
                        type="button"
                        className="inline-flex h-11 w-11 items-center justify-center rounded-control border border-brand-border bg-white shadow-subtle hover:bg-brand-bg"
                        onClick={() => onSave(x.scheme.id)}
                        aria-label="Save"
                      >
                        <Bookmark className={savedIds.has(x.scheme.id) ? 'h-4 w-4 text-brand-primary' : 'h-4 w-4'} />
                      </button>

                      <button
                        type="button"
                        className="inline-flex h-11 w-11 items-center justify-center rounded-control border border-brand-border bg-white shadow-subtle hover:bg-brand-bg"
                        onClick={() => onShare(x.scheme.id)}
                        aria-label="Share"
                      >
                        <Share2 className="h-4 w-4" />
                      </button>

                      <button
                        type="button"
                        className="inline-flex h-11 w-11 items-center justify-center rounded-control border border-brand-border bg-white shadow-subtle hover:bg-brand-bg"
                        onClick={() => onCopy(x.scheme.id)}
                        aria-label="Copy link"
                      >
                        <Copy className="h-4 w-4" />
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            )}

            <div className="mt-5 rounded-card border border-brand-border bg-brand-bg p-4 text-xs text-brand-muted">
              Note: This is a discovery tool. Always confirm the latest eligibility and dates on the official portal before applying.
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}
