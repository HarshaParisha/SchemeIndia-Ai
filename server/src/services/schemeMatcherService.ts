import fs from 'fs'
import path from 'path'

export type SchemeEligibility = {
  minAge?: number | null
  maxAge?: number | null
  maxIncome?: number | null
  gender?: string[] | null
  casteCategory?: string[] | null
  states?: string[] | null
  userType?: string[] | null
}

export type Scheme = {
  id: string
  name: string
  ministry: string
  state: string | null
  category: string
  description: string
  benefit: string
  eligibility: SchemeEligibility
  documents: string[]
  applicationSteps: string[]
  officialLink: string
  deadline: string | null
}

let cache: Scheme[] | null = null

export function loadSchemes(): Scheme[] {
  if (cache) return cache
  const filePath = path.join(process.cwd(), 'src', 'data', 'schemes.json')
  const raw = fs.readFileSync(filePath, 'utf-8')
  cache = JSON.parse(raw) as Scheme[]
  return cache
}

export type SchemeMatchInput = {
  userType?: string
  state?: string
  age?: number
  income?: number
  casteCategory?: string
  gender?: string
  category?: string
}

export function matchSchemes(input: SchemeMatchInput) {
  const schemes = loadSchemes()
  const filtered = schemes.filter((s) => {
    if (input.category && s.category !== input.category) return false
    const e = s.eligibility || {}
    if (typeof input.age === 'number') {
      if (typeof e.minAge === 'number' && input.age < e.minAge) return false
      if (typeof e.maxAge === 'number' && input.age > e.maxAge) return false
    }
    if (typeof input.income === 'number' && typeof e.maxIncome === 'number' && input.income > e.maxIncome) {
      return false
    }
    if (input.gender && Array.isArray(e.gender) && e.gender.length > 0 && !e.gender.includes(input.gender)) {
      return false
    }
    if (
      input.casteCategory &&
      Array.isArray(e.casteCategory) &&
      e.casteCategory.length > 0 &&
      !e.casteCategory.includes(input.casteCategory)
    ) {
      return false
    }
    if (input.userType && Array.isArray(e.userType) && e.userType.length > 0 && !e.userType.includes(input.userType)) {
      return false
    }
    if (input.state) {
      if (s.state && s.state !== input.state) return false
      if (Array.isArray(e.states) && e.states.length > 0 && !e.states.includes(input.state)) return false
    }
    return true
  })

  return filtered
}

