export default function LoadingSpinner({ label }: { label?: string }) {
  return (
    <div className="flex items-center justify-center py-12">
      <div className="flex items-center gap-3 rounded-control border border-brand-border bg-brand-card px-4 py-3 shadow-subtle">
        <div className="h-4 w-4 animate-spin rounded-full border-2 border-brand-border border-t-brand-accent" />
        <div className="text-sm text-brand-dark">{label || 'Loading…'}</div>
      </div>
    </div>
  )
}

