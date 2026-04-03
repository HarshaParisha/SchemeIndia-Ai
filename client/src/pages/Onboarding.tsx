import { useNavigate } from 'react-router-dom'

import OnboardingWizard from '@/components/onboarding/OnboardingWizard'
import { Button } from '@/components/ui/button'
import { ROUTES } from '@/lib/constants'

export default function Onboarding() {
  const navigate = useNavigate()

  return (
    <div className="space-y-6">
      <div className="rounded-card border border-brand-border bg-white p-6 shadow-subtle">
        <div className="flex flex-wrap items-start justify-between gap-4">
          <div>
            <div className="text-[28px] font-semibold tracking-tight text-brand-dark">Onboarding</div>
            <div className="mt-2 text-[16px] text-brand-muted">Answer 5 quick questions to personalise your matches.</div>
          </div>
          <Button variant="ghost" className="h-11" onClick={() => navigate(ROUTES.schemes)}>
            Skip
          </Button>
        </div>
      </div>

      <OnboardingWizard onDone={() => navigate(ROUTES.dashboard)} />
    </div>
  )
}

