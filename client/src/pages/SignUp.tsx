import { SignUp } from '@clerk/clerk-react'
import { useMemo, useState } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import toast from 'react-hot-toast'

import { useAuth } from '@/lib/auth'
import { ROUTES } from '@/lib/constants'

export default function SignUpPage() {
  const key = import.meta.env.VITE_CLERK_PUBLISHABLE_KEY
  const { signInWithEmail, signInWithGoogle } = useAuth() as any
  const navigate = useNavigate()

  const [name, setName] = useState('')
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [loading, setLoading] = useState(false)

  const canSubmit = useMemo(
    () => name.trim().length > 1 && email.trim().length > 3 && password.trim().length > 3,
    [name, email, password],
  )

  if (key) {
    return (
      <div className="mx-auto max-w-6xl px-4 py-10">
        <div className="mx-auto max-w-md rounded-card border border-brand-border bg-white/75 p-6 shadow-ambient">
          <div className="font-display text-[22px] font-medium tracking-tight">Create your account</div>
          <div className="mt-2 text-sm text-brand-muted">Then we’ll personalize your dashboard.</div>
          <div className="mt-6">
            <SignUp routing="path" path={ROUTES.signup} />
          </div>
        </div>
      </div>
    )
  }

  return (
    <div className="mx-auto max-w-6xl px-4 py-10">
      <div className="mx-auto max-w-md rounded-card border border-brand-border bg-white/75 p-6 shadow-ambient">
        <div className="font-display text-[22px] font-medium tracking-tight">Get started</div>
        <div className="mt-2 text-sm text-brand-muted">Create an account to unlock Dashboard, Disha, and more.</div>

        <button
          type="button"
          className="mt-5 inline-flex h-11 w-full items-center justify-center rounded-control border border-brand-border bg-white/85 text-sm shadow-subtle hover:bg-white"
          onClick={() => {
            signInWithGoogle?.()
            toast.success('Account created')
            navigate(ROUTES.onboarding)
          }}
        >
          Continue with Google
        </button>

        <div className="my-5 flex items-center gap-3">
          <div className="h-px flex-1 bg-brand-border" />
          <div className="text-xs text-brand-muted">or</div>
          <div className="h-px flex-1 bg-brand-border" />
        </div>

        <div className="space-y-3">
          <div>
            <div className="text-sm font-medium">Name</div>
            <input
              className="mt-2 h-11 w-full rounded-control border border-brand-border bg-white/70 px-3 text-sm shadow-subtle"
              value={name}
              onChange={(e) => setName(e.target.value)}
              placeholder="Your name"
              autoComplete="name"
            />
          </div>
          <div>
            <div className="text-sm font-medium">Email</div>
            <input
              className="mt-2 h-11 w-full rounded-control border border-brand-border bg-white/70 px-3 text-sm shadow-subtle"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              placeholder="you@example.com"
              inputMode="email"
              autoComplete="email"
            />
          </div>
          <div>
            <div className="text-sm font-medium">Password</div>
            <input
              className="mt-2 h-11 w-full rounded-control border border-brand-border bg-white/70 px-3 text-sm shadow-subtle"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              placeholder="••••••••"
              type="password"
              autoComplete="new-password"
            />
            <div className="mt-2 text-xs text-brand-muted">In the demo, any password works.</div>
          </div>

          <button
            type="button"
            disabled={!canSubmit || loading}
            className="mt-1 h-11 w-full rounded-control bg-brand-primary px-5 text-sm font-medium text-white shadow-ambient hover:opacity-95 disabled:opacity-50"
            onClick={() => {
              setLoading(true)
              try {
                signInWithEmail?.(email.trim(), name.trim())
                toast.success('Account created')
                navigate(ROUTES.onboarding)
              } finally {
                setLoading(false)
              }
            }}
          >
            Create account
          </button>
        </div>

        <div className="mt-5 text-sm text-brand-muted">
          Already have an account?{' '}
          <Link to={ROUTES.signin} className="text-brand-primary underline">
            Sign in
          </Link>
        </div>
      </div>
    </div>
  )
}

