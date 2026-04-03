import { Link } from 'react-router-dom'
import {
  BadgeCheck,
  Building2,
  GraduationCap,
  HandHeart,
  HeartPulse,
  Home,
  Leaf,
  PersonStanding,
  PiggyBank,
  ShieldCheck,
  Sun,
  Users,
} from 'lucide-react'

import { ROUTES } from '@/lib/constants'

const CATEGORIES = [
  { name: 'Agriculture', slug: 'agriculture', count: '140+', icon: Leaf },
  { name: 'Education', slug: 'education', count: '180+', icon: GraduationCap },
  { name: 'Housing', slug: 'housing', count: '95+', icon: Home },
  { name: 'Health', slug: 'health', count: '110+', icon: HeartPulse },
  { name: 'Women', slug: 'women', count: '120+', icon: HandHeart },
  { name: 'MSME', slug: 'msme', count: '85+', icon: Building2 },
  { name: 'SC/ST/OBC', slug: 'sc-st-obc', count: '90+', icon: Users },
  { name: 'Solar', slug: 'solar', count: '40+', icon: Sun },
  { name: 'Disability', slug: 'disability', count: '60+', icon: PersonStanding },
  { name: 'Skill', slug: 'skill', count: '70+', icon: BadgeCheck },
  { name: 'Finance', slug: 'finance', count: '95+', icon: PiggyBank },
  { name: 'Senior Citizens', slug: 'senior-citizens', count: '55+', icon: ShieldCheck },
]

export default function Categories() {
  return (
    <div className="space-y-6">
      <div className="rounded-card border border-brand-border bg-white p-6 shadow-subtle">
        <div className="text-[28px] font-semibold tracking-tight text-brand-dark">Categories</div>
        <div className="mt-2 text-sm text-brand-muted">Browse schemes by category. Open a category to see the most relevant schemes first.</div>
      </div>

      <div className="grid grid-cols-2 gap-4 lg:grid-cols-3">
        {CATEGORIES.map((c) => {
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
                <div>
                  <div className="text-sm font-semibold text-brand-dark">{c.name}</div>
                  <div className="mt-1 text-xs text-brand-muted">{c.count} schemes</div>
                </div>
              </div>
            </Link>
          )
        })}
      </div>
    </div>
  )
}

