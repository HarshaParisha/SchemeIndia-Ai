import { useEffect, useMemo, useRef, useState } from 'react'
import { Link } from 'react-router-dom'
import { MessageCircle, Send, X } from 'lucide-react'

import { Button } from '@/components/ui/button'
import { ROUTES } from '@/lib/constants'
import { scoreScheme } from '@/lib/schemeMatcher'
import { formatSchemeName } from '@/lib/utils'
import type { Scheme } from '@/types/api'

type ChatRole = 'bot' | 'user'

type ChatMessage = {
  id: string
  role: ChatRole
  kind: 'text' | 'chips' | 'scheme'
  text?: string
  chips?: string[]
  schemeId?: string
}

type Answers = {
  userType: any
  state: string
  district: string
  age: number | null
  gender: any
  incomeRange: any
  caste: any
  conditions: any[]
  needs: any[]
}

type QuestionKey = 'userType' | 'state' | 'age' | 'gender' | 'incomeRange' | 'caste'

type Question = {
  key: QuestionKey
  text: string
  options: string[]
}

const QUICK = ['Check eligibility', 'Documents required', 'How to apply', 'Browse schemes'] as const

const QUESTIONS: Question[] = [
  {
    key: 'userType',
    text: 'Which option fits you best?',
    options: ['Farmer', 'Student', 'Salaried', 'Business', 'Daily wage', 'Senior citizen', 'Disabled', 'Woman entrepreneur', 'Unemployed', 'Other'],
  },
  {
    key: 'state',
    text: 'Select your state/UT',
    options: [
      'Andhra Pradesh',
      'Arunachal Pradesh',
      'Assam',
      'Bihar',
      'Chhattisgarh',
      'Goa',
      'Gujarat',
      'Haryana',
      'Himachal Pradesh',
      'Jharkhand',
      'Karnataka',
      'Kerala',
      'Madhya Pradesh',
      'Maharashtra',
      'Manipur',
      'Meghalaya',
      'Mizoram',
      'Nagaland',
      'Odisha',
      'Punjab',
      'Rajasthan',
      'Sikkim',
      'Tamil Nadu',
      'Telangana',
      'Tripura',
      'Uttar Pradesh',
      'Uttarakhand',
      'West Bengal',
      'Andaman and Nicobar Islands',
      'Chandigarh',
      'Dadra and Nagar Haveli and Daman and Diu',
      'Delhi',
      'Jammu and Kashmir',
      'Ladakh',
      'Lakshadweep',
      'Puducherry',
    ],
  },
  { key: 'age', text: 'Select your age group', options: ['<18', '18–24', '25–34', '35–44', '45–59', '60+'] },
  { key: 'gender', text: 'Select gender', options: ['Male', 'Female', 'Other'] },
  { key: 'incomeRange', text: 'Annual income range', options: ['<1L', '1-2.5L', '2.5-5L', '5-8L', '8L+'] },
  { key: 'caste', text: 'Select category', options: ['General', 'OBC', 'SC', 'ST', 'NT', 'EWS'] },
]

function uid() {
  return Math.random().toString(16).slice(2) + Date.now().toString(16)
}

function useMediaQuery(query: string) {
  const [match, setMatch] = useState(false)
  useEffect(() => {
    const m = window.matchMedia(query)
    const onChange = () => setMatch(m.matches)
    onChange()
    m.addEventListener('change', onChange)
    return () => m.removeEventListener('change', onChange)
  }, [query])
  return match
}

function formatAgeRange(minAge?: number | null, maxAge?: number | null) {
  if (typeof minAge === 'number' || typeof maxAge === 'number') return `${minAge ?? '—'} to ${maxAge ?? '—'}`
  return 'Not specified'
}

function formatMaxIncome(maxIncome?: number | null) {
  if (typeof maxIncome === 'number') return `₹${maxIncome.toLocaleString('en-IN')}/year`
  return 'Not specified'
}

function formatEligibilityGender(gender?: string[] | null) {
  if (!gender || gender.length === 0) return 'Any'
  return gender.join(', ')
}

function formatEligibilityCategory(caste?: string[] | null) {
  if (!caste || caste.length === 0) return 'Any'
  return caste.join(', ')
}

