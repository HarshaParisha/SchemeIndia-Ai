export default function MultiSelectStep<T extends string>({
  title,
  options,
  selected,
  onToggle,
}: {
  title: string
  options: T[]
  selected: T[]
  onToggle: (v: T) => void
}) {
  return (
    <div>
      <div className="text-sm font-semibold text-brand-dark">{title}</div>
      <div className="mt-3 grid gap-2 sm:grid-cols-2">
        {options.map((c) => {
          const isOn = selected.includes(c)
          return (
            <button
              key={c}
              type="button"
              onClick={() => onToggle(c)}
              className={
                'h-11 rounded-control border px-3 text-left text-sm shadow-subtle ' +
                (isOn ? 'border-brand-primary bg-brand-bg' : 'border-brand-border bg-white hover:bg-brand-bg')
              }
            >
              {c}
            </button>
          )
        })}
      </div>
    </div>
  )
}

