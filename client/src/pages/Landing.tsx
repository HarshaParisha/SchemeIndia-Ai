import { useEffect, useMemo, useRef, useState } from 'react'
import { motion, useInView } from 'framer-motion'
import { Link } from 'react-router-dom'
import {
  BadgeCheck,
  Building2,
  ChevronRight,
  FileText,
  GraduationCap,
  HandHeart,
  HeartPulse,
  Home,
  Landmark,
  Leaf,
  MapPin,
  PersonStanding,
  PiggyBank,
  ShieldCheck,
  Star,
  Sun,
  Users,
  Wallet,
} from 'lucide-react'

import { Button } from '@/components/ui/button'
import SahyogiChat from '@/components/shared/SahyogiChat'
import { APP_NAME, IN_STATES, ROUTES } from '@/lib/constants'
import { slugify } from '@/lib/slug'
import { formatSchemeName } from '@/lib/utils'

const fadeUp = {
  hidden: { opacity: 0, y: 12 },
  show: { opacity: 1, y: 0, transition: { duration: 0.45, ease: [0.2, 0.9, 0.2, 1] } },
}

function AnimatedNumber({ value, suffix }: { value: number; suffix?: string }) {
  const ref = useRef<HTMLSpanElement | null>(null)
  const inView = useInView(ref, { once: true, margin: '-20% 0px' })
  const [n, setN] = useState(0)

  useEffect(() => {
    if (!inView) return
    const start = performance.now()
    const duration = 900

    let raf = 0
    const tick = (t: number) => {
      const p = Math.min(1, (t - start) / duration)
      const eased = 1 - Math.pow(1 - p, 3)
      setN(Math.round(value * eased))
      if (p < 1) raf = requestAnimationFrame(tick)
    }
    raf = requestAnimationFrame(tick)
    return () => cancelAnimationFrame(raf)
  }, [inView, value])

  return (
    <span ref={ref} className="tabular-nums">
      {n.toLocaleString()}
      {suffix || ''}
    </span>
  )
}

function SectionTitle({ kicker, title, desc }: { kicker?: string; title: string; desc: string }) {
  return (
    <div className="max-w-3xl">
      {kicker ? <div className="text-xs font-semibold uppercase tracking-wide text-brand-muted">{kicker}</div> : null}
      <div className="mt-2 text-[28px] font-semibold tracking-tight text-brand-dark sm:text-[32px]">{title}</div>
      <div className="mt-2 text-[16px] text-brand-muted">{desc}</div>
    </div>
  )
}

function Pill({ children }: { children: React.ReactNode }) {
  return <span className="rounded-full border border-brand-border bg-brand-bg px-3 py-1 text-xs text-brand-muted">{children}</span>
}

function SchemePreviewCard({ id, title, ministry, benefit }: { id: string; title: string; ministry: string; benefit: string }) {
  return (
    <div className="rounded-card border border-brand-border bg-white p-5 shadow-subtle">
      <div className="text-sm font-semibold text-brand-dark">{formatSchemeName(title)}</div>
      <div className="mt-1 text-xs text-brand-muted">{ministry}</div>
      <div className="mt-3 text-sm text-brand-muted line-clamp-2">{benefit}</div>
      <div className="mt-4 flex items-center justify-between">
        <Pill>Central</Pill>
        <Link
          to={`/schemes/${id}`}
          className="inline-flex h-9 items-center rounded-full border border-brand-border bg-white px-3 text-xs font-semibold text-brand-dark shadow-subtle hover:bg-brand-bg/70"
        >
          View
        </Link>
      </div>
    </div>
  )
}

