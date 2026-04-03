type Context = {
  profile?: {
    userType?: string
    state?: string
    district?: string
    needsSelected?: string[]
    situation?: string
    age?: number
    income?: number
    casteCategory?: string
    gender?: string
  } | null
}

function normalize(s: string) {
  return s.trim().toLowerCase()
}

function hasAny(hay: string, needles: string[]) {
  return needles.some((n) => hay.includes(n))
}

function pickOne<T>(arr: T[]) {
  return arr[Math.floor(Math.random() * arr.length)]
}

export function dishaIntro(ctx: Context) {
  const userType = ctx.profile?.userType
  const state = ctx.profile?.state
  const you = userType || state ? ` (${[userType, state].filter(Boolean).join(', ')})` : ''
  return (
    "Hi, I’m Disha." +
    you +
    " I’m here to guide you — college, jobs, scholarships, schemes, or just a hard day.\n\nTell me one thing: what are you trying to solve right now?"
  )
}

function shortAcknowledge(t: string) {
  if (hasAny(t, ['overwhelmed', 'stress', 'anxiety', 'panic', 'sad', 'lonely', 'pressure', 'tired'])) {
    return pickOne([
      'I hear you. This sounds heavy.',
      'That is a lot to carry. Thanks for telling me.',
      'Okay. You don’t have to handle this alone.',
      'I’m here. We’ll take it one step at a time.',
    ])
  }
  return pickOne([
    'Okay.',
    'Got it.',
    'Understood.',
    'Alright.',
  ])
}

function askForMissing(ctx: Context, fields: Array<'state' | 'age' | 'income' | 'userType'>) {
  const missing = fields.filter((f) => {
    if (!ctx.profile) return true
    const v = (ctx.profile as any)[f]
    return v === undefined || v === null || String(v).trim() === ''
  })
  if (missing.length === 0) return ''
  const label: Record<string, string> = {
    state: 'your state',
    age: 'your age',
    income: 'your approximate yearly family income',
    userType: 'who you are (student / farmer / working)',
  }
  return `\n\nQuick question so I don’t waste your time: what is ${label[missing[0]]}?`
}

export function dishaReply(userText: string, ctx: Context) {
  const t = normalize(userText)
  const profile = ctx.profile || null
  const situation = profile?.situation
  const base = shortAcknowledge(t)

  if (hasAny(t, ['suicide', 'kill myself', 'end it', 'harm myself', 'self harm'])) {
    return (
      base +
      "\n\nI’m really sorry you’re feeling this much pain. You deserve support right now.\n\nIf you’re in immediate danger, call your local emergency number. If you can, call iCall (9152987821) or Vandrevala Foundation (1860-2662-345) — free, confidential, 24/7.\n\nAre you safe right now? And which city/state are you in?"
    )
  }

  if (hasAny(t, ['what is schemeindia', 'what is bharatcare', 'what do you do', 'what can you do'])) {
    return (
      "SchemeIndia helps you discover government schemes in one place.\n\nIf you tell me who you are (student / farmer / working), your state, and what you need (education / health / housing / farming / business), I’ll point you to the right schemes and what to do first." +
      askForMissing(ctx, ['userType', 'state'])
    )
  }

  if (hasAny(t, ['jee', 'neet', 'cetu', 'cet', 'cuet', 'admission', 'hostel', 'scholarship'])) {
    return (
      base +
      (situation ? `\n\nYou told me: ${situation}.` : '') +
      "\n\nLet’s make this simple. Tell me 3 things: your class/year, your target exam (JEE/NEET/CUET/state CET), and your state.\n\nThen I will give you the next steps for this week — forms, documents, deadlines, and what to avoid." +
      askForMissing(ctx, ['state'])
    )
  }

  if (hasAny(t, ['resume', 'cv', 'interview', 'job', 'first job', 'internship'])) {
    return (
      base +
      "\n\nTell me your education and what job you want (example: sales, office admin, data entry, IT, nursing, electrician).\n\nIf you want a quick start: make a 1-page resume with name, phone, city, education, skills, and any small work/college projects. Then apply to 10 places and practice a 30-second intro." +
      "\n\nShare your resume points (even in short lines). I’ll rewrite it cleanly and tell you what to remove." 
    )
  }

  if (hasAny(t, ['scheme', 'yojana', 'pm kisan', 'mudra', 'ayushman', 'awas', 'scholarship portal', 'nsp'])) {
    return (
      base +
      "\n\nWe can find the right schemes without confusion. Tell me your state, age, and approximate yearly family income. Also tell me what you want: education / agriculture / health / housing / business." +
      askForMissing(ctx, ['state', 'age', 'income'])
    )
  }

  if (hasAny(t, ['document', 'form', 'notice', 'pdf', 'letter'])) {
    return (
      base +
      "\n\nOpen Document Helper and upload the file. If it is a scanned PDF, paste the important lines (eligibility, dates, instructions).\n\nIf you paste the text here, I’ll explain what it means and what to do next." 
    )
  }

  if (hasAny(t, ['stress', 'anxiety', 'panic', 'overwhelmed', 'sad', 'lonely', 'pressure'])) {
    return (
      base +
      "\n\nBefore anything — try this once: inhale 4, hold 2, exhale 6.\n\nNow tell me what is the main pressure: exams, money, family, health, relationship, or something else? I’ll help you pick one small step for today." 
    )
  }

  if (hasAny(t, ['farmer', 'crop', 'fertilizer', 'loan', 'mandi', 'market', 'insurance'])) {
    return (
      base +
      "\n\nTell me your state, your crop, and what problem you are facing (price, pests, water, loan, or insurance).\n\nThen I will suggest a simple plan: what to check today, which scheme can help, and what documents you should keep ready." +
      askForMissing(ctx, ['state'])
    )
  }

  return (
    base +
    "\n\nTell me your situation in one line, and what you want to happen. I will give you the next 2–3 steps — simple and doable." 
  )
}