function EligibilityGrid({ scheme }: { scheme: Scheme }) {
  const e = scheme.eligibility || {}
  return (
    <div className="grid gap-3 sm:grid-cols-2">
      <div className="rounded-card border border-brand-border bg-brand-bg p-4">
        <div className="text-xs font-semibold text-brand-muted">Age</div>
        <div className="mt-1 text-sm font-semibold text-brand-dark">{formatAgeRange(e.minAge, e.maxAge)}</div>
      </div>
      <div className="rounded-card border border-brand-border bg-brand-bg p-4">
        <div className="text-xs font-semibold text-brand-muted">Max income</div>
        <div className="mt-1 text-sm font-semibold text-brand-dark">{formatMaxIncome(e.maxIncome)}</div>
      </div>
      <div className="rounded-card border border-brand-border bg-brand-bg p-4">
        <div className="text-xs font-semibold text-brand-muted">Gender</div>
        <div className="mt-1 text-sm font-semibold text-brand-dark">{formatEligibilityGender(e.gender)}</div>
      </div>
      <div className="rounded-card border border-brand-border bg-brand-bg p-4">
        <div className="text-xs font-semibold text-brand-muted">Category</div>
        <div className="mt-1 text-sm font-semibold text-brand-dark">{formatEligibilityCategory(e.casteCategory)}</div>
      </div>
    </div>
  )
}

function defaultAnswers(): Answers {
  return {
    userType: null,
    state: 'Andhra Pradesh',
    district: 'NA',
    age: null,
    gender: null,
    incomeRange: null,
    caste: null,
    conditions: [],
    needs: [],
  }
}

function applyAnswer(answers: Answers, q: QuestionKey, v: string): Answers {
  if (q === 'state') return { ...answers, state: v, district: 'NA' }
  if (q === 'age') {
    const mapped: Record<string, number | null> = {
      '<18': 16,
      '18–24': 20,
      '25–34': 29,
      '35–44': 39,
      '45–59': 50,
      '60+': 65,
    }
    return { ...answers, age: mapped[v] ?? null }
  }
  if (q === 'gender') return { ...answers, gender: v }
  if (q === 'incomeRange') return { ...answers, incomeRange: v }
  if (q === 'caste') return { ...answers, caste: v }
  if (q === 'userType') return { ...answers, userType: v }
  return answers
}

function hasEligibilitySignals(s: Scheme) {
  if (s.state) return true
  const e = s.eligibility || {}
  if (typeof e.minAge === 'number') return true
  if (typeof e.maxAge === 'number') return true
  if (typeof e.maxIncome === 'number') return true
  if (Array.isArray(e.gender) && e.gender.length > 0) return true
  if (Array.isArray(e.casteCategory) && e.casteCategory.length > 0) return true
  if (Array.isArray(e.userType) && e.userType.length > 0) return true
  if (Array.isArray(e.states) && e.states.length > 0) return true
  return false
}