export default function Landing() {
  const categories = useMemo(
    () => [
      { name: 'Agriculture', slug: 'agriculture', count: 140, icon: Leaf },
      { name: 'Education', slug: 'education', count: 180, icon: GraduationCap },
      { name: 'Housing', slug: 'housing', count: 95, icon: Home },
      { name: 'Health', slug: 'health', count: 110, icon: HeartPulse },
      { name: 'Women', slug: 'women', count: 120, icon: HandHeart },
      { name: 'MSME', slug: 'msme', count: 85, icon: Building2 },
      { name: 'SC/ST/OBC', slug: 'sc-st-obc', count: 90, icon: Users },
      { name: 'Solar', slug: 'solar', count: 40, icon: Sun },
      { name: 'Disability', slug: 'disability', count: 60, icon: PersonStanding },
      { name: 'Skill', slug: 'skill', count: 70, icon: BadgeCheck },
      { name: 'Finance', slug: 'finance', count: 95, icon: PiggyBank },
      { name: 'Senior', slug: 'senior-citizens', count: 55, icon: ShieldCheck },
    ],
    [],
  )

  const featured = useMemo(
    () => [
      {
        key: 'pm-kisan',
        id: 'pm-kisan',
        name: 'PM Kisan',
        ministry: 'Ministry of Agriculture & Farmers Welfare',
        benefit: '₹6,000 per year in instalments (subject to eligibility).',
        eligibility: 'Farmers',
      },
      {
        key: 'pmjay',
        id: 'pmjay',
        name: 'Ayushman Bharat',
        ministry: 'National Health Authority',
        benefit: 'Health cover up to ₹5 lakh per family per year (as per rules).',
        eligibility: 'Eligible families',
      },
      {
        key: 'pmay',
        id: 'pm-awas-urban',
        name: 'PM Awas',
        ministry: 'Ministry of Housing and Urban Affairs and Ministry of Rural Development',
        benefit: 'Housing assistance for eligible households.',
        eligibility: 'Eligible households',
      },
      {
        key: 'ujjwala',
        id: 'pm-ujjwala-yojana-pmuy',
        name: 'Ujjwala',
        ministry: 'Ministry of Petroleum and Natural Gas',
        benefit: 'Support for LPG connections for eligible families.',
        eligibility: 'Eligible families',
      },
      {
        key: 'solar',
        id: 'pm-solar-rooftop',
        name: 'Solar Rooftop',
        ministry: 'Ministry of New and Renewable Energy',
        benefit: 'Subsidy support for rooftop solar (as per guidelines).',
        eligibility: 'Homeowners',
      },
      {
        key: 'mudra',
        id: 'mudra',
        name: 'Mudra',
        ministry: 'Department of Financial Services',
        benefit: 'Loans for micro/small enterprises under lender norms.',
        eligibility: 'Small businesses',
      },
    ],
    [],
  )

  const previewSchemes = useMemo(
    () => [
      {
        id: 'pm-kisan',
        title: 'PM Kisan Samman Nidhi',
        ministry: 'Ministry of Agriculture & Farmers Welfare',
        benefit: '₹6,000 per year in 3 instalments (subject to eligibility and official updates).',
      },
      {
        id: 'pmjay',
        title: 'Ayushman Bharat Pradhan Mantri Jan Arogya Yojana (PM-JAY)',
        ministry: 'National Health Authority',
        benefit: 'Health cover up to ₹5 lakh per family per year for secondary and tertiary care (as per official rules).',
      },
      {
        id: 'mudra',
        title: 'Pradhan Mantri MUDRA Yojana (PMMY)',
        ministry: 'Department of Financial Services',
        benefit: 'Business loans under Shishu, Kishore and Tarun categories (as per lender policy).',
      },
    ],
    [],
  )

  const container = {
    hidden: { opacity: 0 },
    show: { opacity: 1, transition: { staggerChildren: 0.08, delayChildren: 0.05 } },
  }

  return (
    <motion.div variants={container} initial="hidden" animate="show" className="pb-16">
      <motion.section variants={fadeUp} className="mx-auto max-w-6xl px-4 pt-10">
        <div className="grid gap-8 lg:grid-cols-[1.15fr_0.85fr]">
          <div>
            <div className="inline-flex items-center gap-2 rounded-full border border-brand-border bg-white px-3 py-1 text-xs text-brand-muted">
              <Landmark className="h-4 w-4 text-brand-primary" />
              AI-assisted, trustworthy scheme discovery
            </div>
            <div className="mt-5 text-[40px] font-semibold leading-[1.08] tracking-tight text-brand-dark sm:text-[48px]">
              Why SchemeIndia AI?
              <span className="block">Know your schemes in minutes.</span>
            </div>
            <div className="mt-4 text-[16px] text-brand-muted">
              Answer a few questions and get a clear list of Central and State schemes you may qualify for. See benefits, documents, steps, and official links — in
              simple language.
            </div>

            <div className="mt-6 flex flex-col gap-3 sm:flex-row">
              <Button asChild>
                <Link to={ROUTES.schemes}>Find Schemes</Link>
              </Button>
              <Button asChild variant="ghost">
                <Link to={ROUTES.schemes}>Browse Schemes</Link>
              </Button>
            </div>

            <div className="mt-6 flex flex-wrap gap-2">
              <Pill>Official links</Pill>
              <Pill>Central + State</Pill>
              <Pill>Documents checklist</Pill>
              <Pill>Application steps</Pill>
            </div>

            <div className="mt-7 grid gap-3 sm:grid-cols-3">
              <div className="rounded-card border border-brand-border bg-white p-4 shadow-subtle">
                <div className="flex items-center gap-2">
                  <MapPin className="h-4 w-4 text-brand-primary" />
                  <div className="text-sm font-semibold text-brand-dark">Tell us your state</div>
                </div>
                <div className="mt-1 text-xs leading-relaxed text-brand-muted">So we include the right state schemes along with central schemes.</div>
              </div>
              <div className="rounded-card border border-brand-border bg-white p-4 shadow-subtle">
                <div className="flex items-center gap-2">
                  <Users className="h-4 w-4 text-brand-primary" />
                  <div className="text-sm font-semibold text-brand-dark">Answer 5 questions</div>
                </div>
                <div className="mt-1 text-xs leading-relaxed text-brand-muted">Age, income range, category, and needs — quick and simple.</div>
              </div>
              <div className="rounded-card border border-brand-border bg-white p-4 shadow-subtle">
                <div className="flex items-center gap-2">
                  <FileText className="h-4 w-4 text-brand-primary" />
                  <div className="text-sm font-semibold text-brand-dark">Get a checklist</div>
                </div>
                <div className="mt-1 text-xs leading-relaxed text-brand-muted">Documents + steps + official links. Ready to apply.</div>
              </div>
            </div>
          </div>

          <div className="rounded-card border border-brand-border bg-white p-6 shadow-subtle">
            <div className="flex items-center justify-between">
              <div className="text-sm font-semibold text-brand-dark">Preview</div>
              <Pill>Live</Pill>
            </div>
            <motion.div
              className="mt-4 space-y-3"
              initial={{ opacity: 0, y: 8 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.35 }}
            >
              {previewSchemes.map((s, idx) => (
                <motion.div
                  key={s.title}
                  initial={{ opacity: 0, y: 10 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: 0.08 * idx, duration: 0.45 }}
                >
                  <SchemePreviewCard id={s.id} title={s.title} ministry={s.ministry} benefit={s.benefit} />
                </motion.div>
              ))}
            </motion.div>
          </div>
        </div>

        <div className="mt-6 rounded-card border border-brand-border bg-brand-bg p-4 text-sm text-brand-muted">
          Covers Central and State schemes across 28 States and 8 UTs
        </div>
      </motion.section>

      <motion.section variants={fadeUp} className="mx-auto max-w-6xl px-4 pt-14">
        <SectionTitle kicker="Live stats" title="Built for coverage, designed for trust" desc="A clean platform to discover schemes you already qualify for." />
        <div className="mt-6 grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
          {[{ label: 'Schemes', value: 1200, suffix: '+' }, { label: 'States + UTs', value: 36 }, { label: 'Categories', value: 45, suffix: '+' }, { label: 'Users', value: 230000, suffix: '+' }].map(
            (s) => (
              <div key={s.label} className="rounded-card border border-brand-border bg-white p-5 shadow-subtle">
                <div className="text-[28px] font-semibold leading-none text-brand-primary">
                  <AnimatedNumber value={s.value} suffix={s.suffix} />
                </div>
                <div className="mt-2 text-sm text-brand-muted">{s.label}</div>
              </div>
            ),
          )}
        </div>
      </motion.section>

      <motion.section variants={fadeUp} className="mx-auto max-w-6xl px-4 pt-14">
        <SectionTitle kicker="How it works" title="3 steps. No confusion." desc="Designed for first‑time users. Simple questions, clear results." />
        <div className="mt-6 grid gap-4 md:grid-cols-3">
          {[
            { n: '1', title: 'Tell us about yourself', desc: 'Answer a few questions like user type and location.' },
            { n: '2', title: 'We match your profile', desc: 'We calculate a match score and sort what fits you best.' },
            { n: '3', title: 'Get personalised schemes', desc: 'See documents, steps, and official links to apply.' },
          ].map((s) => (
            <div key={s.n} className="rounded-card border border-brand-border bg-white p-6 shadow-subtle">
              <div className="flex items-start justify-between">
                <div className="text-xs font-semibold text-brand-muted">Step {s.n}</div>
                <div className="rounded-full border border-brand-border bg-brand-bg px-3 py-1 text-xs text-brand-muted">Fast</div>
              </div>
              <div className="mt-3 text-[20px] font-semibold text-brand-dark">{s.title}</div>
              <div className="mt-2 text-[16px] text-brand-muted">{s.desc}</div>
            </div>
          ))}
        </div>
      </motion.section>

      <motion.section variants={fadeUp} className="mx-auto max-w-6xl px-4 pt-14" id="categories">
        <SectionTitle kicker="Categories" title="Browse by scheme category" desc="Pick what you need and explore schemes with official links." />
        <div className="mt-6 grid grid-cols-2 gap-4 lg:grid-cols-3">
          {categories.map((c) => {
            const Icon = c.icon
            return (
              <Link
                key={c.slug}
                to={ROUTES.categoryDetail.replace(':slug', c.slug)}
                className="rounded-card border border-brand-border bg-white p-5 shadow-subtle hover:bg-brand-bg"
              >
                <div className="flex items-center gap-3">
                  <div className="flex h-10 w-10 items-center justify-center rounded-control border border-brand-border bg-brand-bg">
                    <Icon className="h-5 w-5 text-brand-primary" aria-hidden="true" />
                  </div>
                  <div className="min-w-0">
                    <div className="text-sm font-semibold text-brand-dark">{c.name}</div>
                    <div className="mt-1 text-xs text-brand-muted">{c.count}+ schemes</div>
                  </div>
                </div>
              </Link>
            )
          })}
        </div>
      </motion.section>

      <motion.section variants={fadeUp} className="mx-auto max-w-6xl px-4 pt-14">
        <SectionTitle kicker="Featured" title="Popular schemes" desc="Quick access to schemes people search for most." />
        <div className="mt-6 -mx-4 flex gap-4 overflow-x-auto px-4 pb-2 [scrollbar-width:none] [&::-webkit-scrollbar]:hidden lg:mx-0 lg:grid lg:grid-cols-4 lg:gap-4 lg:overflow-visible lg:px-0">
          {featured.map((s) => (
            <div
              key={s.key}
              className="flex w-[280px] min-w-0 flex-none flex-col rounded-card border border-brand-border bg-white p-5 shadow-subtle lg:w-auto"
            >
              <div className="text-sm font-semibold text-brand-dark">{s.name}</div>
              <div className="mt-1 text-xs text-brand-muted line-clamp-2">{s.ministry}</div>
              <div className="mt-3 text-sm text-brand-muted line-clamp-3">{s.benefit}</div>
              <div className="mt-4 flex flex-wrap items-center gap-2">
                <Pill>{s.eligibility}</Pill>
                <Pill>Official link</Pill>
              </div>
              <div className="mt-auto pt-5">
                <Button asChild className="h-10 w-full">
                  <Link to={`/schemes/${s.id}`}>View scheme</Link>
                </Button>
              </div>
            </div>
          ))}
        </div>
      </motion.section>

      <motion.section variants={fadeUp} className="mx-auto max-w-6xl px-4 pt-14" id="states">
        <SectionTitle kicker="States" title="Browse by state" desc="All 28 states + 8 UTs. Open a state to see available schemes." />
        <div className="mt-6 grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
          {IN_STATES.map((s) => (
            <Link
              key={s}
              to={ROUTES.stateAlias.replace(':stateSlug', slugify(s))}
              className="rounded-control border border-brand-border bg-white px-4 py-3 text-sm font-medium text-brand-dark shadow-subtle hover:bg-brand-bg"
            >
              {s}
            </Link>
          ))}
        </div>
      </motion.section>

      <motion.section variants={fadeUp} className="mx-auto max-w-6xl px-4 pt-14">
        <SectionTitle kicker="Testimonials" title="People trust SchemeIndia" desc="Clear steps and official links make a real difference." />
        <div className="mt-6 grid gap-4 md:grid-cols-3">
          {[
            {
              name: 'Ramesh',
              role: 'Farmer, Rajasthan',
              quote: 'I found PMFBY and PM-KISAN details in one place. Documents list was clear. I applied without confusion.',
            },
            {
              name: 'Riya',
              role: 'Student, Bihar',
              quote: 'The scholarship steps were simple. I understood what to upload and where to check status.',
            },
            {
              name: 'Irfan',
              role: 'Business owner, Telangana',
              quote: 'Mudra options were explained clearly. I could shortlist and visit the bank with the right papers.',
            },
          ].map((t) => (
            <div key={t.role} className="rounded-card border border-brand-border bg-white p-6 shadow-subtle">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <div className="flex h-10 w-10 items-center justify-center rounded-full border border-brand-border bg-brand-bg text-sm font-semibold text-brand-dark">
                    {t.name.slice(0, 1)}
                  </div>
                  <div>
                    <div className="text-sm font-semibold text-brand-dark">{t.name}</div>
                    <div className="text-xs text-brand-muted">{t.role}</div>
                  </div>
                </div>
                <div className="flex items-center gap-0.5" aria-label="Rating 5 out of 5">
                  {Array.from({ length: 5 }).map((_, i) => (
                    <Star key={i} className="h-4 w-4 text-brand-warning" fill="rgb(var(--bc-warn))" />
                  ))}
                </div>
              </div>
              <div className="mt-4 text-sm text-brand-muted">“{t.quote}”</div>
            </div>
          ))}
        </div>
      </motion.section>

      <motion.section variants={fadeUp} className="mx-auto max-w-6xl px-4 pt-14">
        <SectionTitle kicker="Why" title="Why SchemeIndia" desc="A clean, government-style platform that keeps things simple." />
        <div className="mt-6 grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
          {[
            { icon: Wallet, title: 'Free', desc: 'Discover schemes without paying or calling agents.' },
            { icon: ShieldCheck, title: 'Updated', desc: 'We link to official portals and keep references current.' },
            { icon: MapPin, title: 'State + Central', desc: 'See both Central and State schemes in one place.' },
            { icon: FileText, title: 'Simple language', desc: 'Clear benefits, documents, and application steps.' },
          ].map((x) => {
            const Icon = x.icon
            return (
              <div key={x.title} className="rounded-card border border-brand-border bg-white p-6 shadow-subtle">
                <div className="flex h-10 w-10 items-center justify-center rounded-control border border-brand-border bg-brand-bg">
                  <Icon className="h-5 w-5 text-brand-accent" aria-hidden="true" />
                </div>
                <div className="mt-3 text-[20px] font-semibold text-brand-dark">{x.title}</div>
                <div className="mt-2 text-[16px] text-brand-muted">{x.desc}</div>
              </div>
            )
          })}
        </div>

        <div className="mt-8 flex flex-col gap-3 sm:flex-row">
          <Button asChild>
            <Link to={ROUTES.schemes}>Find Schemes</Link>
          </Button>
          <Button asChild variant="ghost">
            <Link to={ROUTES.states}>Browse States</Link>
          </Button>
        </div>

        <div className="mt-6 rounded-card border border-brand-border bg-white p-5 text-sm text-brand-muted">
          Independent platform using govt data and official portals for reference. Always verify on the official website.
        </div>
      </motion.section>

      <SahyogiChat />
    </motion.div>
  )
}
