import type { Scheme } from '@/types/api'
import type {
  Caste,
  Condition,
  Gender,
  IncomeRange,
  Need,
  SchemeFinderAnswers,
  UserType,
} from '@/store/useSchemeFinderStore'

export type BenefitType = 'Cash' | 'Loan' | 'Subsidy' | 'Insurance' | 'Scholarship' | 'Food' | 'Service'

export function incomeRangeToUpper(income: IncomeRange | null) {
  if (!income) return null
  if (income === '<1L') return 100_000
  if (income === '1-2.5L') return 250_000
  if (income === '2.5-5L') return 500_000
  if (income === '5-8L') return 800_000
  return 10_000_000
}

export function deriveBenefitType(benefit: string): BenefitType {
  const t = benefit.toLowerCase()
  if (t.includes('loan') || t.includes('credit')) return 'Loan'
  if (t.includes('subsid') || t.includes('solar')) return 'Subsidy'
  if (t.includes('insurance') || t.includes('cover') || t.includes('bima')) return 'Insurance'
  if (t.includes('scholar') || t.includes('fee') || t.includes('tuition')) return 'Scholarship'
  if (t.includes('ration') || t.includes('food') || t.includes('poshan')) return 'Food'
  if (t.includes('cash') || t.includes('income support') || t.includes('assistance') || t.includes('₹')) return 'Cash'
  return 'Service'
}

function parseLakhToRupees(v: number) {
  return Math.round(v * 100_000)
}

export function deriveBenefitAmount(benefit: string) {
  const t = benefit.toLowerCase()
  const rupee = t.match(/₹\s*([0-9][0-9,]*)/)
  if (rupee) return Number(rupee[1].replace(/,/g, ''))

  const lakh = t.match(/([0-9]+(?:\.[0-9]+)?)\s*lakh/)
  if (lakh) return parseLakhToRupees(Number(lakh[1]))

  const crore = t.match(/([0-9]+(?:\.[0-9]+)?)\s*crore/)
  if (crore) return Math.round(Number(crore[1]) * 10_000_000)

  if (t.includes('5 lakh')) return 500_000
  return 0
}

function textBlob(s: Scheme) {
  return `${s.name} ${s.ministry} ${s.category} ${s.description} ${s.benefit}`.toLowerCase()
}

function normalizeUserType(u: UserType | null): string | null {
  if (!u) return null
  if (u === 'Farmer') return 'Farmer'
  if (u === 'Student') return 'Student'
  if (u === 'Business' || u === 'Woman entrepreneur') return 'Business'
  if (u === 'Disabled') return 'Disability'
  if (u === 'Senior citizen') return null
  if (u === 'Salaried' || u === 'Daily wage' || u === 'Unemployed') return 'Working'
  return null
}

function normalizeGender(g: Gender | null) {
  if (!g) return null
  return g
}

function normalizeCaste(c: Caste | null) {
  if (!c) return null
  if (c === 'NT') return null
  return c
}

function conditionMatches(s: Scheme, c: Condition) {
  const t = textBlob(s)
  if (c === 'Land ownership') return t.includes('land') || t.includes('farmer') || t.includes('crop')
  if (c === 'Ration card') return t.includes('ration') || t.includes('nfsa') || t.includes('pds')
  if (c === 'Student') return s.category.toLowerCase().includes('educ') || t.includes('scholar')
  if (c === 'Disability') return s.category.toLowerCase().includes('disab') || t.includes('udid')
  if (c === 'Woman head') return s.category.toLowerCase().includes('women') || t.includes('women')
  if (c === 'Business owner') return s.category.toLowerCase().includes('business') || t.includes('msme') || t.includes('mudra')
  if (c === 'Worker') return t.includes('worker') || t.includes('labour') || t.includes('shram')
  if (c === 'No income') return t.includes('bpl') || t.includes('free') || t.includes('subsid')
  if (c === 'House ownership') return s.category.toLowerCase().includes('housing') || t.includes('awas')
  if (c === 'Jan Dhan') return t.includes('jan dhan') || t.includes('pmjdy')
  if (c === 'Insurance') return t.includes('insurance') || t.includes('bima') || t.includes('cover')
  if (c === 'KCC') return t.includes('kisan credit card') || t.includes('kcc')
  return false
}

