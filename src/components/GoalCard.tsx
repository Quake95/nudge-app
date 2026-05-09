import { Goal } from './types'
import ProgressBar from './ProgressBar'

interface GoalCardProps {
  goal: Goal
  accent?: string
  onEdit?: (goal: Goal) => void
}

const statusConfig = {
  'not-started': { label: 'Not Started', bg: 'bg-stone-100', text: 'text-stone-500' },
  'in-progress': { label: 'In Progress', bg: 'bg-amber-50', text: 'text-amber-700' },
  'complete': { label: 'Complete', bg: 'bg-emerald-50', text: 'text-emerald-700' },
}

export default function GoalCard({ goal, accent = 'gold', onEdit }: GoalCardProps) {
  const status = statusConfig[goal.status]
  const date = new Date(goal.targetDate).toLocaleDateString('en-AU', {
    month: 'short', year: 'numeric'
  })

  return (
    <div className="bg-white rounded-2xl p-6 shadow-sm border border-stone-100 hover:shadow-md transition-shadow duration-300 flex flex-col gap-4 group">
      <div className="flex items-start justify-between gap-3">
        <h3 className="font-serif text-lg font-medium text-stone-800 leading-snug">{goal.title}</h3>
        <div className="flex items-center gap-2 shrink-0">
          <span className={`text-xs font-medium px-2.5 py-1 rounded-full ${status.bg} ${status.text}`}>
            {status.label}
          </span>
          {onEdit && (
            <button
              onClick={() => onEdit(goal)}
              className="opacity-0 group-hover:opacity-100 transition-opacity p-1.5 rounded-lg hover:bg-stone-100 text-stone-400 hover:text-stone-600"
              title="Edit goal"
            >
              <svg className="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                <path strokeLinecap="round" strokeLinejoin="round" d="M15.232 5.232l3.536 3.536m-2.036-5.036a2.5 2.5 0 113.536 3.536L6.5 21.036H3v-3.572L16.732 3.732z" />
              </svg>
            </button>
          )}
        </div>
      </div>

      <p className="text-sm text-stone-500 leading-relaxed">{goal.description}</p>

      <div>
        <div className="flex justify-between text-xs text-stone-400 mb-1.5">
          <span>Progress</span>
          <span>{goal.progress}%</span>
        </div>
        <ProgressBar progress={goal.progress} color={accent} />
      </div>

      <div className="flex flex-wrap gap-3 text-xs text-stone-400">
        <span>📅 {date}</span>
        {goal.budget && <span>💰 {goal.budget}</span>}
        {goal.destinations && <span>📍 {goal.destinations.join(', ')}</span>}
        {goal.target && goal.status !== 'complete' && (
          <span>🎯 {goal.current} / {goal.target}</span>
        )}
      </div>

      <div className="pt-3 border-t border-stone-100">
        <p className="text-xs text-stone-400 mb-1 font-medium uppercase tracking-wide">Next action</p>
        <p className="text-sm text-stone-600">{goal.nextAction}</p>
      </div>
    </div>
  )
}
