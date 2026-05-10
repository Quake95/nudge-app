'use client'

import { useState, useEffect, useCallback } from 'react'
import { useRouter } from 'next/navigation'
import GoalCard from '@/components/GoalCard'
import SectionHeader from '@/components/SectionHeader'
import TaskList from '@/components/TaskList'
import VisionBoard from '@/components/VisionBoard'
import EditGoalModal from '@/components/EditGoalModal'
import TimelineView from '@/components/TimelineView'
import ParseImportModal from '@/components/ParseImportModal'
import SmsSettings from '@/components/SmsSettings'
import CheckInBanner from '@/components/CheckInBanner'
import { Goal, VisionItem, ActionItem } from '@/components/types'

import visionBoardData from '../../data/visionBoard.json'
import nextActionsData from '../../data/nextActions.json'

const COUPLE_KEY = 'nudge-couple-id'
const PROFILE_KEY = 'fgd-profile'

const sections = [
  { id: 'financial', title: 'Financial Goals', subtitle: 'Money & Security', accent: 'gold', category: 'Financial' },
  { id: 'travel', title: 'Travel Goals', subtitle: 'Adventures Ahead', accent: 'blue', category: 'Travel' },
  { id: 'family', title: 'Family & Baby Goals', subtitle: 'Growing Together', accent: 'rose', category: 'Family' },
  { id: 'home', title: 'Home Projects', subtitle: 'Our Space', accent: 'green', category: 'Home' },
]

