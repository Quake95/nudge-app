'use client'

import { useState } from 'react'
import { ActionItem } from './types'

interface TaskListProps {
  items: ActionItem[]
}

const priorityColor: Record<string, string> = {
  high: 'bg-rose-400',
  medium: 'bg-amber-400',
  low: 'bg-emerald-400',
}

const categoryColor: Record<string, string> = {
  Financial: 'text-amber-600 bg-amber-50',
  Travel: 'text-sky-600 bg-sky-50',
  Family: 'text-rose-600 bg-rose-50',
  Home: 'text-emerald-600 bg-emerald-50',
}

export default function TaskList({ items }: TaskListProps) {
  const [tasks, setTasks] = useState(items)

  const toggle = (id: string) => {
    setTasks(prev => prev.map(t => t.id === id ? { ...t, completed: !t.completed } : t))
  }

  const done = tasks.filter(t => t.completed).length
  const total = tasks.length

  return (
    <div className="bg-white rounded-2xl p-6 shadow-sm border border-stone-100">
      <div className="flex items-center justify-between mb-6">
        <p className="text-sm text-stone-500">{done} of {total} complete</p>
        <div className="w-32 bg-stone-200 rounded-full h-1.5">
          <div
            className="bg-yellow-400 h-1.5 rounded-full transition-all duration-500"
            style={{ width: `${(done / total) * 100}%` }}
          />
        </div>
      </div>
      <ul className="space-y-3">
        {tasks.map((task) => (
          <li
            key={task.id}
            onClick={() => toggle(task.id)}
            className={`flex items-start gap-3 p-3 rounded-xl cursor-pointer transition-all duration-200 group ${task.completed ? 'opacity-50' : 'hover:bg-stone-50'}`}
          >
            <div className={`mt-0.5 w-5 h-5 rounded-full border-2 flex items-center justify-center shrink-0 transition-all ${task.completed ? 'bg-yellow-400 border-yellow-400' : 'border-stone-300 group-hover:border-yellow-400'}`}>
              {task.completed && (
                <svg className="w-3 h-3 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={3}>
                  <path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7" />
                </svg>
              )}
            </div>
            <div className="flex-1 min-w-0">
              <p className={`text-sm text-stone-700 ${task.completed ? 'line-through' : ''}`}>{task.title}</p>
              <div className="flex gap-2 mt-1 flex-wrap">
                <span className={`text-xs px-2 py-0.5 rounded-full font-medium ${categoryColor[task.category] || 'text-stone-500 bg-stone-100'}`}>
                  {task.category}
                </span>
                <span className="text-xs text-stone-400">
                  Due {new Date(task.dueDate).toLocaleDateString('en-AU', { day: 'numeric', month: 'short' })}
                </span>
              </div>
            </div>
            <div className={`w-1.5 h-1.5 rounded-full mt-2 shrink-0 ${priorityColor[task.priority]}`} />
          </li>
        ))}
      </ul>
    </div>
  )
}
