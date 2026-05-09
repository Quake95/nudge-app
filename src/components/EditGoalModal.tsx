'use client'

import { useState, useEffect } from 'react'
import { Goal } from './types'

interface FrameworkInsight {
  framework: 'atomic-habits' | 'woop' | 'okr' | 'one-thing'
  label: string
  rationale: string
  extras: Record<string, string | string[]>
}

interface Props {
  goal: Goal | null
  defaultCategory: string
  onSave: (goal: Goal) => void
  onDelete?: (id: string) => void
  onClose: () => void
}

const categoryOptions = ['Financial', 'Travel', 'Family', 'Home']
const statusOptions = [
  { value: 'not-started', label: 'Not Started' },
  { value: 'in-progress', label: 'In Progress' },
  { value: 'complete', label: 'Complete' },
]

const frameworkColors: Record<string, string> = {
  'atomic-habits': 'bg-emerald-100 text-emerald-700',
  'woop': 'bg-violet-100 text-violet-700',
  'okr': 'bg-blue-100 text-blue-700',
  'one-thing': 'bg-orange-100 text-orange-700',
}

function InsightCard({ insight }: { insight: FrameworkInsight }) {
  const { framework, label, rationale, extras } = insight
  const badgeClass = frameworkColors[framework] ?? 'bg-stone-100 text-stone-600'

  return (
    <div className="rounded-2xl border border-amber-200 bg-amber-50 p-4 mb-4">
      <div className="flex items-center gap-2 mb-2">
        <span className="text-lg">✦</span>
        <span className={`text-xs font-semibold px-2 py-0.5 rounded-full ${badgeClass}`}>
          {label}
        </span>
      </div>
      <p className="text-sm text-amber-800 mb-3">{rationale}</p>

      {framework === 'atomic-habits' && (
        <div className="flex flex-col gap-2">
          {extras.identity && (
            <p className="text-sm italic text-stone-700 border-l-2 border-amber-300 pl-3">
              &ldquo;{extras.identity}&rdquo;
            </p>
          )}
          {Array.isArray(extras.milestones) && extras.milestones.length > 0 && (
            <div>
              <p className="text-xs font-medium text-stone-500 uppercase tracking-wide mb-1">Milestones</p>
              <ol className="flex flex-col gap-1">
                {(extras.milestones as string[]).map((m, i) => (
                  <li key={i} className="text-sm text-stone-700 flex gap-2">
                    <span className="text-amber-500 font-medium shrink-0">{i + 1}.</span>{m}
                  </li>
                ))}
              </ol>
            </div>
          )}
        </div>
      )}

      {framework === 'woop' && (
        <div className="flex flex-col gap-2">
          {extras.obstacle && (
            <div>
              <p className="text-xs font-medium text-stone-500 uppercase tracking-wide mb-0.5">Main Obstacle</p>
              <p className="text-sm text-stone-700">{extras.obstacle as string}</p>
            </div>
          )}
          {extras.ifThen && (
            <div>
              <p className="text-xs font-medium text-stone-500 uppercase tracking-wide mb-0.5">If–Then Plan</p>
              <p className="text-sm text-stone-700 italic">{extras.ifThen as string}</p>
            </div>
          )}
        </div>
      )}

      {framework === 'okr' && (
        <div className="flex flex-col gap-2">
          {extras.objective && (
            <div>
              <p className="text-xs font-medium text-stone-500 uppercase tracking-wide mb-0.5">Objective</p>
              <p className="text-sm text-stone-700">{extras.objective as string}</p>
            </div>
          )}
          {Array.isArray(extras.keyResults) && extras.keyResults.length > 0 && (
            <div>
              <p className="text-xs font-medium text-stone-500 uppercase tracking-wide mb-1">Key Results</p>
              <ul className="flex flex-col gap-1">
                {(extras.keyResults as string[]).map((kr, i) => (
                  <li key={i} className="text-sm text-stone-700 flex gap-2">
                    <span className="text-amber-500 shrink-0">◆</span>{kr}
                  </li>
                ))}
              </ul>
            </div>
          )}
        </div>
      )}

      {framework === 'one-thing' && extras.dominoQuestion && (
        <div>
          <p className="text-xs font-medium text-stone-500 uppercase tracking-wide mb-0.5">The ONE Question</p>
          <p className="text-sm text-stone-700 italic">&ldquo;{extras.dominoQuestion as string}&rdquo;</p>
        </div>
      )}
    </div>
  )
}