function needMatches(s: Scheme, n: Need) {
  const t = textBlob(s)
  if (n === 'All') return true
  if (n === 'Financial help') return deriveBenefitType(s.benefit) === 'Cash' || deriveBenefitType(s.benefit) === 'Loan' || t.includes('pension')
  if (n === 'Housing') return s.category === 'Housing' || t.includes('awas')
  if (n === 'Education') return s.category === 'Education' || t.includes('scholar')
  if (n === 'Health') return s.category === 'Health' || t.includes('ayushman')
  if (n === 'Farming') return s.category === 'Agriculture' || t.includes('kisan')
  if (n === 'Business') return s.category === 'Business' || t.includes('msme')
  if (n === 'Solar') return t.includes('solar')
  if (n === 'Jobs') return t.includes('job') || t.includes('apprent') || t.includes('skill') || t.includes('ncs')
  if (n === 'Food') return t.includes('ration') || t.includes('poshan') || t.includes('nfsa')
  if (n === 'Pension') return t.includes('pension') || t.includes('maandhan') || t.includes('apy') || t.includes('nsap')
  if (n === 'Women') return s.category === 'Women' || t.includes('women')
  return false
}

export function isEligible(s: Scheme, a: SchemeFinderAnswers) {
  if (s.state !== null && a.state && s.state !== a.state) return false

  if (a.state) {
    const onlyStates = s.eligibility?.states
    if (Array.isArray(onlyStates) && onlyStates.length > 0 && !onlyStates.includes(a.state)) return false
  }

  if (typeof a.age === 'number') {
    const minAge = s.eligibility?.minAge
    const maxAge = s.eligibility?.maxAge
    if (typeof minAge === 'number' && a.age < minAge) return false
    if (typeof maxAge === 'number' && a.age > maxAge) return false
  }

  const incomeUpper = incomeRangeToUpper(a.incomeRange)
  if (typeof incomeUpper === 'number') {
    const maxIncome = s.eligibility?.maxIncome
    if (typeof maxIncome === 'number' && incomeUpper > maxIncome) return false
  }

  const caste = normalizeCaste(a.caste)
  if (caste) {
    const allowed = s.eligibility?.casteCategory
    if (Array.isArray(allowed) && allowed.length > 0 && !allowed.includes(caste)) return false
  }

  const gender = normalizeGender(a.gender)
  if (gender) {
    const allowed = s.eligibility?.gender
    if (Array.isArray(allowed) && allowed.length > 0 && !allowed.includes(gender)) return false
  }

  const userType = normalizeUserType(a.userType)
  if (userType) {
    const allowed = s.eligibility?.userType
    if (Array.isArray(allowed) && allowed.length > 0 && !allowed.includes(userType)) return false
  }

  const needs = a.needs
  if (needs.length > 0 && !needs.includes('All')) {
    if (!needs.some((n) => needMatches(s, n))) return false
  }

  return true
}

export function scoreScheme(s: Scheme, a: SchemeFinderAnswers) {
  if (!isEligible(s, a)) return null

  let score = 0

  if (a.state) score += 30

  if (typeof a.age === 'number') score += 20

  if (a.incomeRange) score += 20

  if (a.caste) score += 15

  if (a.gender) score += 10

  if (a.userType) score += 15

  if (a.conditions.length > 0) {
    const matches = a.conditions.filter((c) => conditionMatches(s, c)).length
    score += matches * 5
  }

  if (a.needs.length > 0 && !a.needs.includes('All')) {
    if (a.needs.some((n) => needMatches(s, n))) score += 10
  }

  const max = 30 + 20 + 20 + 15 + 10 + 15 + a.conditions.length * 5 + (a.needs.length > 0 && !a.needs.includes('All') ? 10 : 0)
  const pct = max > 0 ? Math.round((score / max) * 100) : 0
  return Math.max(0, Math.min(100, pct))
}

export function splitByGovernmentLevel(schemes: Scheme[], state: string) {
  const central = schemes.filter((s) => s.state === null)
  const stateSchemes = schemes.filter((s) => s.state !== null && (!state || s.state === state))
  return { central, stateSchemes }
}

