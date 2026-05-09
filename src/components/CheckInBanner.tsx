'use client'

import { useState, useEffect, useCallback } from 'react'
import { Goal } from './types'

interface PendingUpdate {
  id: string
  raw: string
  intent: string
  goalId: string | null
  goalTitle: string | null
  summary: string
  progressDelta: number | null
  newDate: string | null
  receivedAt: string
}

interface Props {
  goals: Goal[]
  onApply: (goalId: string, changes: Partial<Goal>) => void
}

const intentLabels: Record<string, { label: string; color: string }> = {
  progress_update: { label: 'Progress update', color: 'bg-emerald-100 text-emerald-700' },
  date_change: { label: 'Date change', color: 'bg-blue-100 text-blue-700' },
  goal_change: { label: 'Goal changed', color: 'bg-violet-100 text-violet-700' },
  stuck: { label: 'Feeling stuck', color: 'bg-red-100 text-red-600' },
  positive: { label: 'Good news', color: 'bg-emerald-100 text-emerald-700' },
  note: { label: 'Note', color: 'bg-stone-100 text-stone-600' },
}

export default function CheckInBanner({ goals, onApply }: Props) {
  const [updates, setUpdates] = useState<PendingUpdate[]>([])
  const [expanded, setExpanded] = useState(false)
  const [applying, setApplying] = useState<string | null>(null)

  const fetchPending = useCallback(async () => {
    try {
      const res = await fetch('/api/sms/pending')
      if (!res.ok) return
      const { pending } = await res.json()
      setUpdates(pending ?? [])
      if (pending?.length > 0) setExpanded(true)
    } catch {
      // silently fail — KV may not be configured yet
    }
  }, [])

  useEffect(() => {
    fetchPending()
  }, [fetchPending])

  const dismiss = async (id: string) => {
    await fetch('/api/sms/pending', {
      method: 'DELETE',
      headers: { 'content-type': 'application/json' },
      body: JSON.stringify({ id }),
    })
    setUpdates(prev => prev.filter(u => u.id !== id))
  }

  const apply = async (update: PendingUpdate) => {
    if (!update.goalId) { await dismiss(update.id); return }
    const goal = goals.find(g => g.id === update.goalId)
    if (!goal) { await dismiss(update.id); return }

    setApplying(update.id)
    const changes: Partial<Goal> = {}
    if (update.progressDelta !== null) changes.progress = Math.min(100, update.progressDelta)
    if (update.newDate) changes.targetDate = update.newDate
    if (update.intent === 'stuck') changes.status = 'in-progress'

    onApply(update.goalId, changes)
    await dismiss(update.id)
    setApplying(null)
  }

  const dismissAll = async () => {
    await fetch('/api/sms/pending', {
      method: 'DELETE',
      headers: { 'content-type': 'application/json' },
      body: JSON.stringify({ id: 'all' }),
    })
    setUpdates([])
    setExpanded(false)
  }

  if (updates.length === 0) return null

  return (
    <div className="max-w-6xl mx-auto px-6 pt-4">
      <div className="rounded-2xl border border-stone-200 bg-white shadow-sm overflow-hidden">
        {/* Header */}
        <button
          onClick={() => setExpanded(e => !e)}
          className="w-full flex items-center justify-between px-5 py-3.5 hover:bg-stone-50 transition-colors"
        >
          <div className="flex items-center gap-3">
            <span className="text-base">📱</span>
            <span className="text-sm font-medium text-stone-700">
              {updates.length} check-in repl{updates.length !== 1 ? 'ies' : 'y'} waiting to review
            </span>
            <span className="w-5 h-5 rounded-full bg-stone-800 text-white text-xs flex items-center justify-center font-medium">
              {updates.length}
            </span>
          </div>
          <span className={`text-stone-400 transition-transform text-xs ${expanded ? 'rotate-180' : ''}`}>▼</span>
        </button>

        {/* Updates list */}
        {expanded && (
          <div className="border-t border-stone-100 divide-y divide-stone-50">
            {updates.map(update => {
              const badge = intentLabels[update.intent] ?? intentLabels.note
              const matchedGoal = goals.find(g => g.id === update.goalId)
              const canApply = !!matchedGoal && (update.progressDelta !== null || !!update.newDate || update.intent === 'stuck')

              return (
                <div key={update.id} className="px-5 py-4 flex items-start gap-4">
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2 mb-1 flex-wrap">
                      <span className={`text-xs font-medium px-2 py-0.5 rounded-full ${badge.color}`}>
                        {badge.label}
                      </span>
                      {matchedGoal && (
                        <span className="text-xs text-stone-400">re: {matchedGoal.title}</span>
                      )}
                    </div>
                    <p className="text-sm text-stone-700">{update.summary}</p>
                    <p className="text-xs text-stone-400 mt-1 italic">&ldquo;{update.raw}&rdquo;</p>
                    {update.progressDelta !== null && (
                      <p className="text-xs text-emerald-600 mt-1">→ Sets progress to {update.progressDelta}%</p>
                    )}
                    {update.newDate && (
                      <p className="text-xs text-blue-600 mt-1">
                        → Updates target date to {new Date(update.newDate).toLocaleDateString('en-GB', { day: 'numeric', month: 'short', year: 'numeric' })}
                      </p>
                    )}
                  </div>
                  <div className="flex gap-2 shrink-0 mt-0.5">
                    {canApply && (
                      <button
                        onClick={() => apply(update)}
                        disabled={applying === update.id}
                        className="px-3 py-1.5 bg-stone-800 text-white rounded-lg text-xs font-medium hover:bg-stone-700 transition-colors disabled:opacity-40"
                      >
                        {applying === update.id ? '…' : 'Apply'}
                      </button>
                    )}
                    <button
                      onClick={() => dismiss(update.id)}
                      className="px-3 py-1.5 text-stone-400 hover:text-stone-600 rounded-lg text-xs transition-colors border border-stone-200 hover:border-stone-300"
                    >
                      Dismiss
                    </button>
                  </div>
                </div>
              )
            })}

            <div className="px-5 py-3 flex justify-end">
              <button onClick={dismissAll} className="text-xs text-stone-400 hover:text-stone-600 transition-colors">
                Dismiss all
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  )
}
