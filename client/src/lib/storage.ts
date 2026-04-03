export function safeParseJSON<T>(raw: string | null): T | null {
  if (!raw) return null
  try {
    return JSON.parse(raw) as T
  } catch {
    return null
  }
}

export function readJSON<T>(key: string, fallback: T): T {
  const raw = typeof window !== 'undefined' ? window.localStorage.getItem(key) : null
  const parsed = safeParseJSON<T>(raw)
  return parsed ?? fallback
}

export function writeJSON<T>(key: string, value: T) {
  if (typeof window === 'undefined') return
  window.localStorage.setItem(key, JSON.stringify(value))
}

export function removeKey(key: string) {
  if (typeof window === 'undefined') return
  window.localStorage.removeItem(key)
}

export function sleep(ms: number) {
  return new Promise((resolve) => window.setTimeout(resolve, ms))
}

export function uid(prefix = 'id') {
  const c = globalThis.crypto
  if (c && 'randomUUID' in c) return `${prefix}_${(c as any).randomUUID()}`
  return `${prefix}_${Math.random().toString(16).slice(2)}_${Date.now().toString(16)}`
}
