import type { Caste, Gender, IncomeRange } from '@/store/useSchemeFinderStore'

export default function PersonalDetailsStep({
  genders,
  incomeRanges,
  castes,
  age,
  gender,
  incomeRange,
  caste,
  onAge,
  onGender,
  onIncomeRange,
  onCaste,
}: {
  genders: Gender[]
  incomeRanges: IncomeRange[]
  castes: Caste[]
  age: number | null
  gender: Gender | null
  incomeRange: IncomeRange | null
  caste: Caste | null
  onAge: (v: number | null) => void
  onGender: (v: Gender | null) => void
  onIncomeRange: (v: IncomeRange | null) => void
  onCaste: (v: Caste | null) => void
}) {
  return (
    <div className="grid gap-3">
      <div className="grid gap-3 sm:grid-cols-2">
        <div>
          <div className="text-sm font-semibold text-brand-dark">Age</div>
          <input
            className="mt-2 h-11 w-full rounded-control border border-brand-border bg-white px-3 text-sm shadow-subtle"
            inputMode="numeric"
            placeholder="e.g. 28"
            value={age ?? ''}
            onChange={(e) => onAge(e.target.value ? Number(e.target.value) : null)}
          />
        </div>

        <div>
          <div className="text-sm font-semibold text-brand-dark">Gender</div>
          <select
            className="mt-2 h-11 w-full rounded-control border border-brand-border bg-white px-3 text-sm shadow-subtle"
            value={gender || ''}
            onChange={(e) => onGender((e.target.value || null) as any)}
          >
            <option value="">Select</option>
            {genders.map((g) => (
              <option key={g} value={g}>
                {g}
              </option>
            ))}
          </select>
        </div>
      </div>

      <div className="grid gap-3 sm:grid-cols-2">
        <div>
          <div className="text-sm font-semibold text-brand-dark">Income range (yearly)</div>
          <select
            className="mt-2 h-11 w-full rounded-control border border-brand-border bg-white px-3 text-sm shadow-subtle"
            value={incomeRange || ''}
            onChange={(e) => onIncomeRange((e.target.value || null) as any)}
          >
            <option value="">Select</option>
            {incomeRanges.map((r) => (
              <option key={r} value={r}>
                {r}
              </option>
            ))}
          </select>
        </div>

        <div>
          <div className="text-sm font-semibold text-brand-dark">Caste</div>
          <select
            className="mt-2 h-11 w-full rounded-control border border-brand-border bg-white px-3 text-sm shadow-subtle"
            value={caste || ''}
            onChange={(e) => onCaste((e.target.value || null) as any)}
          >
            <option value="">Select</option>
            {castes.map((c) => (
              <option key={c} value={c}>
                {c}
              </option>
            ))}
          </select>
        </div>
      </div>
    </div>
  )
}

