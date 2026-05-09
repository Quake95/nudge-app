'use client'

import { Goal } from './types'
import ProgressBar from './ProgressBar'

interface Props {
  goals: Goal[]
  onEdit: (goal: Goal) => void
}

const categoryConfig: Record<string, { dot: string; badge: string; text: string; accent: string }> = {
  Financial: { dot: 'bg-yellow-400', badge: 'bg-amber-50 text-amber-700', text: 'text-amber-700', accent: 'gold' },
  Travel:    { dot: 'bg-sky-400',    badge: 'bg-sky-50 text-sky-700',     text: 'text-sky-700',   accent: 'blue' },
  Family:    { dot: 'bg-rose-400',   badge: 'bg-rose-50 text-rose-700',   text: 'text-rose-700',  accent: 'rose' },
  Home:      { dot: 'bg-emerald-400',badge: 'bg-emerald-50 text-emerald-700', text: 'text-emerald-700', accent: 'green' },
}

const statusConfig = {
  'not-started': { label: 'Not Started', cls: 'bg-stone-100 text-stone-500' },
  'in-progress':  { label: 'In Progress', cls: 'bg-amber-50 text-amber-700' },
  'complete':     { label: 'Complete',    cls: 'bg-emerald-50 text-emerald-700' },
}

function getMonthKey(dateStr: string) {
  const d = new Date(dateStr)
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}`
}

function monthLabel(key: string) {
  const [year, month] = key.split('-')
  return new Date(Number(year), Number(month) - 1, 1).toLocaleDateString('en-AU', { month: 'long', year: 'numeric' })
}

export default function TimelineView({ goals, onEdit }: Props) {
  const sorted = [...goals].sort(
    (a, b) => new Date(a.targetDate).getTime() - new Date(b.targetDate).getTime()
  )

  const groups = new Map<string, Goal[]>()
  sorted.forEach(goal => {
    const key = getMonthKey(goal.targetDate)
    if (!groups.has(key)) groups.set(key, [])
    groups.get(key)!.push(goal)
  })

  const today = new Date()
  const currentKey = `${today.getFullYear()}-${String(today.getMonth() + 1).padStart(2, '0')}`

  return (
    <section className="max-w-3xl mx-auto px-6 py-16">
      <div className="text-center mb-14">
        <p className="text-xs font-semibold tracking-widest uppercase text-yellow-500 mb-2">2026 Roadmap</p>
        <h2 className="font-serif text-3xl text-stone-800 mb-2">Goal Timeline</h2>
        <p className="text-stone-500 text-sm">All goals mapped out by target date</p>
      </div>

      <div className="relative">
        {/* Vertical spine */}
        <div className="absolute left-[11px] top-3 bottom-3 w-0.5 bg-stone-200 rounded-full" />

        <div className="flex flex-col gap-10">
          {Array.from(groups.entries()).map(([key, monthGoals]) => {
            const isCurrent = key === currentKey
            const isPast = key < currentKey

            return (
              <div key={key}>
                {/* Month marker */}
                <div className="flex items-center gap-4 mb-5">
                  <div className={`relative z-10 w-6 h-6 rounded-full shrink-0 ring-2 ring-[#FAF7F2] ${
                    isCurrent ? 'bg-stone-800' : isPast ? 'bg-stone-300' : 'bg-white border-2 border-stone-300'
                  }`} />
                  <span className={`font-serif text-lg ${isCurrent ? 'text-stone-800 font-semibold' : 'text-stone-500'}`}>
                    {monthLabel(key)}
                  </span>
                  {isCurrent && (
                    <span className="text-xs font-semibold tracking-widest uppercase text-yellow-500">← Now</span>
                  )}
                </div>

                {/* Goals for this month */}
                <div className="ml-12 flex flex-col gap-4">
                  {monthGoals.map(goal => {
                    const cat = categoryConfig[goal.category] || categoryConfig.Financial
                    const status = statusConfig[goal.status]

                    return (
                      <div key={goal.id} className="relative group">
                        {/* Connector dot on the spine */}
                        <div className={`absolute -left-[33px] top-5 w-2.5 h-2.5 rounded-full ${cat.dot} ring-2 ring-[#FAF7F2] z-10`} />

                        <div className="bg-white rounded-2xl p-5 shadow-sm border border-stone-100 hover:shadow-md transition-shadow">
                          <div className="flex items-start justify-between gap-3 mb-2">
                            <div>
                              <h3 className="font-serif text-base font-medium text-stone-800 leading-snug">
                                {goal.title}
                              </h3>
                              <div className="flex items-center gap-2 mt-1 flex-wrap">
                                <span className={`text-xs font-medium px-2 py-0.5 rounded-full ${cat.badge}`}>
                                  {goal.category}
                                </span>
                                <span className={`text-xs font-medium px-2 py-0.5 rounded-full ${status.cls}`}>
                                  {status.label}
                                </span>
                                <span className="text-xs text-stone-400">
                                  📅 {new Date(goal.targetDate).toLocaleDateString('en-AU', { month: 'short', year: 'numeric' })}
                                </span>
                              </div>
                            </div>
                            <button
                              onClick={() => onEdit(goal)}
                              className="opacity-0 group-hover:opacity-100 transition-opacity shrink-0 p-1.5 rounded-lg hover:bg-stone-100 text-stone-400 hover:text-stone-600"
                              title="Edit goal"
                            >
                              <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                                <path strokeLinecap="round" strokeLinejoin="round" d="M15.232 5.232l3.536 3.536m-2.036-5.036a2.5 2.5 0 113.536 3.536L6.5 21.036H3v-3.572L16.732 3.732z" />
                              </svg>
                            </button>
                          </div>

                          {goal.description && (
                            <p className="text-xs text-stone-500 mb-3 leading-relaxed">{goal.description}</p>
                          )}

                          <div className="flex justify-between text-xs text-stone-400 mb-1.5">
                            <span>Progress</span>
                            <span>{goal.progress}%</span>
                          </div>
                          <ProgressBar progress={goal.progress} color={cat.accent} />

                          {goal.nextAction && (
                            <div className="mt-3 pt-3 border-t border-stone-100">
                              <p className="text-xs text-stone-400">
                                Next: <span className="text-stone-600">{goal.nextAction}</span>
                              </p>
                            </div>
                          )}
                        </div>
                      </div>
                    )
                  })}
                </div>
              </div>
            )
          })}
        </div>
      </div>
    </section>
  )
}
