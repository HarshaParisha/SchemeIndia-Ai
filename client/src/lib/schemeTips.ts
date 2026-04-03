import type { Scheme } from '@/types/api'

function hasAny(hay: string, needles: string[]) {
  const t = hay.toLowerCase()
  return needles.some((n) => t.includes(n))
}

function clean(s: string) {
  return s.replace(/\s+/g, ' ').trim()
}

export function getSchemeTips(s: Scheme) {
  const tips: string[] = []

  tips.push('Use the official portal link on this page to confirm the latest eligibility and deadlines.')

  if (s.state) {
    tips.push(`For this ${s.state} scheme, check the state portal and keep your domicile/residence proof ready if asked.`)
  } else {
    tips.push('For central schemes, eligibility can still vary by state; check any state-specific rules on the portal.')
  }

  const blob = `${s.name} ${s.ministry} ${s.category} ${s.description} ${s.benefit} ${s.officialLink}`

  if (hasAny(blob, ['scholar', 'nsp', 'education'])) {
    tips.push('For scholarships, apply early and keep admission proof, bank details, and certificates ready for verification.')
  }

  if (hasAny(blob, ['health', 'hospital', 'pm-jay', 'ayushman', 'insurance', 'bima', 'cover'])) {
    tips.push('For health/insurance schemes, confirm empanelled facilities and carry your ID and eligibility proof when visiting.')
  }

  if (hasAny(blob, ['housing', 'awas', 'pmay', 'ulb', 'gram panchayat'])) {
    tips.push('For housing schemes, keep income proof and property/ownership declarations ready; local verification is common.')
  }

  if (hasAny(blob, ['farmer', 'kisan', 'crop', 'agriculture', 'land', 'kcc', 'fasal'])) {
    tips.push('For farmer schemes, land records and bank-linked Aadhaar often speed up verification and payments.')
  }

  if (hasAny(blob, ['loan', 'mudra', 'msme', 'business', 'enterprise'])) {
    tips.push('For loan schemes, prepare a simple business plan, KYC, and basic cash-flow details before applying at a bank.')
  }

  if (hasAny(blob, ['women', 'girl', 'maternity', 'pmmvy', 'ujjwala', 'bbbp'])) {
    tips.push('For women-focused schemes, check whether household income/category certificates are required for approval.')
  }

  tips.push('If you are unsure, apply via the nearest CSC/department office and keep photocopies + originals for verification.')

  const unique = Array.from(new Set(tips.map(clean))).filter(Boolean)
  return unique.slice(0, 6)
}

