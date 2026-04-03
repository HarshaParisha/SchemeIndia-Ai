import { useEffect, useState } from 'react'
import { useUser } from '@/lib/auth'
import toast from 'react-hot-toast'

import { mockApi } from '@/lib/mockApi'
import Skeleton from '@/components/shared/Skeleton'

export default function Profile() {
  const { user } = useUser()
  const [loading, setLoading] = useState(true)
  const [profile, setProfile] = useState<any>(null)

  useEffect(() => {
    let mounted = true
    ;(async () => {
      try {
        const res = await mockApi.getProfile()
        if (!mounted) return
        setProfile(res)
      } catch {
        setProfile(null)
      } finally {
        if (mounted) setLoading(false)
      }
    })()
    return () => {
      mounted = false
    }
  }, [])

  const save = async () => {
    try {
      await mockApi.updateProfile({
        name: profile?.name || user?.fullName || 'Demo User',
        email: profile?.email || user?.primaryEmailAddress?.emailAddress || 'demo@bharatcare.local',
      })
      toast.success('Saved')
    } catch {
      toast.error('Could not save. Please try again.')
    }
  }

  const reset = async () => {
    try {
      await mockApi.resetAll()
      setProfile(null)
      toast.success('Reset complete')
    } catch {
      toast.error('Could not reset. Please try again.')
    }
  }

  return (
    <div className="space-y-6">
      <div className="rounded-card border border-brand-border bg-white/75 p-6 shadow-ambient">
        <div className="font-display text-[28px] font-medium tracking-tight">Profile</div>
        <div className="mt-2 text-sm text-brand-muted">Your details live on your device for now (mock data).</div>
      </div>

      <div className="rounded-card border border-brand-border bg-white/75 p-6 shadow-subtle">
        <div className="font-display text-[18px] font-medium tracking-tight">Personal details</div>
        {loading ? (
          <Skeleton className="mt-4 h-36" />
        ) : (
          <div className="mt-4 grid gap-3 sm:grid-cols-2">
            <div>
              <div className="text-sm font-medium">Name</div>
              <input
                className="mt-2 h-11 w-full rounded-control border border-brand-border bg-white px-3 text-sm shadow-subtle"
                value={profile?.name || ''}
                onChange={(e) => setProfile((p: any) => ({ ...p, name: e.target.value }))}
              />
            </div>
            <div>
              <div className="text-sm font-medium">Email</div>
              <input
                className="mt-2 h-11 w-full rounded-control border border-brand-border bg-white px-3 text-sm shadow-subtle"
                value={profile?.email || ''}
                onChange={(e) => setProfile((p: any) => ({ ...p, email: e.target.value }))}
              />
            </div>
            <div className="sm:col-span-2">
              <button
                className="mt-2 h-11 rounded-control bg-brand-primary px-5 text-sm font-medium text-white shadow-ambient hover:opacity-95"
                type="button"
                onClick={save}
              >
                Save
              </button>
            </div>
          </div>
        )}
      </div>

      <div className="rounded-card border border-brand-border bg-white/75 p-6 shadow-subtle">
        <div className="font-display text-[18px] font-medium tracking-tight">Reset demo data</div>
        <div className="mt-2 text-sm text-brand-muted">Clears your onboarding, journal, moods, and saved schemes from this device.</div>
        <button
          type="button"
          onClick={reset}
          className="mt-4 h-11 rounded-control border border-brand-border bg-white/80 px-5 text-sm shadow-subtle hover:bg-white"
        >
          Reset
        </button>
      </div>
    </div>
  )
}
