import { IN_STATES } from '@/lib/constants'

export default function LocationStep({
  state,
  district,
  districts,
  onState,
  onDistrict,
  stateError,
  districtError,
}: {
  state: string
  district: string
  districts: string[]
  onState: (v: string) => void
  onDistrict: (v: string) => void
  stateError?: string
  districtError?: string
}) {
  return (
    <div className="space-y-3">
      <div>
        <div className="text-sm font-semibold text-brand-dark">State</div>
        <select
          className="mt-2 h-11 w-full rounded-control border border-brand-border bg-white px-3 text-sm shadow-subtle"
          value={state}
          onChange={(e) => onState(e.target.value)}
        >
          <option value="">Select</option>
          {IN_STATES.map((s) => (
            <option key={s} value={s}>
              {s}
            </option>
          ))}
        </select>
        {stateError ? <div className="mt-2 text-sm text-brand-warning">{stateError}</div> : null}
      </div>

      <div>
        <div className="text-sm font-semibold text-brand-dark">District</div>
        <select
          className="mt-2 h-11 w-full rounded-control border border-brand-border bg-white px-3 text-sm shadow-subtle"
          value={district}
          onChange={(e) => onDistrict(e.target.value)}
          disabled={!state}
        >
          <option value="">Select</option>
          {districts.map((d) => (
            <option key={d} value={d}>
              {d}
            </option>
          ))}
        </select>
        {districtError ? <div className="mt-2 text-sm text-brand-warning">{districtError}</div> : null}
      </div>
    </div>
  )
}

