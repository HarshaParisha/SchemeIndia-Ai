import { cloneElement, createContext, useCallback, useContext, useMemo, useState } from 'react'
import {
  ClerkProvider,
  SignedIn as ClerkSignedIn,
  SignedOut as ClerkSignedOut,
  SignInButton as ClerkSignInButton,
  UserButton as ClerkUserButton,
  useAuth as useClerkAuth,
  useUser as useClerkUser,
} from '@clerk/clerk-react'

type MockUser = {
  id: string
  firstName?: string
  fullName?: string
  primaryEmailAddress?: { emailAddress: string }
}

type AuthContextValue = {
  isSignedIn: boolean
  user: MockUser | null
  signInWithEmail: (email: string, name?: string) => void
  signInWithGoogle: () => void
  signOut: () => void
  getToken: () => Promise<string | null>
}

const AuthContext = createContext<AuthContextValue | null>(null)

function getStoredMockUser(): MockUser | null {
  try {
    const raw = localStorage.getItem('bharatcare_mock_user')
    if (!raw) return null
    return JSON.parse(raw) as MockUser
  } catch {
    return null
  }
}

function setStoredMockUser(user: MockUser | null) {
  try {
    if (!user) localStorage.removeItem('bharatcare_mock_user')
    else localStorage.setItem('bharatcare_mock_user', JSON.stringify(user))
  } catch {
    return
  }
}

function MockAuthProvider({ children }: { children: React.ReactNode }) {
  const [user, setUser] = useState<MockUser | null>(() => getStoredMockUser())
  const isSignedIn = !!user

  const signInWithEmail = useCallback((email: string, name?: string) => {
    const display = (name || '').trim() || email.split('@')[0] || 'Friend'
    const next: MockUser = {
      id: 'demo-user',
      firstName: display,
      fullName: display,
      primaryEmailAddress: { emailAddress: email.trim() || 'demo@bharatcare.local' },
    }
    setUser(next)
    setStoredMockUser(next)
  }, [])

  const signInWithGoogle = useCallback(() => {
    const next: MockUser = {
      id: 'demo-user',
      firstName: 'Asha',
      fullName: 'Asha (Google)',
      primaryEmailAddress: { emailAddress: 'asha@gmail.com' },
    }
    setUser(next)
    setStoredMockUser(next)
  }, [])

  const signOut = useCallback(() => {
    setUser(null)
    setStoredMockUser(null)
  }, [])

  const getToken = useCallback(async () => null, [])

  const value = useMemo<AuthContextValue>(
    () => ({ isSignedIn, user, signInWithEmail, signInWithGoogle, signOut, getToken }),
    [getToken, isSignedIn, signInWithEmail, signInWithGoogle, signOut, user],
  )

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>
}

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const key = import.meta.env.VITE_CLERK_PUBLISHABLE_KEY
  if (key) {
    return <ClerkProvider publishableKey={key}>{children}</ClerkProvider>
  }
  return <MockAuthProvider>{children}</MockAuthProvider>
}

export function SignedIn({ children }: { children: React.ReactNode }) {
  const key = import.meta.env.VITE_CLERK_PUBLISHABLE_KEY
  if (key) return <ClerkSignedIn>{children}</ClerkSignedIn>
  const ctx = useContext(AuthContext)
  if (!ctx?.isSignedIn) return null
  return <>{children}</>
}

export function SignedOut({ children }: { children: React.ReactNode }) {
  const key = import.meta.env.VITE_CLERK_PUBLISHABLE_KEY
  if (key) return <ClerkSignedOut>{children}</ClerkSignedOut>
  const ctx = useContext(AuthContext)
  if (ctx?.isSignedIn) return null
  return <>{children}</>
}

export function SignInButton({ children }: { children: React.ReactElement; mode?: 'modal' }) {
  const key = import.meta.env.VITE_CLERK_PUBLISHABLE_KEY
  if (key) return <ClerkSignInButton mode="modal">{children}</ClerkSignInButton>
  const ctx = useContext(AuthContext)
  const onClick = (e: any) => {
    children.props.onClick?.(e)
    const email = ctx?.user?.primaryEmailAddress?.emailAddress || 'demo@bharatcare.local'
    ctx?.signInWithEmail(email, 'Demo')
  }
  return cloneElement(children, { onClick })
}

export function UserButton() {
  const key = import.meta.env.VITE_CLERK_PUBLISHABLE_KEY
  if (key) return <ClerkUserButton />
  const ctx = useContext(AuthContext)
  return (
    <button
      type="button"
      onClick={() => ctx?.signOut()}
      className="h-8 rounded-control px-2 text-xs text-brand-dark hover:bg-brand-bg"
      aria-label="Sign out"
    >
      Sign out
    </button>
  )
}

export function useUser() {
  const key = import.meta.env.VITE_CLERK_PUBLISHABLE_KEY
  if (key) return useClerkUser()
  const ctx = useContext(AuthContext)
  return { user: ctx?.user || null }
}

export function useAuth() {
  const key = import.meta.env.VITE_CLERK_PUBLISHABLE_KEY
  if (key) return useClerkAuth()
  const ctx = useContext(AuthContext)
  return {
    getToken: ctx?.getToken,
    isSignedIn: ctx?.isSignedIn ?? false,
    signInWithEmail: ctx?.signInWithEmail,
    signInWithGoogle: ctx?.signInWithGoogle,
    signOut: ctx?.signOut,
  }
}