export default function EditGoalModal({ goal, defaultCategory, onSave, onDelete, onClose }: Props) {
  const isNew = !goal
  const [mode, setMode] = useState<'describe' | 'manual'>(isNew ? 'describe' : 'manual')
  const [rawDescription, setRawDescription] = useState('')
  const [redraftOpen, setRedraftOpen] = useState(false)
  const [redraftText, setRedraftText] = useState('')
  const [aiLoading, setAiLoading] = useState(false)
  const [aiError, setAiError] = useState('')
  const [insight, setInsight] = useState<FrameworkInsight | null>(null)
  const [showForm, setShowForm] = useState(!isNew)

  const [form, setForm] = useState({
    title: '',
    description: '',
    category: defaultCategory,
    status: 'not-started' as Goal['status'],
    progress: 0,
    targetDate: '',
    nextAction: '',
    budget: '',
    target: '',
    current: '',
  })

  useEffect(() => {
    if (goal) {
      setForm({
        title: goal.title,
        description: goal.description,
        category: goal.category,
        status: goal.status,
        progress: goal.progress,
        targetDate: goal.targetDate,
        nextAction: goal.nextAction,
        budget: goal.budget || '',
        target: goal.target || '',
        current: goal.current || '',
      })
    }
  }, [goal])

  const set = (field: string, value: string | number) =>
    setForm(f => ({ ...f, [field]: value } as typeof f))

  const callIdeate = async (description: string) => {
    setAiLoading(true)
    setAiError('')
    try {
      const res = await fetch('/api/ideate', {
        method: 'POST',
        headers: { 'content-type': 'application/json' },
        body: JSON.stringify({ description, category: form.category || defaultCategory }),
      })
      if (!res.ok) {
        const err = await res.json()
        throw new Error(err.error || 'Something went wrong')
      }
      const data = await res.json()
      const g = data.goal
      setForm(f => ({
        ...f,
        title: g.title || f.title,
        description: g.description || f.description,
        category: g.category || f.category,
        status: g.status || f.status,
        progress: g.progress ?? f.progress,
        targetDate: g.targetDate || f.targetDate,
        nextAction: g.nextAction || f.nextAction,
        budget: g.budget || f.budget,
        target: g.target || f.target,
        current: g.current || f.current,
      }))
      setInsight(data.insight || null)
      setShowForm(true)
      setRedraftOpen(false)
    } catch (e: unknown) {
      setAiError(e instanceof Error ? e.message : 'Failed to draft goal')
    } finally {
      setAiLoading(false)
    }
  }

  const handleDraft = () => callIdeate(rawDescription)

  const handleRedraft = () => callIdeate(redraftText || `${form.title}: ${form.description}`)

  const openRedraft = () => {
    setRedraftText(`${form.title}: ${form.description}`)
    setRedraftOpen(true)
    setAiError('')
  }

  const handleReDescribe = () => {
    setShowForm(false)
    setInsight(null)
    setAiError('')
  }

  const handleSave = () => {
    if (!form.title.trim() || !form.targetDate) return
    const saved: Goal = {
      id: goal?.id || `custom-${Date.now()}`,
      title: form.title,
      description: form.description,
      category: form.category,
      status: form.status,
      progress: form.progress,
      targetDate: form.targetDate,
      nextAction: form.nextAction,
      budget: form.budget || undefined,
      target: form.target || undefined,
      current: form.current || undefined,
    }
    onSave(saved)
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
      <div className="absolute inset-0 bg-black/30 backdrop-blur-sm" onClick={onClose} />
      <div className="relative bg-white rounded-3xl shadow-2xl w-full max-w-lg max-h-[90vh] overflow-y-auto">
        <div className="p-8">

          {/* Header */}
          <div className="flex items-center justify-between mb-6">
            <h2 className="font-serif text-2xl text-stone-800">
              {goal ? 'Edit Goal' : 'Add New Goal'}
            </h2>
            <div className="flex items-center gap-3">
              {!isNew && !redraftOpen && (
                <button
                  onClick={openRedraft}
                  className="text-xs font-medium text-amber-600 hover:text-amber-700 transition-colors flex items-center gap-1"
                >
                  ✦ Re-draft with AI
                </button>
              )}
              <button onClick={onClose} className="text-stone-400 hover:text-stone-600 transition-colors text-xl leading-none">
                ×
              </button>
            </div>
          </div>

          {/* Re-draft panel (edit mode) */}
          {!isNew && redraftOpen && (
            <div className="mb-5 rounded-2xl border border-amber-200 bg-amber-50 p-4 flex flex-col gap-3">
              <p className="text-xs font-medium text-amber-700 uppercase tracking-wide">Re-draft with AI</p>
              <textarea
                value={redraftText}
                onChange={e => setRedraftText(e.target.value)}
                rows={3}
                autoFocus
                className="w-full border border-amber-200 rounded-xl px-3 py-2.5 text-sm text-stone-800 bg-white focus:outline-none focus:ring-2 focus:ring-amber-300 resize-none"
                placeholder="Describe the goal differently…"
              />
              {aiError && <p className="text-sm text-red-500">{aiError}</p>}
              <div className="flex gap-2">
                <button
                  onClick={handleRedraft}
                  disabled={!redraftText.trim() || aiLoading}
                  className="flex-1 py-2 bg-stone-800 text-white rounded-xl text-sm font-medium hover:bg-stone-700 transition-colors disabled:opacity-40 disabled:cursor-not-allowed flex items-center justify-center gap-2"
                >
                  {aiLoading ? (
                    <><span className="inline-block w-3.5 h-3.5 border-2 border-white/30 border-t-white rounded-full animate-spin" /> Re-drafting…</>
                  ) : '✦ Re-draft'}
                </button>
                <button
                  onClick={() => { setRedraftOpen(false); setAiError('') }}
                  className="px-4 py-2 text-sm text-stone-500 hover:text-stone-700 transition-colors"
                >
                  Cancel
                </button>
              </div>
            </div>
          )}

          {/* Mode toggle (new goals only) */}
          {isNew && (
            <div className="flex bg-stone-100 rounded-full p-1 gap-1 mb-6">
              <button
                onClick={() => { setMode('describe'); setShowForm(false); setInsight(null) }}
                className={`flex-1 px-4 py-1.5 rounded-full text-sm font-medium transition-all ${
                  mode === 'describe' ? 'bg-white text-stone-800 shadow-sm' : 'text-stone-500 hover:text-stone-700'
                }`}
              >
                ✦ Describe it
              </button>
              <button
                onClick={() => { setMode('manual'); setShowForm(true) }}
                className={`flex-1 px-4 py-1.5 rounded-full text-sm font-medium transition-all ${
                  mode === 'manual' ? 'bg-white text-stone-800 shadow-sm' : 'text-stone-500 hover:text-stone-700'
                }`}
              >
                Fill in manually
              </button>
            </div>
          )}

          {/* Describe mode — input stage */}
          {mode === 'describe' && !showForm && (
            <div className="flex flex-col gap-4">
              <p className="text-sm text-stone-500">
                Word-vomit your thoughts — we&apos;ll structure it into a goal using the right framework.
              </p>
              <textarea
                value={rawDescription}
                onChange={e => setRawDescription(e.target.value)}
                rows={5}
                autoFocus
                className="w-full border border-stone-200 rounded-xl px-4 py-3 text-sm text-stone-800 focus:outline-none focus:ring-2 focus:ring-stone-300 resize-none placeholder:text-stone-300"
                placeholder="e.g. We want to travel more but money feels tight and the baby's coming. Maybe Japan? Or somewhere easier first…"
              />
              {aiError && <p className="text-sm text-red-500">{aiError}</p>}
              <button
                onClick={handleDraft}
                disabled={!rawDescription.trim() || aiLoading}
                className="w-full py-3 bg-stone-800 text-white rounded-xl text-sm font-medium hover:bg-stone-700 transition-colors disabled:opacity-40 disabled:cursor-not-allowed flex items-center justify-center gap-2"
              >
                {aiLoading ? (
                  <><span className="inline-block w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" /> Drafting your goal…</>
                ) : '✦ Draft with AI'}
              </button>
            </div>
          )}

          {/* Form */}
          {showForm && (
            <>
              {mode === 'describe' && insight && (
                <button
                  onClick={handleReDescribe}
                  className="text-sm text-stone-500 hover:text-stone-700 transition-colors mb-4 flex items-center gap-1"
                >
                  ← Re-describe
                </button>
              )}

              {insight && <InsightCard insight={insight} />}

              <div className="flex flex-col gap-4">
                <div>
                  <label className="block text-xs font-medium text-stone-500 uppercase tracking-wide mb-1.5">Title *</label>
                  <input
                    type="text"
                    value={form.title}
                    onChange={e => set('title', e.target.value)}
                    className="w-full border border-stone-200 rounded-xl px-4 py-2.5 text-sm text-stone-800 focus:outline-none focus:ring-2 focus:ring-stone-300"
                    placeholder="Goal title"
                  />
                </div>

                <div>
                  <label className="block text-xs font-medium text-stone-500 uppercase tracking-wide mb-1.5">Description</label>
                  <textarea
                    value={form.description}
                    onChange={e => set('description', e.target.value)}
                    rows={3}
                    className="w-full border border-stone-200 rounded-xl px-4 py-2.5 text-sm text-stone-800 focus:outline-none focus:ring-2 focus:ring-stone-300 resize-none"
                    placeholder="Describe this goal..."
                  />
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="block text-xs font-medium text-stone-500 uppercase tracking-wide mb-1.5">Category</label>
                    <select
                      value={form.category}
                      onChange={e => set('category', e.target.value)}
                      className="w-full border border-stone-200 rounded-xl px-4 py-2.5 text-sm text-stone-800 focus:outline-none focus:ring-2 focus:ring-stone-300 bg-white"
                    >
                      {categoryOptions.map(c => <option key={c} value={c}>{c}</option>)}
                    </select>
                  </div>
                  <div>
                    <label className="block text-xs font-medium text-stone-500 uppercase tracking-wide mb-1.5">Status</label>
                    <select
                      value={form.status}
                      onChange={e => set('status', e.target.value)}
                      className="w-full border border-stone-200 rounded-xl px-4 py-2.5 text-sm text-stone-800 focus:outline-none focus:ring-2 focus:ring-stone-300 bg-white"
                    >
                      {statusOptions.map(s => <option key={s.value} value={s.value}>{s.label}</option>)}
                    </select>
                  </div>
                </div>

                <div>
                  <label className="block text-xs font-medium text-stone-500 uppercase tracking-wide mb-1.5">
                    Progress — {form.progress}%
                  </label>
                  <input
                    type="range"
                    min={0}
                    max={100}
                    value={form.progress}
                    onChange={e => set('progress', Number(e.target.value))}
                    className="w-full accent-stone-700"
                  />
                </div>

                <div>
                  <label className="block text-xs font-medium text-stone-500 uppercase tracking-wide mb-1.5">Target Date *</label>
                  <input
                    type="date"
                    value={form.targetDate}
                    onChange={e => set('targetDate', e.target.value)}
                    className="w-full border border-stone-200 rounded-xl px-4 py-2.5 text-sm text-stone-800 focus:outline-none focus:ring-2 focus:ring-stone-300"
                  />
                </div>

                <div>
                  <label className="block text-xs font-medium text-stone-500 uppercase tracking-wide mb-1.5">Next Action</label>
                  <input
                    type="text"
                    value={form.nextAction}
                    onChange={e => set('nextAction', e.target.value)}
                    className="w-full border border-stone-200 rounded-xl px-4 py-2.5 text-sm text-stone-800 focus:outline-none focus:ring-2 focus:ring-stone-300"
                    placeholder="What's the next step?"
                  />
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="block text-xs font-medium text-stone-500 uppercase tracking-wide mb-1.5">Target (optional)</label>
                    <input
                      type="text"
                      value={form.target}
                      onChange={e => set('target', e.target.value)}
                      className="w-full border border-stone-200 rounded-xl px-4 py-2.5 text-sm text-stone-800 focus:outline-none focus:ring-2 focus:ring-stone-300"
                      placeholder="e.g. £15,000"
                    />
                  </div>
                  <div>
                    <label className="block text-xs font-medium text-stone-500 uppercase tracking-wide mb-1.5">Current (optional)</label>
                    <input
                      type="text"
                      value={form.current}
                      onChange={e => set('current', e.target.value)}
                      className="w-full border border-stone-200 rounded-xl px-4 py-2.5 text-sm text-stone-800 focus:outline-none focus:ring-2 focus:ring-stone-300"
                      placeholder="e.g. £9,750"
                    />
                  </div>
                </div>

                <div>
                  <label className="block text-xs font-medium text-stone-500 uppercase tracking-wide mb-1.5">Budget (optional)</label>
                  <input
                    type="text"
                    value={form.budget}
                    onChange={e => set('budget', e.target.value)}
                    className="w-full border border-stone-200 rounded-xl px-4 py-2.5 text-sm text-stone-800 focus:outline-none focus:ring-2 focus:ring-stone-300"
                    placeholder="e.g. £5,000"
                  />
                </div>
              </div>

              <div className="flex items-center justify-between mt-8 pt-6 border-t border-stone-100">
                {onDelete ? (
                  <button
                    onClick={() => goal && onDelete(goal.id)}
                    className="text-sm text-red-400 hover:text-red-600 transition-colors"
                  >
                    Delete goal
                  </button>
                ) : <div />}
                <div className="flex gap-3">
                  <button onClick={onClose} className="px-5 py-2 text-sm text-stone-500 hover:text-stone-700 transition-colors">
                    Cancel
                  </button>
                  <button
                    onClick={handleSave}
                    disabled={!form.title.trim() || !form.targetDate}
                    className="px-6 py-2 bg-stone-800 text-white rounded-xl text-sm font-medium hover:bg-stone-700 transition-colors disabled:opacity-40 disabled:cursor-not-allowed"
                  >
                    Save
                  </button>
                </div>
              </div>
            </>
          )}
        </div>
      </div>
    </div>
  )
}
