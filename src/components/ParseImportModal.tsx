'use client'

import { useState } from 'react'
import { Goal } from './types'

interface FrameworkInsight {
  framework: 'atomic-habits' | 'woop' | 'okr' | 'one-thing'
  label: string
  rationale: string
  extras: Record<string, string | string[]>
}

interface ParsedGoal {
  goal: Goal
  insight: FrameworkInsight
}

interface Props {
  onImport: (goals: Goal[]) => void
  onClose: () => void
}

const frameworkColors: Record<string, string> = {
  'atomic-habits': 'bg-emerald-100 text-emerald-700',
  'woop': 'bg-violet-100 text-violet-700',
  'okr': 'bg-blue-100 text-blue-700',
  'one-thing': 'bg-orange-100 text-orange-700',
}

const categoryColors: Record<string, string> = {
  Financial: 'bg-yellow-50 border-yellow-200',
  Travel: 'bg-sky-50 border-sky-200',
  Family: 'bg-rose-50 border-rose-200',
  Home: 'bg-emerald-50 border-emerald-200',
}

export default function ParseImportModal({ onImport, onClose }: Props) {
  const [step, setStep] = useState<'input' | 'review'>('input')
  const [text, setText] = useState('')
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')
  const [parsed, setParsed] = useState<ParsedGoal[]>([])
  const [selected, setSelected] = useState<Set<number>>(new Set())

  const handleParse = async () => {
    if (!text.trim()) return
    setLoading(true)
    setError('')
    try {
      const res = await fetch('/api/parse', {
        method: 'POST',
        headers: { 'content-type': 'application/json' },
        body: JSON.stringify({ text }),
      })
      if (!res.ok) {
        const err = await res.json()
        throw new Error(err.error || 'Something went wrong')
      }
      const data = await res.json()
      const goals: ParsedGoal[] = data.goals.map((g: ParsedGoal) => ({
        goal: { ...g.goal, id: `import-${Date.now()}-${Math.random().toString(36).slice(2)}` },
        insight: g.insight,
      }))
      setParsed(goals)
      setSelected(new Set(goals.map((_, i) => i)))
      setStep('review')
    } catch (e: unknown) {
      setError(e instanceof Error ? e.message : 'Failed to parse goals')
    } finally {
      setLoading(false)
    }
  }

  const toggleSelect = (i: number) => {
    setSelected(prev => {
      const next = new Set(prev)
      next.has(i) ? next.delete(i) : next.add(i)
      return next
    })
  }

  const toggleAll = () => {
    setSelected(prev => prev.size === parsed.length ? new Set() : new Set(parsed.map((_, i) => i)))
  }

  const handleImport = () => {
    const goals = [...selected].sort((a, b) => a - b).map(i => parsed[i].goal)
    onImport(goals)
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
      <div className="absolute inset-0 bg-black/30 backdrop-blur-sm" onClick={onClose} />
      <div className="relative bg-white rounded-3xl shadow-2xl w-full max-w-2xl max-h-[90vh] flex flex-col">

        {/* Header */}
        <div className="flex items-center justify-between px-8 pt-8 pb-4 shrink-0">
          <div>
            <h2 className="font-serif text-2xl text-stone-800">Bulk Import Goals</h2>
            <p className="text-sm text-stone-400 mt-0.5">
              {step === 'input'
                ? 'Paste your goal notes — one per line, bullet points, or free text'
                : `${parsed.length} goal${parsed.length !== 1 ? 's' : ''} found — select which to add`}
            </p>
          </div>
          <button onClick={onClose} className="text-stone-400 hover:text-stone-600 transition-colors text-xl leading-none">
            ×
          </button>
        </div>

        {/* Input step */}
        {step === 'input' && (
          <div className="flex flex-col gap-4 px-8 pb-8">
            <textarea
              value={text}
              onChange={e => setText(e.target.value)}
              rows={10}
              autoFocus
              className="w-full border border-stone-200 rounded-xl px-4 py-3 text-sm text-stone-800 focus:outline-none focus:ring-2 focus:ring-stone-300 resize-none placeholder:text-stone-300 font-mono"
              placeholder={`- Save £20k emergency fund by end of year\n- Japan trip with Steph before baby arrives\n- Finish the nursery — we keep putting it off\n- Start running again, even just 2x a week\n- Sort out life insurance, been meaning to do this for ages`}
            />
            {error && <p className="text-sm text-red-500">{error}</p>}
            <button
              onClick={handleParse}
              disabled={!text.trim() || loading}
              className="w-full py-3 bg-stone-800 text-white rounded-xl text-sm font-medium hover:bg-stone-700 transition-colors disabled:opacity-40 disabled:cursor-not-allowed flex items-center justify-center gap-2"
            >
              {loading ? (
                <><span className="inline-block w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" /> Parsing your goals…</>
              ) : '✦ Parse & Structure'}
            </button>
          </div>
        )}

        {/* Review step */}
        {step === 'review' && (
          <>
            <div className="overflow-y-auto flex-1 px-8 pb-4">
              {/* Select all */}
              <div className="flex items-center justify-between mb-4">
                <button
                  onClick={toggleAll}
                  className="text-xs text-stone-500 hover:text-stone-700 transition-colors underline underline-offset-2"
                >
                  {selected.size === parsed.length ? 'Deselect all' : 'Select all'}
                </button>
                <span className="text-xs text-stone-400">{selected.size} of {parsed.length} selected</span>
              </div>

              <div className="flex flex-col gap-3">
                {parsed.map((item, i) => {
                  const isSelected = selected.has(i)
                  const cardColor = categoryColors[item.goal.category] ?? 'bg-stone-50 border-stone-200'
                  const badgeColor = frameworkColors[item.insight?.framework] ?? 'bg-stone-100 text-stone-600'

                  return (
                    <button
                      key={i}
                      onClick={() => toggleSelect(i)}
                      className={`w-full text-left rounded-2xl border-2 p-4 transition-all ${
                        isSelected
                          ? `${cardColor} shadow-sm`
                          : 'bg-white border-stone-100 opacity-50'
                      }`}
                    >
                      <div className="flex items-start gap-3">
                        {/* Checkbox */}
                        <div className={`mt-0.5 w-5 h-5 rounded-full border-2 shrink-0 flex items-center justify-center transition-all ${
                          isSelected ? 'border-stone-800 bg-stone-800' : 'border-stone-300'
                        }`}>
                          {isSelected && (
                            <svg className="w-3 h-3 text-white" viewBox="0 0 12 12" fill="none">
                              <path d="M2 6l3 3 5-5" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" />
                            </svg>
                          )}
                        </div>

                        <div className="flex-1 min-w-0">
                          <div className="flex items-center gap-2 flex-wrap mb-1">
                            <span className="font-medium text-stone-800 text-sm">{item.goal.title}</span>
                            <span className="text-xs text-stone-400">{item.goal.category}</span>
                            {item.insight && (
                              <span className={`text-xs font-medium px-2 py-0.5 rounded-full ${badgeColor}`}>
                                {item.insight.label}
                              </span>
                            )}
                          </div>
                          <p className="text-xs text-stone-500 line-clamp-2">{item.goal.description}</p>
                          {item.goal.nextAction && (
                            <p className="text-xs text-stone-400 mt-1">
                              <span className="font-medium">Next:</span> {item.goal.nextAction}
                            </p>
                          )}
                          {item.goal.targetDate && (
                            <p className="text-xs text-stone-400 mt-0.5">
                              <span className="font-medium">By:</span> {new Date(item.goal.targetDate).toLocaleDateString('en-GB', { month: 'short', year: 'numeric' })}
                            </p>
                          )}
                        </div>
                      </div>
                    </button>
                  )
                })}
              </div>
            </div>

            {/* Footer */}
            <div className="flex items-center justify-between px-8 py-5 border-t border-stone-100 shrink-0">
              <button
                onClick={() => { setStep('input'); setParsed([]); setSelected(new Set()) }}
                className="text-sm text-stone-500 hover:text-stone-700 transition-colors flex items-center gap-1"
              >
                ← Edit text
              </button>
              <div className="flex gap-3">
                <button onClick={onClose} className="px-5 py-2 text-sm text-stone-500 hover:text-stone-700 transition-colors">
                  Cancel
                </button>
                <button
                  onClick={handleImport}
                  disabled={selected.size === 0}
                  className="px-6 py-2 bg-stone-800 text-white rounded-xl text-sm font-medium hover:bg-stone-700 transition-colors disabled:opacity-40 disabled:cursor-not-allowed"
                >
                  Add {selected.size} goal{selected.size !== 1 ? 's' : ''}
                </button>
              </div>
            </div>
          </>
        )}
      </div>
    </div>
  )
}
