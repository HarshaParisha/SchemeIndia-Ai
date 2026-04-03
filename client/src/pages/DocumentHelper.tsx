import { useEffect, useState } from 'react'
import toast from 'react-hot-toast'

import { mockApi } from '@/lib/mockApi'
import Skeleton from '@/components/shared/Skeleton'

export default function DocumentHelper() {
  const [loading, setLoading] = useState(false)
  const [historyLoading, setHistoryLoading] = useState(true)
  const [explanation, setExplanation] = useState('')
  const [items, setItems] = useState<any[]>([])
  const [file, setFile] = useState<File | null>(null)
  const [pastedText, setPastedText] = useState('')

  const loadHistory = async () => {
    try {
      const res = await mockApi.listDocuments()
      setItems(res)
    } catch {
      setItems([])
    } finally {
      setHistoryLoading(false)
    }
  }

  useEffect(() => {
    loadHistory()
  }, [])

  const explain = async () => {
    if (!file) {
      toast.error('Choose a file first.')
      return
    }
    setLoading(true)
    setExplanation('')
    try {
      const res = await mockApi.explainDocument({ filename: file.name, pastedText })
      setExplanation(res)
      toast.success('Explained')
      setHistoryLoading(true)
      await loadHistory()
    } catch {
      toast.error('Could not explain this file. Please try again.')
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="space-y-6">
      <div className="rounded-card border border-brand-border bg-white/75 p-6 shadow-ambient">
        <div className="font-display text-[28px] font-medium tracking-tight">Document Helper</div>
        <div className="mt-2 text-sm text-brand-muted">
          Upload a PDF/image. For best results in this mock demo, paste any important text below.
        </div>
      </div>

      <div className="rounded-card border border-brand-border bg-white/75 p-6 shadow-subtle">
        <div className="font-display text-[18px] font-medium tracking-tight">Upload</div>
        <input
          className="mt-3 block w-full text-sm"
          type="file"
          accept="application/pdf,image/*"
          onChange={(e) => {
            const f = e.target.files?.[0]
            setFile(f || null)
          }}
        />

        <div className="mt-4">
          <div className="text-sm font-medium">Paste important text (optional)</div>
          <textarea
            className="mt-2 w-full rounded-control border border-brand-border bg-white/70 p-3 text-sm shadow-subtle"
            rows={6}
            placeholder="If your PDF is a scan, paste key text here (eligibility, dates, instructions)…"
            value={pastedText}
            onChange={(e) => setPastedText(e.target.value)}
          />
          <div className="mt-1 text-xs text-brand-muted">{pastedText.length} characters</div>
        </div>

        <button
          type="button"
          onClick={explain}
          disabled={!file || loading}
          className="mt-4 h-11 rounded-control bg-brand-primary px-5 text-sm font-medium text-white shadow-ambient hover:opacity-95 disabled:opacity-50"
        >
          Explain
        </button>

        {loading ? <Skeleton className="mt-4 h-40" /> : null}
        {explanation ? (
          <div className="mt-4 rounded-card border border-brand-border bg-brand-bg/60 p-4 text-sm whitespace-pre-wrap">
            {explanation}
          </div>
        ) : null}
      </div>

      <div className="rounded-card border border-brand-border bg-white/75 p-6 shadow-subtle">
        <div className="font-display text-[18px] font-medium tracking-tight">History</div>
        {historyLoading ? (
          <div className="mt-4 space-y-2">
            <Skeleton className="h-14" />
            <Skeleton className="h-14" />
          </div>
        ) : (
          <div className="mt-4 space-y-2">
            {items.map((i) => (
              <div key={i.id} className="rounded-control border border-brand-border bg-brand-bg/60 p-3">
                <div className="text-sm font-medium">{i.filename}</div>
                <div className="mt-1 text-xs text-brand-muted">{new Date(i.createdAt).toLocaleString()}</div>
              </div>
            ))}
            {items.length === 0 ? <div className="text-sm text-brand-muted">No documents yet.</div> : null}
          </div>
        )}
      </div>
    </div>
  )
}
