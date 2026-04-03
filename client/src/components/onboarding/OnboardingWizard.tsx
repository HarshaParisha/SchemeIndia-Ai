import { useEffect, useMemo, useState } from 'react'
import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { ChevronLeft, ChevronRight } from 'lucide-react'
import toast from 'react-hot-toast'

import { Button } from '@/components/ui/button'
import { getDistrictsForState } from '@/data/districts'
import { api, withAuthHeader } from '@/lib/api'
import { useAuth } from '@/lib/auth'
import {
  schemeFinderSchema,
  type SchemeFinderFormValues,
  CASTES,
  CONDITIONS,
  GENDERS,
  INCOME_RANGES,
  NEEDS,
  SCHEME_FINDER_STEPS,
  USER_TYPES,
} from '@/lib/schemeFinderConfig'
import { incomeRangeToUpper } from '@/lib/schemeMatcher'
import { mockApi } from '@/lib/mockApi'
import { useSchemeFinderStore } from '@/store/useSchemeFinderStore'

import LocationStep from './steps/LocationStep'
import MultiSelectStep from './steps/MultiSelectStep'
import PersonalDetailsStep from './steps/PersonalDetailsStep'
import UserTypeStep from './steps/UserTypeStep'

function clamp(n: number, a: number, b: number) {
  return Math.max(a, Math.min(b, n))
}

