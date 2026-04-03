import { SignedIn, SignedOut } from '@/lib/auth'
import { Link } from 'react-router-dom'

import { ROUTES } from '@/lib/constants'

export default function ProtectedRoute({ children }: { children: React.ReactNode }) {
  return (
    <>
      <SignedIn>{children}</SignedIn>
      <SignedOut>
        <div className="mx-auto max-w-xl rounded-card border border-brand-border bg-brand-card p-6 shadow-subtle">
          <div className="font-display text-lg font-medium tracking-tight">Sign in to continue</div>
          <div className="mt-2 text-sm text-brand-muted">
            Dashboard, Disha, schemes, wellness, and rooms are private to your account.
          </div>
          <div className="mt-5 flex flex-col gap-2 sm:flex-row">
            <Link
              to={ROUTES.signin}
              className="inline-flex h-10 items-center justify-center rounded-control bg-brand-primary px-4 text-sm font-medium text-white shadow-ambient hover:opacity-95"
            >
              Sign in
            </Link>
            <Link
              to={ROUTES.signup}
              className="inline-flex h-10 items-center justify-center rounded-control border border-brand-border bg-white/80 px-4 text-sm shadow-subtle hover:bg-white"
            >
              Create account
            </Link>
          </div>
          <Link to={ROUTES.landing} className="mt-4 inline-flex text-sm text-brand-primary underline">
            Back to SchemeIndia
          </Link>
        </div>
      </SignedOut>
    </>
  )
}