export default function SahyogiChat() {
  const [open, setOpen] = useState(false)
  const [messages, setMessages] = useState<ChatMessage[]>([])
  const [input, setInput] = useState('')
  const [flow, setFlow] = useState<'idle' | 'questions'>('idle')
  const [qIndex, setQIndex] = useState(0)
  const [answers, setAnswers] = useState<Answers>(() => defaultAnswers())
  const [schemes, setSchemes] = useState<Scheme[] | null>(null)

  const isMobile = useMediaQuery('(max-width: 640px)')
  const bodyRef = useRef<HTMLDivElement | null>(null)

  const push = (m: Omit<ChatMessage, 'id'>) => setMessages((prev) => [...prev, { ...m, id: uid() }])

  useEffect(() => {
    if (!open) return
    let cancelled = false
    ;(async () => {
      try {
        const mod = await import('@/data/schemes')
        if (!cancelled) setSchemes(mod.SCHEMES as Scheme[])
      } catch {
        if (!cancelled) setSchemes([])
      }
    })()
    return () => {
      cancelled = true
    }
  }, [open])

  useEffect(() => {
    if (!open) return
    if (messages.length > 0) return
    push({
      role: 'bot',
      kind: 'chips',
      text: 'Namaste. I am Sahyogi. I can help you check eligibility and share benefits for schemes available on this website.',
      chips: [...QUICK],
    })
  }, [messages.length, open])

  useEffect(() => {
    if (!open) return
    window.setTimeout(() => {
      const el = bodyRef.current
      if (!el) return
      el.scrollTop = el.scrollHeight
    }, 0)
  }, [messages, open])

  const schemeById = useMemo(() => new Map((schemes || []).map((s) => [s.id, s])), [schemes])

  const startFlow = () => {
    if (!schemes) {
      push({ role: 'bot', kind: 'text', text: 'Loading schemes. Please try again in a moment.' })
      return
    }
    setFlow('questions')
    setQIndex(0)
    setAnswers(defaultAnswers())
    const first = QUESTIONS[0]
    push({ role: 'bot', kind: 'chips', text: first.text, chips: first.options })
  }

  const showDocs = () => {
    push({
      role: 'bot',
      kind: 'text',
      text: 'Common documents: Aadhaar, photo, bank details, address proof. Some schemes may ask income, category, or residence certificates.',
    })
    push({ role: 'bot', kind: 'chips', text: 'Want to check eligibility now?', chips: ['Check eligibility'] })
  }

  const showHowToApply = () => {
    push({
      role: 'bot',
      kind: 'text',
      text: 'Open any scheme, check documents and steps, then use the official link to apply online or visit the nearest CSC/office for help.',
    })
    push({ role: 'bot', kind: 'chips', text: 'Want to check eligibility now?', chips: ['Check eligibility'] })
  }

  const reset = () => {
    setMessages([])
    setFlow('idle')
    setQIndex(0)
    setAnswers(defaultAnswers())
    setInput('')
  }

  const finalize = (a: Answers) => {
    const list = schemes || []
    const eligible = list
      .map((s) => ({ s, score: scoreScheme(s, a as any) }))
      .filter((x) => x.score !== null)
      .map((x) => ({ scheme: x.s, score: x.score as number }))

    const definite = eligible.filter((x) => hasEligibilitySignals(x.scheme))

    definite.sort((a, b) => b.score - a.score)

    if (definite.length === 0) {
      push({
        role: 'bot',
        kind: 'text',
        text: `No matching schemes found for your answers. Here are some schemes you can explore for ${a.state}.`,
      })

      const stateList = list.filter((s) => s.state === a.state).slice(0, 6)
      if (stateList.length > 0) {
        for (const s of stateList) push({ role: 'bot', kind: 'scheme', schemeId: s.id })
      } else {
        const central = list.filter((s) => s.state === null).slice(0, 6)
        for (const s of central) push({ role: 'bot', kind: 'scheme', schemeId: s.id })
      }

      push({ role: 'bot', kind: 'chips', text: 'Want to try again?', chips: ['Restart'] })
      return
    }

    push({ role: 'bot', kind: 'text', text: `Here are schemes you may be eligible for.` })
    for (const x of definite.slice(0, 6)) push({ role: 'bot', kind: 'scheme', schemeId: x.scheme.id })
    push({ role: 'bot', kind: 'chips', text: 'Want to run another check?', chips: ['Restart'] })
  }

  const onChip = (value: string) => {
    if (value === 'Restart') return reset()

    push({ role: 'user', kind: 'text', text: value })

    if (flow === 'idle') {
      if (value === 'Check eligibility') return startFlow()
      if (value === 'Documents required') return showDocs()
      if (value === 'How to apply') return showHowToApply()
      if (value === 'Browse schemes') {
        push({ role: 'bot', kind: 'text', text: 'Browse schemes' })
        return
      }
      return
    }

    const q = QUESTIONS[qIndex]
    const next = applyAnswer(answers, q.key, value)
    setAnswers(next)

    const nextIndex = qIndex + 1
    if (nextIndex >= QUESTIONS.length) {
      setFlow('idle')
      setQIndex(0)
      finalize(next)
      return
    }

    setQIndex(nextIndex)
    const nq = QUESTIONS[nextIndex]
    push({ role: 'bot', kind: 'chips', text: nq.text, chips: nq.options })
  }

  const handleSend = () => {
    const t = input.trim()
    if (!t) return
    setInput('')
    push({ role: 'user', kind: 'text', text: t })

    const low = t.toLowerCase()
    if (/(^|\s)(hi|hello|namaste)(\s|$)/.test(low)) {
      push({ role: 'bot', kind: 'chips', text: 'Hello. Choose an option below.', chips: [...QUICK] })
      return
    }

    push({
      role: 'bot',
      kind: 'chips',
      text: 'To keep results accurate, please use the options below.',
      chips: flow === 'idle' ? [...QUICK] : QUESTIONS[qIndex]?.options || ['Restart'],
    })
  }

  const wrapperClass =
    'fixed z-50 ' +
    (isMobile && open
      ? 'inset-0 flex items-end justify-center p-3'
      : 'bottom-5 right-5 left-5 sm:left-auto flex items-end justify-end')

  const panelClass =
    (isMobile && open
      ? 'w-full h-[calc(100vh-1.5rem)] rounded-[24px]'
      : 'w-[min(380px,calc(100vw-2.5rem))] h-[min(560px,calc(100vh-8rem))] rounded-[22px]') +
    ' overflow-hidden border border-brand-border bg-white shadow-ambient flex flex-col'

  return (
    <div className={wrapperClass}>
      {open ? (
        <div className={panelClass}>
          <div className="flex items-center justify-between border-b border-brand-border bg-white/80 px-4 py-3 backdrop-blur">
            <div className="min-w-0">
              <div className="truncate text-sm font-semibold text-brand-dark">Sahyogi AI</div>
              <div className="truncate text-xs text-brand-muted">Eligibility and benefits</div>
            </div>
            <button
              type="button"
              className="inline-flex h-9 w-9 items-center justify-center rounded-full border border-brand-border bg-white text-brand-dark"
              aria-label="Close"
              onClick={() => setOpen(false)}
            >
              <X className="h-4 w-4" />
            </button>
          </div>

          <div ref={bodyRef} className="flex-1 overflow-auto bg-brand-bg/40 p-3">
            {messages.map((m) => {
              if (m.kind === 'scheme') {
                const s = m.schemeId ? schemeById.get(m.schemeId) : null
                if (!s) return null
                return (
                  <div key={m.id} className="mt-3 rounded-[18px] border border-brand-border bg-white p-4 shadow-subtle">
                    <div className="flex items-start justify-between gap-3">
                      <div className="min-w-0">
                        <div className="text-sm font-semibold text-brand-dark">{formatSchemeName(s.name)}</div>
                        <div className="mt-1 text-xs text-brand-muted">{s.ministry}</div>
                      </div>
                      <div className="shrink-0 rounded-full border border-brand-border bg-brand-bg px-2 py-1 text-[11px] text-brand-muted">
                        {s.state ? 'State' : 'Central'}
                      </div>
                    </div>

                    <div className="mt-3">
                      <div className="text-xs font-semibold text-brand-muted">Benefit</div>
                      <div className="mt-1 text-sm text-brand-dark">{s.benefit}</div>
                    </div>

                    <div className="mt-4">
                      <div className="text-sm font-semibold text-brand-dark">Eligibility</div>
                      <div className="mt-3">
                        <EligibilityGrid scheme={s} />
                      </div>
                    </div>

                    <div className="mt-4">
                      <Button asChild className="h-10 w-full">
                        <Link to={`/schemes/${s.id}`}>Open scheme</Link>
                      </Button>
                    </div>
                  </div>
                )
              }

              if (m.kind === 'chips') {
                return (
                  <div key={m.id} className={m.role === 'user' ? 'mt-2 flex justify-end' : 'mt-2 flex justify-start'}>
                    <div className="max-w-[92%]">
                      <div className="rounded-[16px] border border-brand-border bg-white px-3 py-2 text-sm text-brand-dark shadow-subtle">
                        {m.text || ''}
                      </div>
                      <div className="mt-2 flex flex-wrap gap-2">
                        {m.chips.map((c) => (
                          <button
                            key={c}
                            type="button"
                            className="rounded-full border border-brand-border bg-white px-3 py-2 text-xs font-semibold text-brand-dark shadow-subtle hover:bg-brand-bg"
                            onClick={() => onChip(c)}
                          >
                            {c}
                          </button>
                        ))}
                      </div>
                    </div>
                  </div>
                )
              }

              return (
                <div key={m.id} className={m.role === 'user' ? 'mt-2 flex justify-end' : 'mt-2 flex justify-start'}>
                  <div className="max-w-[85%] rounded-[16px] border border-brand-border bg-white px-3 py-2 text-sm text-brand-dark shadow-subtle">
                    {m.text === 'Browse schemes' ? (
                      <Link to={ROUTES.schemes} className="font-semibold text-brand-accent hover:underline">
                        Browse schemes
                      </Link>
                    ) : (
                      m.text || ''
                    )}
                  </div>
                </div>
              )
            })}
          </div>

          <div className="border-t border-brand-border bg-white p-3">
            <div className="flex items-center gap-2">
              <input
                className="h-11 w-full rounded-full border border-brand-border bg-white px-4 text-sm shadow-subtle"
                placeholder="Type hi or choose options"
                value={input}
                onChange={(e) => setInput(e.target.value)}
                onKeyDown={(e) => {
                  if (e.key === 'Enter') handleSend()
                }}
                aria-label="Message"
              />
              <button
                type="button"
                className="inline-flex h-11 w-11 items-center justify-center rounded-full bg-brand-primary text-white shadow-subtle"
                aria-label="Send"
                onClick={handleSend}
              >
                <Send className="h-4 w-4" />
              </button>
            </div>
          </div>
        </div>
      ) : (
        <button
          type="button"
          className="inline-flex h-14 w-14 items-center justify-center rounded-full bg-brand-primary text-white shadow-ambient"
          aria-label="Open chat"
          onClick={() => setOpen(true)}
        >
          <MessageCircle className="h-6 w-6" />
        </button>
      )}
    </div>
  )
}