export default function OnboardingWizard({ onDone }: { onDone: () => void }) {
  const { getToken } = useAuth()
  const storeAnswers = useSchemeFinderStore((s) => s.answers)
  const setAnswer = useSchemeFinderStore((s) => s.setAnswer)
  const toggleCondition = useSchemeFinderStore((s) => s.toggleCondition)
  const toggleNeed = useSchemeFinderStore((s) => s.toggleNeed)

  const [step, setStep] = useState(0)
  const [saving, setSaving] = useState(false)

  const form = useForm<SchemeFinderFormValues>({
    resolver: zodResolver(schemeFinderSchema),
    defaultValues: storeAnswers as any,
    mode: 'onChange',
  })

  useEffect(() => {
    form.reset(storeAnswers as any)
  }, [])

  const values = form.watch()
  const districts = useMemo(() => getDistrictsForState(values.state || ''), [values.state])

  const goNext = async () => {
    const ok = step === 1 ? await form.trigger(['state', 'district']) : true
    if (!ok) return
    setStep((s) => clamp(s + 1, 0, SCHEME_FINDER_STEPS.length - 1))
    const v = form.getValues()
    ;(Object.keys(v) as Array<keyof SchemeFinderFormValues>).forEach((k) => setAnswer(k as any, (v as any)[k]))
  }

  const goPrev = () => setStep((s) => clamp(s - 1, 0, SCHEME_FINDER_STEPS.length - 1))

  const save = async () => {
    const ok = await form.trigger()
    if (!ok) return
    const v = form.getValues()
    ;(Object.keys(v) as Array<keyof SchemeFinderFormValues>).forEach((k) => setAnswer(k as any, (v as any)[k]))

    const income = incomeRangeToUpper(v.incomeRange as any)
    const payload = {
      userType: v.userType || undefined,
      state: v.state,
      district: v.district,
      age: typeof v.age === 'number' ? v.age : undefined,
      gender: v.gender || undefined,
      income: typeof income === 'number' ? income : undefined,
      casteCategory: v.caste || undefined,
      conditions: v.conditions || [],
      needs: v.needs || [],
    }

    try {
      setSaving(true)
      try {
        const headers = await withAuthHeader(getToken)
        await api.post('/api/user/onboarding', payload, { headers })
      } catch {
        await mockApi.updateProfile({
          userType: payload.userType,
          state: payload.state,
          district: payload.district,
          age: payload.age,
          gender: payload.gender,
          income: payload.income,
          casteCategory: payload.casteCategory,
          conditions: payload.conditions,
          needs: payload.needs,
        } as any)
      }
      toast.success('Saved. Welcome!')
      onDone()
    } catch {
      toast.error('Could not save your details. Please try again.')
    } finally {
      setSaving(false)
    }
  }

  const head = SCHEME_FINDER_STEPS[step]

  return (
    <div className="rounded-card border border-brand-border bg-white p-6 shadow-subtle">
      <div className="flex items-center justify-between gap-3">
        <div>
          <div className="text-xs font-semibold text-brand-muted">Step {step + 1} of {SCHEME_FINDER_STEPS.length}</div>
          <div className="mt-1 text-[20px] font-semibold text-brand-dark">{head.title}</div>
          <div className="mt-1 text-sm text-brand-muted">{head.desc}</div>
        </div>
        <div className="flex gap-2">
          <button
            type="button"
            className="inline-flex h-11 w-11 items-center justify-center rounded-control border border-brand-border bg-white shadow-subtle hover:bg-brand-bg disabled:opacity-50"
            disabled={step <= 0}
            onClick={goPrev}
            aria-label="Previous"
          >
            <ChevronLeft className="h-4 w-4" />
          </button>
          <button
            type="button"
            className="inline-flex h-11 w-11 items-center justify-center rounded-control border border-brand-border bg-white shadow-subtle hover:bg-brand-bg disabled:opacity-50"
            disabled={step >= SCHEME_FINDER_STEPS.length - 1}
            onClick={goNext}
            aria-label="Next"
          >
            <ChevronRight className="h-4 w-4" />
          </button>
        </div>
      </div>

      <div className="mt-5 space-y-4">
        {step === 0 ? (
          <UserTypeStep
            userTypes={USER_TYPES}
            value={form.watch('userType') as any}
            onSelect={(t) => {
              form.setValue('userType', t)
              setAnswer('userType', t)
            }}
          />
        ) : null}

        {step === 1 ? (
          <LocationStep
            state={form.watch('state')}
            district={form.watch('district')}
            districts={districts}
            onState={(v) => {
              form.setValue('state', v, { shouldValidate: true })
              form.setValue('district', '', { shouldValidate: true })
              setAnswer('state', v)
              setAnswer('district', '')
            }}
            onDistrict={(v) => {
              form.setValue('district', v, { shouldValidate: true })
              setAnswer('district', v)
            }}
            stateError={form.formState.errors.state?.message ? String(form.formState.errors.state.message) : undefined}
            districtError={form.formState.errors.district?.message ? String(form.formState.errors.district.message) : undefined}
          />
        ) : null}

        {step === 2 ? (
          <PersonalDetailsStep
            genders={GENDERS}
            incomeRanges={INCOME_RANGES}
            castes={CASTES}
            age={(form.watch('age') as any) ?? null}
            gender={(form.watch('gender') as any) ?? null}
            incomeRange={(form.watch('incomeRange') as any) ?? null}
            caste={(form.watch('caste') as any) ?? null}
            onAge={(v) => {
              form.setValue('age', v as any)
              setAnswer('age', v)
            }}
            onGender={(v) => {
              form.setValue('gender', v as any)
              setAnswer('gender', v as any)
            }}
            onIncomeRange={(v) => {
              form.setValue('incomeRange', v as any)
              setAnswer('incomeRange', v as any)
            }}
            onCaste={(v) => {
              form.setValue('caste', v as any)
              setAnswer('caste', v as any)
            }}
          />
        ) : null}

        {step === 3 ? (
          <MultiSelectStep
            title="Conditions (multi-select)"
            options={CONDITIONS}
            selected={(form.watch('conditions') || []) as any}
            onToggle={(c) => {
              toggleCondition(c as any)
              const next = new Set(form.watch('conditions') || [])
              if (next.has(c as any)) next.delete(c as any)
              else next.add(c as any)
              form.setValue('conditions', Array.from(next) as any)
            }}
          />
        ) : null}

        {step === 4 ? (
          <div>
            <MultiSelectStep
              title="Needs"
              options={NEEDS}
              selected={(form.watch('needs') || []) as any}
              onToggle={(c) => {
                toggleNeed(c as any)
                const next = new Set(form.watch('needs') || [])
                if (c === 'All') {
                  form.setValue('needs', next.has('All' as any) ? ([] as any) : (['All'] as any))
                  return
                }
                next.delete('All' as any)
                if (next.has(c as any)) next.delete(c as any)
                else next.add(c as any)
                form.setValue('needs', Array.from(next) as any)
              }}
            />
            <div className="mt-5">
              <Button className="h-11 w-full" onClick={save} disabled={saving}>
                {saving ? 'Saving…' : 'Save & continue'}
              </Button>
              <div className="mt-2 text-xs text-brand-muted">You can edit these later in Profile.</div>
            </div>
          </div>
        ) : null}
      </div>
    </div>
  )
}
