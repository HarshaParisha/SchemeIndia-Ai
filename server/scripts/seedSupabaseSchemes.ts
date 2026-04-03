import { createClient } from '@supabase/supabase-js'
import dotenv from 'dotenv'

import { SCHEMES } from '@/data/schemes'
import type { Scheme } from '@/types/api'

dotenv.config()

function parseUpdatedAt(v: string | null | undefined) {
  if (!v) return null
  const d = new Date(v)
  if (Number.isNaN(d.getTime())) return null
  return d.toISOString()
}

type SchemeRowInsert = {
  id: string
  name: string
  ministry: string
  state: string | null
  category: string
  description: string
  benefit: string
  eligibility: Scheme['eligibility']
  documents: string[]
  application_steps: string[]
  official_link: string
  deadline: string | null
  updated_at: string | null
}

async function main() {
  const url = process.env.SUPABASE_URL || process.env.VITE_SUPABASE_URL
  const key = process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.SUPABASE_SERVICE_KEY
  if (!url) throw new Error('Missing SUPABASE_URL (or VITE_SUPABASE_URL)')
  if (!key) throw new Error('Missing SUPABASE_SERVICE_ROLE_KEY')

  const supabase = createClient(String(url), String(key), {
    auth: { persistSession: false, autoRefreshToken: false },
  })

  const rows: SchemeRowInsert[] = (SCHEMES as Scheme[]).map((s) => ({
    id: s.id,
    name: s.name,
    ministry: s.ministry,
    state: s.state,
    category: s.category,
    description: s.description,
    benefit: s.benefit,
    eligibility: s.eligibility || {},
    documents: Array.isArray(s.documents) ? s.documents : [],
    application_steps: Array.isArray(s.applicationSteps) ? s.applicationSteps : [],
    official_link: s.officialLink,
    deadline: s.deadline ?? null,
    updated_at: parseUpdatedAt(s.updatedAt ?? null),
  }))

  const chunkSize = 500
  let done = 0
  for (let i = 0; i < rows.length; i += chunkSize) {
    const chunk = rows.slice(i, i + chunkSize)
    const { error } = await supabase.from('schemes').upsert(chunk, { onConflict: 'id' })
    if (error) throw error
    done += chunk.length
    process.stdout.write(`\rUpserted ${done}/${rows.length} schemes`)
  }

  process.stdout.write('\n')
  const { count } = await supabase.from('schemes').select('id', { count: 'exact', head: true })
  process.stdout.write(`Supabase schemes table count: ${count ?? 'unknown'}\n`)
}

main().catch((err) => {
  process.stderr.write(`${String(err?.message || err)}\n`)
  process.exit(1)
})

