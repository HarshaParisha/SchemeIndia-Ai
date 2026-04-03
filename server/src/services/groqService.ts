import Groq from 'groq-sdk'

export const DISHA_SYSTEM_PROMPT =
  "You are Disha, a warm, knowledgeable, and deeply caring AI mentor built for first-generation Indian students, farmers, and working-class families. You have expert knowledge of Indian education systems, government schemes, scholarships, career paths, college admissions (JEE, NEET, state CETs, CUET), hostel applications, internship processes, and general life guidance. You speak simply, warmly, and without jargon. You never make the user feel stupid for asking anything. You always give specific, actionable answers. When someone shares something difficult, you acknowledge their feelings first before giving advice. You are the knowledgeable elder sibling that every first-generation student deserves. Keep responses concise but complete. Use simple paragraphs, not bullet point lists, unless listing steps."

export async function groqChat(params: {
  messages: Array<{ role: 'user' | 'assistant' | 'system'; content: string }>
}) {
  const apiKey = process.env.GROQ_API_KEY
  if (!apiKey) {
    const last = [...params.messages].reverse().find((m) => m.role === 'user')?.content || ''
    const snippet = last.slice(0, 220)
    const content =
      "Hi — I’m Disha. I’m here with you. I can still guide you in demo mode while AI is not connected.\n\n" +
      (snippet
        ? `You said: “${snippet}${last.length > 220 ? '…' : ''}”\n\n`
        : '') +
      'If you tell me your situation (where you’re stuck + what outcome you want), I’ll suggest the next 2–3 steps to take today.'
    return { content }
  }

  const client = new Groq({ apiKey })
  const completion = await client.chat.completions.create({
    model: 'llama-3.3-70b-versatile',
    messages: [{ role: 'system', content: DISHA_SYSTEM_PROMPT }, ...params.messages],
    temperature: 0.4,
    max_tokens: 700,
  })

  const content = completion.choices[0]?.message?.content || ''
  return { content }
}
