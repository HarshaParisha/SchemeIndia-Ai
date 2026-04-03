import { create } from 'zustand'
import { persist } from 'zustand/middleware'

export type UserType =
  | 'Farmer'
  | 'Student'
  | 'Salaried'
  | 'Business'
  | 'Daily wage'
  | 'Senior citizen'
  | 'Disabled'
  | 'Woman entrepreneur'
  | 'Unemployed'
  | 'Other'

export type Gender = 'Male' | 'Female' | 'Other'

export type IncomeRange = '<1L' | '1-2.5L' | '2.5-5L' | '5-8L' | '8L+'

export type Caste = 'General' | 'OBC' | 'SC' | 'ST' | 'NT' | 'EWS'

export type Condition =
  | 'Land ownership'
  | 'Ration card'
  | 'Student'
  | 'Disability'
  | 'Woman head'
  | 'Business owner'
  | 'Worker'
  | 'No income'
  | 'House ownership'
  | 'Jan Dhan'
  | 'Insurance'
  | 'KCC'

export type Need =
  | 'Financial help'
  | 'Housing'
  | 'Education'
  | 'Health'
  | 'Farming'
  | 'Business'
  | 'Solar'
  | 'Jobs'
  | 'Food'
  | 'Pension'
  | 'Women'
  | 'All'

export type SchemeFinderAnswers = {
  userType: UserType | null
  state: string
  district: string
  age: number | null
  gender: Gender | null
  incomeRange: IncomeRange | null
  caste: Caste | null
  conditions: Condition[]
  needs: Need[]
}

export type ResultsFilters = {
  q: string
  category: string
  benefitType: string
  ministry: string
  sort: 'relevant' | 'newest' | 'highest_benefit'
  tab: 'central' | 'state'
}

type Store = {
  step: number
  answers: SchemeFinderAnswers
  filters: ResultsFilters
  setStep: (step: number) => void
  setAnswer: <K extends keyof SchemeFinderAnswers>(key: K, value: SchemeFinderAnswers[K]) => void
  toggleCondition: (c: Condition) => void
  toggleNeed: (n: Need) => void
  setFilter: <K extends keyof ResultsFilters>(key: K, value: ResultsFilters[K]) => void
  reset: () => void
}

const initialAnswers: SchemeFinderAnswers = {
  userType: null,
  state: '',
  district: '',
  age: null,
  gender: null,
  incomeRange: null,
  caste: null,
  conditions: [],
  needs: [],
}

const initialFilters: ResultsFilters = {
  q: '',
  category: '',
  benefitType: '',
  ministry: '',
  sort: 'relevant',
  tab: 'central',
}

export const useSchemeFinderStore = create<Store>()(
  persist(
    (set, get) => ({
      step: 0,
      answers: initialAnswers,
      filters: initialFilters,
      setStep: (step) => set({ step }),
      setAnswer: (key, value) => set({ answers: { ...get().answers, [key]: value } as SchemeFinderAnswers }),
      toggleCondition: (c) => {
        const current = get().answers.conditions
        const next = current.includes(c) ? current.filter((x) => x !== c) : [...current, c]
        set({ answers: { ...get().answers, conditions: next } })
      },
      toggleNeed: (n) => {
        const current = get().answers.needs
        if (n === 'All') {
          set({ answers: { ...get().answers, needs: current.includes('All') ? [] : ['All'] } })
          return
        }
        const cleaned = current.filter((x) => x !== 'All')
        const next = cleaned.includes(n) ? cleaned.filter((x) => x !== n) : [...cleaned, n]
        set({ answers: { ...get().answers, needs: next } })
      },
      setFilter: (key, value) => set({ filters: { ...get().filters, [key]: value } as ResultsFilters }),
      reset: () => set({ step: 0, answers: initialAnswers, filters: initialFilters }),
    }),
    { name: 'si_scheme_finder' },
  ),
)

