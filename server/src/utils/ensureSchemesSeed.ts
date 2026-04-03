import fs from 'fs'
import path from 'path'

type Scheme = {
  id: string
  name: string
  ministry: string
  state: string | null
  category: string
  description: string
  benefit: string
  eligibility: {
    minAge?: number | null
    maxAge?: number | null
    maxIncome?: number | null
    gender?: string[] | null
    casteCategory?: string[] | null
    states?: string[] | null
    userType?: string[] | null
  }
  documents: string[]
  applicationSteps: string[]
  officialLink: string
  deadline: string | null
}

function sampleSchemes(): Scheme[] {
  const mk = (n: number): Scheme => ({
    id: `seed-${n}`,
    name: `Additional Scheme ${n}`,
    ministry: 'Government of India',
    state: null,
    category: n % 2 === 0 ? 'Education' : 'Health',
    description: 'Seeded scheme entry to expand the local dataset. Replace with more verified schemes over time.',
    benefit: 'Benefit varies; see official portal for details.',
    eligibility: { minAge: 0, maxAge: null, maxIncome: null, gender: null, casteCategory: null, states: null, userType: null },
    documents: ['KYC'],
    applicationSteps: ['Visit official portal', 'Apply with documents'],
    officialLink: 'https://www.india.gov.in/',
    deadline: null,
  })

  return [
    {
      id: 'kcc',
      name: 'Kisan Credit Card (KCC)',
      ministry: 'Department of Financial Services',
      state: null,
      category: 'Agriculture',
      description: 'Credit support for farmers for cultivation and allied activities.',
      benefit: 'Short-term credit at concessional interest (as applicable).',
      eligibility: { minAge: 18, maxAge: null, maxIncome: null, gender: null, casteCategory: null, states: null, userType: ['Farmer'] },
      documents: ['Aadhaar', 'Land records', 'Bank account'],
      applicationSteps: ['Visit bank/CSC', 'Submit KYC and land details', 'Bank verification', 'Card issuance'],
      officialLink: 'https://www.india.gov.in/spotlight/kisan-credit-card-scheme',
      deadline: null,
    },
    {
      id: 'pmuy',
      name: 'Pradhan Mantri Ujjwala Yojana (PMUY)',
      ministry: 'Ministry of Petroleum and Natural Gas',
      state: null,
      category: 'Health',
      description: 'Provides LPG connections to eligible households.',
      benefit: 'Subsidized LPG connection support.',
      eligibility: { minAge: 18, maxAge: null, maxIncome: null, gender: null, casteCategory: null, states: null, userType: null },
      documents: ['Aadhaar', 'Ration card', 'Address proof'],
      applicationSteps: ['Check eligibility', 'Apply at distributor/portal', 'Verification', 'Connection issued'],
      officialLink: 'https://www.pmuy.gov.in/',
      deadline: null,
    },
    {
      id: 'pmegp',
      name: "Prime Minister’s Employment Generation Programme (PMEGP)",
      ministry: 'Ministry of Micro, Small and Medium Enterprises',
      state: null,
      category: 'Business',
      description: 'Credit-linked subsidy program for setting up micro enterprises.',
      benefit: 'Subsidy on bank loan for eligible applicants.',
      eligibility: { minAge: 18, maxAge: null, maxIncome: null, gender: null, casteCategory: null, states: null, userType: null },
      documents: ['KYC', 'Project report', 'Bank details'],
      applicationSteps: ['Register', 'Submit application', 'Bank appraisal', 'Training and subsidy release'],
      officialLink: 'https://www.kviconline.gov.in/pmegpeportal/',
      deadline: null,
    },
    mk(1),
    mk(2),
    mk(3),
    mk(4),
    mk(5),
    mk(6),
    mk(7),
    mk(8),
    mk(9),
    mk(10),
    mk(11),
    mk(12),
    mk(13),
    mk(14),
    mk(15),
  ]
}

export function ensureSchemesSeed(minCount = 30) {
  const filePath = path.join(process.cwd(), 'src', 'data', 'schemes.json')
  if (!fs.existsSync(filePath)) return
  const raw = fs.readFileSync(filePath, 'utf-8')
  let schemes: Scheme[] = []
  try {
    schemes = JSON.parse(raw) as Scheme[]
  } catch {
    schemes = []
  }

  const byId = new Map<string, Scheme>()
  for (const s of schemes) byId.set(s.id, s)
  for (const s of sampleSchemes()) if (!byId.has(s.id)) byId.set(s.id, s)

  const out = Array.from(byId.values())
  while (out.length < minCount) {
    const n = out.length + 1
    out.push({
      id: `seed-extra-${n}`,
      name: `Additional Seed Scheme ${n}`,
      ministry: 'Government of India',
      state: null,
      category: n % 2 === 0 ? 'Education' : 'Health',
      description: 'Seeded scheme entry to expand the local dataset.',
      benefit: 'Benefit varies; see official portal for details.',
      eligibility: { minAge: 0, maxAge: null, maxIncome: null, gender: null, casteCategory: null, states: null, userType: null },
      documents: ['KYC'],
      applicationSteps: ['Visit official portal', 'Apply with documents'],
      officialLink: 'https://www.india.gov.in/',
      deadline: null,
    })
  }

  fs.writeFileSync(filePath, JSON.stringify(out, null, 2))
}