export default function DashboardClient() {
  const router = useRouter()
  const [view, setView] = useState<'dashboard' | 'timeline'>('dashboard')
  const [goals, setGoals] = useState<Goal[]>([])
  const [coupleId, setCoupleId] = useState<string | null>(null)
  const [coupleName, setCoupleName] = useState('Your Board')
  const [editingGoal, setEditingGoal] = useState<Goal | null>(null)
  const [addingCategory, setAddingCategory] = useState<string | null>(null)
  const [modalOpen, setModalOpen] = useState(false)
  const [importOpen, setImportOpen] = useState(false)
  const [smsOpen, setSmsOpen] = useState(false)
  const [hydrated, setHydrated] = useState(false)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    const id = localStorage.getItem(COUPLE_KEY)
    const profile = localStorage.getItem(PROFILE_KEY)

    if (!id) {
      router.push('/onboard')
      return
    }

    if (profile) {
      const p = JSON.parse(profile)
      setCoupleName(p.coupleName || `${p.yourName} & ${p.partnerName}`)
    }

    setCoupleId(id)

    // Load goals from Supabase
    fetch(`/api/goals?coupleId=${id}`)
      .then(r => r.json())
      .then(data => {
        setGoals(data.goals ?? [])
        setLoading(false)
        setHydrated(true)
      })
      .catch(() => {
        setLoading(false)
        setHydrated(true)
      })
  }, [router])

  const saveGoals = useCallback(async (updated: Goal[]) => {
    setGoals(updated) // optimistic update — UI feels instant
    if (!coupleId) return
    try {
      await fetch('/api/goals', {
        method: 'POST',
        headers: { 'content-type': 'application/json' },
        body: JSON.stringify({ coupleId, goals: updated }),
      })
    } catch {
      // silently fail — goals are still in state
    }
  }, [coupleId])

  const handleSave = (goal: Goal) => {
    if (editingGoal) {
      saveGoals(goals.map(g => g.id === goal.id ? goal : g))
    } else {
      saveGoals([...goals, goal])
    }
    closeModal()
  }

  const handleDelete = async (id: string) => {
    const updated = goals.filter(g => g.id !== id)
    setGoals(updated)
    if (coupleId) {
      await fetch(`/api/goals?coupleId=${coupleId}&goalId=${id}`, { method: 'DELETE' })
    }
    closeModal()
  }

  const openEdit = (goal: Goal) => {
    setEditingGoal(goal)
    setAddingCategory(null)
    setModalOpen(true)
  }

  const openAdd = (category: string) => {
    setEditingGoal(null)
    setAddingCategory(category)
    setModalOpen(true)
  }

  const closeModal = () => {
    setModalOpen(false)
    setEditingGoal(null)
    setAddingCategory(null)
  }

  const handleImport = (newGoals: Goal[]) => {
    saveGoals([...goals, ...newGoals])
    setImportOpen(false)
  }

  const handleApplyUpdate = (goalId: string, changes: Partial<Goal>) => {
    saveGoals(goals.map(g => g.id === goalId ? { ...g, ...changes } : g))
  }

  const byCategory = (cat: string) => goals.filter(g => g.category === cat)

  const totalGoals = goals.length
  const inProgress = goals.filter(g => g.status === 'in-progress').length
  const complete = goals.filter(g => g.status === 'complete').length
  const avgProgress = totalGoals ? Math.round(goals.reduce((sum, g) => sum + g.progress, 0) / totalGoals) : 0

  if (!hydrated) return null

  return (
    <main className="min-h-screen bg-[#FAF7F2]">
      {/* Navbar */}
      <nav className="sticky top-0 z-50 bg-[#FAF7F2]/90 backdrop-blur-sm border-b border-stone-200">
        <div className="max-w-6xl mx-auto px-6 py-4 flex items-center justify-between gap-4">
          <span className="font-serif text-stone-800 font-medium shrink-0 text-sm tracking-widest uppercase">nudge</span>

          {/* View Toggle */}
          <div className="flex bg-stone-100 rounded-full p-1 gap-1">
            <button
              onClick={() => setView('dashboard')}
              className={`px-4 py-1.5 rounded-full text-sm font-medium transition-all ${
                view === 'dashboard'
                  ? 'bg-white text-stone-800 shadow-sm'
                  : 'text-stone-500 hover:text-stone-700'
              }`}
            >
              Dashboard
            </button>
            <button
              onClick={() => setView('timeline')}
              className={`px-4 py-1.5 rounded-full text-sm font-medium transition-all ${
                view === 'timeline'
                  ? 'bg-white text-stone-800 shadow-sm'
                  : 'text-stone-500 hover:text-stone-700'
              }`}
            >
              Timeline
            </button>
          </div>

          {view === 'dashboard' && (
            <div className="hidden md:flex items-center gap-6 text-sm text-stone-500">
              {sections.map(s => (
                <a key={s.id} href={`#${s.id}`} className="hover:text-stone-800 transition-colors capitalize">
                  {s.id}
                </a>
              ))}
              <a href="#vision" className="hover:text-stone-800 transition-colors">vision</a>
              <a href="#actions" className="hover:text-stone-800 transition-colors">actions</a>
              <button
                onClick={() => setImportOpen(true)}
                className="ml-2 px-3 py-1.5 text-xs font-medium text-stone-600 border border-stone-200 rounded-full hover:bg-stone-50 hover:border-stone-300 transition-all flex items-center gap-1.5"
              >
                ✦ Import
              </button>
              <button
                onClick={() => setSmsOpen(true)}
                className="px-3 py-1.5 text-xs font-medium text-stone-600 border border-stone-200 rounded-full hover:bg-stone-50 hover:border-stone-300 transition-all flex items-center gap-1.5"
                title="Sunday check-ins"
              >
                📱
              </button>
            </div>
          )}
        </div>
      </nav>

      {/* Hero */}
      <section className="max-w-6xl mx-auto px-6 pt-20 pb-16 text-center">
        <p className="text-xs font-semibold tracking-widest uppercase text-yellow-500 mb-4">Private · Family · 2026</p>
        <h1 className="font-serif text-5xl md:text-7xl font-medium text-stone-800 mb-6">{coupleName}</h1>
        <p className="font-serif text-xl md:text-2xl italic text-stone-500 mb-12">Your 2026 Family Board</p>

        {loading ? (
          <div className="flex justify-center">
            <div className="w-8 h-8 border-2 border-stone-200 border-t-stone-400 rounded-full animate-spin" />
          </div>
        ) : (
          <div className="inline-flex flex-wrap justify-center gap-8 bg-white rounded-2xl px-10 py-6 shadow-sm border border-stone-100">
            {[
              { label: 'Total Goals', value: totalGoals },
              { label: 'In Progress', value: inProgress },
              { label: 'Complete', value: complete },
              { label: 'Avg Progress', value: `${avgProgress}%` },
            ].map(stat => (
              <div key={stat.label} className="text-center">
                <div className="font-serif text-3xl font-medium text-stone-800">{stat.value}</div>
                <div className="text-xs text-stone-400 mt-1">{stat.label}</div>
              </div>
            ))}
          </div>
        )}
      </section>

      <CheckInBanner goals={goals} onApply={handleApplyUpdate} />

      {view === 'timeline' ? (
        <TimelineView goals={goals} onEdit={openEdit} />
      ) : (
        <>
          {sections.map(({ id, title, subtitle, accent, category }) => (
            <section key={id} id={id} className="max-w-6xl mx-auto px-6 py-16">
              <SectionHeader title={title} subtitle={subtitle} accent={accent} />
              <div className={`grid ${category === 'Travel' || category === 'Home' ? 'md:grid-cols-2' : 'md:grid-cols-2 lg:grid-cols-3'} gap-6`}>
                {byCategory(category).map(g => (
                  <GoalCard key={g.id} goal={g} accent={accent} onEdit={openEdit} />
                ))}
                <button
                  onClick={() => openAdd(category)}
                  className="border-2 border-dashed border-stone-200 rounded-2xl p-6 flex flex-col items-center justify-center gap-2 text-stone-400 hover:border-stone-300 hover:text-stone-500 transition-colors min-h-[200px] group"
                >
                  <span className="text-3xl font-light group-hover:scale-110 transition-transform">+</span>
                  <span className="text-sm">Add Goal</span>
                </button>
              </div>
            </section>
          ))}

          <section id="vision" className="max-w-6xl mx-auto px-6 py-16">
            <SectionHeader title="Vision Board" subtitle="What We're Building" accent="gold" />
            <VisionBoard items={visionBoardData as VisionItem[]} />
          </section>

          <section id="actions" className="max-w-6xl mx-auto px-6 py-16">
            <SectionHeader title="Next Actions" subtitle="This Week's Focus" accent="rose" />
            <TaskList items={nextActionsData as ActionItem[]} />
          </section>
        </>
      )}

      {/* Banner */}
      <section className="bg-stone-800 text-white py-16 px-6 text-center mt-8">
        <p className="font-serif text-4xl md:text-5xl font-medium mb-3">2026 — Your Year</p>
        <p className="text-stone-400 font-serif italic text-lg">Building something beautiful, together.</p>
      </section>

      {/* Footer */}
      <footer className="text-center py-8 text-stone-400 text-xs">
        <p className="font-serif italic">"A dream written down with a date becomes a goal."</p>
        <p className="mt-2">nudge · 2026</p>
      </footer>

      {smsOpen && (
        <SmsSettings goals={goals} onClose={() => setSmsOpen(false)} />
      )}

      {importOpen && (
        <ParseImportModal
          onImport={handleImport}
          onClose={() => setImportOpen(false)}
        />
      )}

      {modalOpen && (
        <EditGoalModal
          goal={editingGoal}
          defaultCategory={addingCategory || 'Financial'}
          onSave={handleSave}
          onDelete={editingGoal ? handleDelete : undefined}
          onClose={closeModal}
        />
      )}
    </main>
  )
}
