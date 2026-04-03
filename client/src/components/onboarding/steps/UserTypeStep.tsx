import { type UserType } from '@/store/useSchemeFinderStore'

export default function UserTypeStep({
  userTypes,
  value,
  onSelect,
}: {
  userTypes: UserType[]
  value: UserType | null
  onSelect: (t: UserType) => void
}) {
  return (
    <div className="grid gap-2">
      <div className="text-sm font-semibold text-brand-dark">Select user type</div>
      <div className="grid gap-2 sm:grid-cols-2">
        {userTypes.map((t) => (
          <button
            key={t}
            type="button"
            onClick={() => onSelect(t)}
            className={
              'h-11 rounded-control border px-3 text-left text-sm shadow-subtle ' +
              (value === t ? 'border-brand-primary bg-brand-bg' : 'border-brand-border bg-white hover:bg-brand-bg')
            }
          >
            {t}
          </button>
        ))}
      </div>
      <div className="text-xs text-brand-muted">Optional. If unsure, choose “Other”.</div>
    </div>
  )
}

