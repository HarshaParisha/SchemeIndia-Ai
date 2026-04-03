import { useEffect, useMemo, useState } from 'react'

import { useAppStore } from '@/store/useAppStore'

export default function InstallPromptBanner() {
  const { installPromptEvent, setInstallPromptEvent } = useAppStore()
  const [visible, setVisible] = useState(false)

  const canShow = useMemo(() => Boolean(installPromptEvent), [installPromptEvent])

  useEffect(() => {
    const t = window.setTimeout(() => {
      if (canShow) setVisible(true)
    }, 20000)
    return () => window.clearTimeout(t)
  }, [canShow])

  if (!visible || !installPromptEvent) return null

  return (
    <div className="fixed bottom-4 left-4 right-4 z-50 mx-auto max-w-md rounded-card border border-brand-border bg-white p-4 shadow-subtle">
      <div className="flex items-start justify-between gap-3">
        <div>
          <div className="text-sm font-medium">Install SchemeIndia</div>
          <div className="mt-1 text-xs text-brand-dark/80">Works faster and supports offline access for your saved schemes and recent pages.</div>
        </div>
        <button
          className="h-9 rounded-control border border-brand-border bg-white px-3 text-xs hover:bg-[#fbfbfa]"
          onClick={() => setVisible(false)}
        >
          Not now
        </button>
      </div>
      <div className="mt-3 flex gap-2">
        <button
          className="h-10 flex-1 rounded-control bg-brand-primary text-sm font-medium text-white shadow-subtle hover:opacity-95"
          onClick={async () => {
            try {
              await installPromptEvent.prompt()
              await installPromptEvent.userChoice
            } finally {
              setInstallPromptEvent(null)
              setVisible(false)
            }
          }}
        >
          Install
        </button>
        <button
          className="h-10 flex-1 rounded-control border border-brand-border bg-white text-sm hover:bg-[#fbfbfa]"
          onClick={() => {
            setInstallPromptEvent(null)
            setVisible(false)
          }}
        >
          Dismiss
        </button>
      </div>
    </div>
  )
}
