import { z } from 'zod'

import type { Caste, Condition, Gender, IncomeRange, Need, UserType } from '@/store/useSchemeFinderStore'

export const USER_TYPES: UserType[] = [
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

export const GENDERS: Gender[] = ['Male', 'Female', 'Other']
export const INCOME_RANGES: IncomeRange[] = ['<1L', '1-2.5L', '2.5-5L', '5-8L', '8L+']
export const CASTES: Caste[] = ['General', 'OBC', 'SC', 'ST', 'NT', 'EWS']

export const CONDITIONS: Condition[] = [
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

export const NEEDS: Need[] = [
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

export const SCHEME_FINDER_STEPS = [
  { title: 'User type', desc: 'Choose what best describes you' },
  { title: 'Location', desc: 'State and district (for state schemes)' },
  { title: 'Personal details', desc: 'Age, gender, income, caste category' },
  { title: 'Conditions', desc: 'Select any that apply' },
  { title: 'Needs', desc: 'What do you need help with?' },
] as const

export const schemeFinderSchema = z.object({
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

export type SchemeFinderFormValues = z.infer<typeof schemeFinderSchema>

