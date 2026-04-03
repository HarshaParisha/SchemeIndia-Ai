import { useEffect, useMemo, useRef, useState } from 'react'
import { Link, NavLink, useLocation, useNavigate } from 'react-router-dom'
import { Menu, Search, X, Leaf } from 'lucide-react'

import { APP_NAME, APP_TAGLINE, ROUTES } from '@/lib/constants'
import { cn } from '@/lib/utils'

export default function Navbar() {
  const [open, setOpen] = useState(false)
  const [searchOpen, setSearchOpen] = useState(false)
  const [searchValue, setSearchValue] = useState('')
  const searchWrapRef = useRef<HTMLDivElement | null>(null)
  const searchInputRef = useRef<HTMLInputElement | null>(null)
  const location = useLocation()
  const navigate = useNavigate()

  useEffect(() => {
    setOpen(false)
    setSearchOpen(false)
  }, [location.pathname])

  useEffect(() => {
    if (!open && !searchOpen) return
    const onKeyDown = (e: KeyboardEvent) => {
      if (e.key !== 'Escape') return
      setOpen(false)
      setSearchOpen(false)
    }
    window.addEventListener('keydown', onKeyDown)
    return () => window.removeEventListener('keydown', onKeyDown)
  }, [open, searchOpen])

  useEffect(() => {
    if (!searchOpen) return
    const onDoc = (e: MouseEvent) => {
      const el = searchWrapRef.current
      if (!el) return
      if (!el.contains(e.target as Node)) setSearchOpen(false)
    }
    document.addEventListener('mousedown', onDoc)
    return () => document.removeEventListener('mousedown', onDoc)
  }, [searchOpen])

  const links = useMemo(
    () => [
      { label: 'Home', to: ROUTES.landing },
      { label: 'Browse Schemes', to: ROUTES.schemes },
      { label: 'States', to: ROUTES.states },
      { label: 'Categories', to: ROUTES.categories },
      { label: 'About', to: ROUTES.about },
    ],
    [],
  )

  const quickSearch = useMemo(
    () => [
      { label: 'PM Kisan', to: '/schemes/pm-kisan', desc: 'Income support for eligible farmers' },
      { label: 'Ayushman Bharat (PM-JAY)', to: '/schemes/pmjay', desc: 'Health cover up to ₹5 lakh' },
      { label: 'PM Awas (Urban)', to: '/schemes/pm-awas-urban', desc: 'Housing assistance for eligible households' },
      { label: 'PM MUDRA', to: '/schemes/mudra', desc: 'Business loans for micro enterprises' },
    ],
    [],
  )

  const submitSearch = (q: string) => {
    const t = q.trim()
    if (!t) return
    setSearchOpen(false)
    navigate(`${ROUTES.search}?q=${encodeURIComponent(t)}`)
  }

  return (
    <header className="sticky top-0 z-40">
      <div className="mx-auto max-w-6xl px-4 pt-3">
        <div className="flex h-14 items-center justify-between rounded-full border border-brand-border bg-white/70 px-3 shadow-subtle backdrop-blur">
        <Link to={ROUTES.landing} className="flex items-center gap-2">
          <div className="flex h-10 w-10 items-center justify-center rounded-control bg-brand-primary text-white shadow-subtle">
            <Leaf className="h-5 w-5" aria-hidden="true" />
          </div>
          <div className="leading-none">
            <div className="font-display text-base font-semibold tracking-tight text-brand-dark">{APP_NAME}</div>
            <div className="mt-0.5 hidden text-[11px] text-brand-muted sm:block">{APP_TAGLINE}</div>
          </div>
        </Link>

        <nav className="hidden items-center gap-1 md:flex">
          {links.map((l) => (
            <NavLink
              key={l.label}
              to={l.to}
              className={({ isActive }) =>
                cn(
                  'rounded-full px-3 py-2 text-sm text-brand-dark hover:bg-brand-bg/70',
                  isActive && 'bg-brand-bg/70',
                )
              }
            >
              {l.label}
            </NavLink>
          ))}
        </nav>

        <div className="flex items-center gap-2">
          <div ref={searchWrapRef} className="relative">
            <button
              type="button"
              className="inline-flex h-11 w-11 items-center justify-center rounded-full border border-brand-border bg-white/70 shadow-subtle hover:bg-brand-bg/70"
              aria-label="Search"
              aria-expanded={searchOpen}
              aria-controls="nav-search-panel"
              onClick={() => {
                setSearchOpen((v) => !v)
                window.setTimeout(() => searchInputRef.current?.focus(), 0)
              }}
            >
              <Search className="h-5 w-5 text-brand-dark" />
            </button>

            {searchOpen ? (
              <div
                id="nav-search-panel"
                className="absolute right-0 top-full mt-2 w-[min(420px,calc(100vw-2rem))] rounded-[20px] border border-brand-border bg-white/90 p-3 shadow-subtle backdrop-blur"
                role="dialog"
                aria-label="Search"
              >
                <div className="relative">
                  <Search className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-brand-muted" />
                  <input
                    ref={searchInputRef}
                    value={searchValue}
                    onChange={(e) => setSearchValue(e.target.value)}
                    onKeyDown={(e) => {
                      if (e.key === 'Enter') submitSearch(searchValue)
                      if (e.key === 'Escape') setSearchOpen(false)
                    }}
                    className="h-11 w-full rounded-full border border-brand-border bg-white pl-9 pr-10 text-sm shadow-subtle"
                    placeholder="Search schemes, categories, states…"
                    aria-label="Search"
                  />
                  {searchValue.trim() ? (
                    <button
                      type="button"
                      className="absolute right-2 top-1/2 inline-flex h-7 w-7 -translate-y-1/2 items-center justify-center rounded-full border border-brand-border bg-white text-brand-muted"
                      aria-label="Clear"
                      onClick={() => setSearchValue('')}
                    >
                      <X className="h-4 w-4" />
                    </button>
                  ) : null}
                </div>

                <div className="mt-3 grid gap-2">
                  {searchValue.trim() ? (
                    <button
                      type="button"
                      className="flex w-full items-center justify-between rounded-[16px] border border-brand-border bg-white px-4 py-3 text-left shadow-subtle hover:bg-brand-bg"
                      onClick={() => submitSearch(searchValue)}
                    >
                      <div>
                        <div className="text-sm font-semibold text-brand-dark">Search for “{searchValue.trim()}”</div>
                        <div className="mt-0.5 text-xs text-brand-muted">See all results available on SchemeIndia</div>
                      </div>
                      <div className="text-xs font-semibold text-brand-accent">Enter</div>
                    </button>
                  ) : (
                    <div className="rounded-[16px] border border-brand-border bg-brand-bg/60 px-4 py-3">
                      <div className="text-xs font-semibold text-brand-muted">Popular</div>
                      <div className="mt-2 grid gap-2">
                        {quickSearch.map((x) => (
                          <Link
                            key={x.to}
                            to={x.to}
                            className="rounded-[14px] border border-brand-border bg-white px-4 py-3 shadow-subtle hover:bg-brand-bg"
                            onClick={() => {
                              setSearchOpen(false)
                              setSearchValue('')
                            }}
                          >
                            <div className="text-sm font-semibold text-brand-dark">{x.label}</div>
                            <div className="mt-0.5 text-xs text-brand-muted">{x.desc}</div>
                          </Link>
                        ))}
                      </div>
                    </div>
                  )}
                </div>
              </div>
            ) : null}
          </div>
          <Link
            to={ROUTES.schemes}
            className="hidden h-10 items-center rounded-full bg-brand-primary px-4 text-sm font-medium text-white shadow-subtle hover:bg-brand-primary/95 md:inline-flex"
          >
            Find My Schemes
          </Link>
          <button
            className="inline-flex h-11 w-11 items-center justify-center rounded-full border border-brand-border bg-white/70 shadow-subtle md:hidden"
            aria-label={open ? 'Close menu' : 'Open menu'}
            aria-expanded={open}
            aria-controls="mobile-menu"
            onClick={() => setOpen((v) => !v)}
          >
            {open ? <X className="h-5 w-5 text-brand-dark" /> : <Menu className="h-5 w-5 text-brand-dark" />}
          </button>
        </div>
        </div>
      </div>

      <div
        id="mobile-menu"
        className={
          'fixed inset-0 z-50 bg-white/80 backdrop-blur transition-opacity md:hidden ' +
          (open ? 'pointer-events-auto opacity-100' : 'pointer-events-none opacity-0')
        }
        role="dialog"
        aria-modal="true"
      >
        <div className="mx-auto flex h-16 max-w-6xl items-center justify-between px-4">
          <Link to={ROUTES.landing} className="flex items-center gap-2" onClick={() => setOpen(false)}>
            <div className="flex h-10 w-10 items-center justify-center rounded-control bg-brand-primary text-white shadow-subtle">
              <Leaf className="h-5 w-5" aria-hidden="true" />
            </div>
            <div className="leading-none">
              <div className="font-display text-base font-semibold tracking-tight text-brand-dark">{APP_NAME}</div>
              <div className="mt-0.5 text-[11px] text-brand-muted">{APP_TAGLINE}</div>
            </div>
          </Link>
          <button
            className="inline-flex h-10 w-10 items-center justify-center rounded-full border border-brand-border bg-white/70 shadow-subtle"
            aria-label="Close menu"
            onClick={() => setOpen(false)}
          >
            <X className="h-5 w-5 text-brand-dark" />
          </button>
        </div>

        <div className="mx-auto max-w-6xl px-4 pb-10 pt-2">
          <div className="rounded-[24px] border border-brand-border bg-white/70 p-5 shadow-subtle backdrop-blur">
            <div className="text-xs font-semibold text-brand-muted">Navigation</div>
            <div className="mt-3 grid gap-2">
              {links.map((l) => (
                <Link
                  key={l.label}
                  to={l.to}
                  className="rounded-full border border-brand-border bg-white/70 px-4 py-3 text-sm font-medium text-brand-dark"
                  onClick={() => setOpen(false)}
                >
                  {l.label}
                </Link>
              ))}
            </div>

            <div className="mt-5">
              <Link
                to={ROUTES.schemes}
                className="inline-flex h-11 w-full items-center justify-center rounded-full bg-brand-primary px-5 text-sm font-medium text-white shadow-subtle"
                onClick={() => setOpen(false)}
              >
                Find My Schemes
              </Link>
            </div>
          </div>
        </div>
      </div>
    </header>
  )
}
