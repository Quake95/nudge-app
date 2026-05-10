'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { Goal } from './types'

const COUPLE_KEY = 'nudge-couple-id'
const PROFILE_KEY = 'fgd-profile'

const kidsOptions = [
  { value: '0', label: 'No kids yet' },
  { value: 'expecting', label: 'Expecting' },
  { value: '1', label: '1 kid' },
  { value: '2', label: '2 kids' },
  { value: '3+', label: '3+ kids' },
]

const steps = ['names', 'about', 'goal', 'generating', 'preview'] as const
type Step = typeof steps[number]

function ProgressDots({ current }: { current: number }) {
  return (
    <div className="flex gap-2 justify-center mb-10">
      {[0, 1, 2].map(i => (
        <div
          key={i}
          className={`rounded-full transition-all duration-300 ${
            i < current ? 'w-6 h-2 bg-stone-800' :
            i === current ? 'w-6 h-2 bg-stone-800' :
            'w-2 h-2 bg-stone-200'
          }`}
        />
      ))}
    </div>
  )
}

export default function OnboardingFlow() {
  const router = useRouter()
  const [step, setStep] = useState<Step>('names')
  const [form, setForm] = useState({
    yourName: '',
    partnerName: '',
    email: '',
    location: '',
    kids: '',
    mainGoal: '',
  })
  const [error, setError] = useState('')
  const [generatedGoals, setGeneratedGoals] = useState<Goal[]>([])
  const [coupleName, setCoupleName] = useState('')
  const [saving, setSaving] = useState(false)

  const set = (field: string, value: string) =>
    setForm(f => ({ ...f, [field]: value }))

  const handleGenerate = async () => {
    setStep('generating')
    setError('')
    try {
      const res = await fetch('/api/onboard', {
        method: 'POST',
        headers: { 'content-type': 'application/json' },
        body: JSON.stringify(form),
      })
      if (!res.ok) throw new Error('Failed to generate goals')
      const data = await res.json()
      const goals: Goal[] = (data.goals ?? []).map((g: Goal, i: number) => ({
        ...g,
        id: `gen-${Date.now()}-${i}`,
      }))
      setGeneratedGoals(goals)
      setCoupleName(data.coupleName || `${form.yourName} & ${form.partnerName}`)
      setStep('preview')
    } catch {
      setError('Something went wrong. Try again.')
      setStep('goal')
    }
  }

  const handleEnter = async () => {
    setSaving(true)
    setError('')
    try {
      // 1. Create couple in Supabase
      const coupleRes = await fetch('/api/couples', {
        method: 'POST',
        headers: { 'content-type': 'application/json' },
        body: JSON.stringify({
          yourName: form.yourName,
          partnerName: form.partnerName,
          coupleName: coupleName || `${form.yourName} & ${form.partnerName}`,
          location: form.location,
          kids: form.kids,
          email: form.email,
        }),
      })
      if (!coupleRes.ok) throw new Error('Failed to save profile')
      const { couple } = await coupleRes.json()

      // 2. Save generated goals to Supabase
      await fetch('/api/goals', {
        method: 'POST',
        headers: { 'content-type': 'application/json' },
        body: JSON.stringify({ coupleId: couple.id, goals: generatedGoals }),
      })

      // 3. Store session in localStorage (couple_id is the session key)
      localStorage.setItem(COUPLE_KEY, couple.id)
      localStorage.setItem(PROFILE_KEY, JSON.stringify({
        yourName: form.yourName,
        partnerName: form.partnerName,
        coupleName: coupleName || `${form.yourName} & ${form.partnerName}`,
        location: form.location,
        kids: form.kids,
        email: form.email,
      }))

      router.push('/')
    } catch {
      setError('Something went wrong saving your board. Try again.')
      setSaving(false)
    }
  }

  return (
    <main className="min-h-screen bg-[#FAF7F2] flex items-center justify-center px-6">
      <div className="w-full max-w-md">

        {/* Brand */}
        <div className="text-center mb-12">
          <p className="text-xs font-semibold tracking-widest uppercase text-yellow-500 mb-3">
            {step === 'preview' ? 'Almost there' : step === 'generating' ? 'Working on it…' : 'Welcome'}
          </p>
          <h1 className="font-serif text-4xl text-stone-800">
            {step === 'names' && 'Let\'s get started.'}
            {step === 'about' && 'Tell us about you.'}
            {step === 'goal' && 'What matters most?'}
            {step === 'generating' && 'Building your board…'}
            {step === 'preview' && 'Here\'s your starter board.'}
          </h1>
          {!['generating', 'preview'].includes(step) && (
            <p className="text-stone-400 text-sm mt-2 font-serif italic">
              {step === 'names' && 'We\'ll personalise your dashboard with your names.'}
              {step === 'about' && 'This helps us tailor your goals to your life stage.'}
              {step === 'goal' && 'One sentence is enough — we\'ll do the rest.'}
            </p>
          )}
        </div>

        {/* Step: Names + Email */}
        {step === 'names' && (
          <div className="flex flex-col gap-4">
            <ProgressDots current={0} />
            <div>
              <label className="block text-xs font-medium text-stone-500 uppercase tracking-wide mb-1.5">Your name</label>
              <input
                type="text"
                value={form.yourName}
                onChange={e => set('yourName', e.target.value)}
                autoFocus
                className="w-full border border-stone-200 rounded-xl px-4 py-3 text-stone-800 focus:outline-none focus:ring-2 focus:ring-stone-300"
                placeholder="e.g. Harvey"
              />
            </div>
            <div>
              <label className="block text-xs font-medium text-stone-500 uppercase tracking-wide mb-1.5">Partner's name</label>
              <input
                type="text"
                value={form.partnerName}
                onChange={e => set('partnerName', e.target.value)}
                className="w-full border border-stone-200 rounded-xl px-4 py-3 text-stone-800 focus:outline-none focus:ring-2 focus:ring-stone-300"
                placeholder="e.g. Steph"
              />
            </div>
            <div>
              <label className="block text-xs font-medium text-stone-500 uppercase tracking-wide mb-1.5">
                Your email <span className="text-stone-300 normal-case font-normal">(to restore your board on any device)</span>
              </label>
              <input
                type="email"
                value={form.email}
                onChange={e => set('email', e.target.value)}
                className="w-full border border-stone-200 rounded-xl px-4 py-3 text-stone-800 focus:outline-none focus:ring-2 focus:ring-stone-300"
                placeholder="e.g. you@example.com"
              />
            </div>
            <button
              onClick={() => setStep('about')}
              disabled={!form.yourName.trim() || !form.partnerName.trim() || !form.email.trim()}
              className="w-full py-3.5 bg-stone-800 text-white rounded-xl font-medium hover:bg-stone-700 transition-colors disabled:opacity-40 disabled:cursor-not-allowed mt-2"
            >
              Continue →
            </button>
          </div>
        )}

        {/* Step: About */}
        {step === 'about' && (
          <div className="flex flex-col gap-4">
            <ProgressDots current={1} />
            <div>
              <label className="block text-xs font-medium text-stone-500 uppercase tracking-wide mb-1.5">Where are you based?</label>
              <input
                type="text"
                value={form.location}
                onChange={e => set('location', e.target.value)}
                autoFocus
                className="w-full border border-stone-200 rounded-xl px-4 py-3 text-stone-800 focus:outline-none focus:ring-2 focus:ring-stone-300"
                placeholder="e.g. Melbourne, Australia"
              />
            </div>
            <div>
              <label className="block text-xs font-medium text-stone-500 uppercase tracking-wide mb-1.5">Kids?</label>
              <div className="grid grid-cols-3 gap-2">
                {kidsOptions.map(opt => (
                  <button
                    key={opt.value}
                    onClick={() => set('kids', opt.value)}
                    className={`py-2.5 px-3 rounded-xl text-sm font-medium border transition-all ${
                      form.kids === opt.value
                        ? 'bg-stone-800 text-white border-stone-800'
                        : 'bg-white text-stone-600 border-stone-200 hover:border-stone-300'
                    }`}
                  >
                    {opt.label}
                  </button>
                ))}
              </div>
            </div>
            <div className="flex gap-3 mt-2">
              <button
                onClick={() => setStep('names')}
                className="px-5 py-3.5 text-stone-500 hover:text-stone-700 transition-colors text-sm"
              >
                ← Back
              </button>
              <button
                onClick={() => setStep('goal')}
                disabled={!form.location.trim() || !form.kids}
                className="flex-1 py-3.5 bg-stone-800 text-white rounded-xl font-medium hover:bg-stone-700 transition-colors disabled:opacity-40 disabled:cursor-not-allowed"
              >
                Continue →
              </button>
            </div>
          </div>
        )}

        {/* Step: Main goal */}
        {step === 'goal' && (
          <div className="flex flex-col gap-4">
            <ProgressDots current={2} />
            <div>
              <label className="block text-xs font-medium text-stone-500 uppercase tracking-wide mb-1.5">
                What's your biggest goal right now?
              </label>
              <textarea
                value={form.mainGoal}
                onChange={e => set('mainGoal', e.target.value)}
                rows={4}
                autoFocus
                className="w-full border border-stone-200 rounded-xl px-4 py-3 text-stone-800 focus:outline-none focus:ring-2 focus:ring-stone-300 resize-none placeholder:text-stone-300"
                placeholder="e.g. We want to save for a house deposit and do one big trip before the baby arrives…"
              />
              <p className="text-xs text-stone-400 mt-1.5">Just say it plainly — we'll structure it into goals.</p>
            </div>
            {error && <p className="text-sm text-red-500">{error}</p>}
            <div className="flex gap-3 mt-2">
              <button
                onClick={() => setStep('about')}
                className="px-5 py-3.5 text-stone-500 hover:text-stone-700 transition-colors text-sm"
              >
                ← Back
              </button>
              <button
                onClick={handleGenerate}
                disabled={!form.mainGoal.trim()}
                className="flex-1 py-3.5 bg-stone-800 text-white rounded-xl font-medium hover:bg-stone-700 transition-colors disabled:opacity-40 disabled:cursor-not-allowed"
              >
                ✦ Build my board
              </button>
            </div>
          </div>
        )}

        {/* Step: Generating */}
        {step === 'generating' && (
          <div className="flex flex-col items-center gap-6 py-8">
            <div className="w-12 h-12 border-2 border-stone-200 border-t-stone-800 rounded-full animate-spin" />
            <div className="text-center">
              <p className="text-stone-600 font-serif text-lg">Creating your personalised board…</p>
              <p className="text-stone-400 text-sm mt-1">Picking goals that fit your life stage</p>
            </div>
            <div className="flex flex-col gap-2 w-full">
              {['Financial goals', 'Travel plans', 'Family milestones', 'Home projects'].map((label, i) => (
                <div key={label} className="flex items-center gap-3 text-sm text-stone-400">
                  <div className="w-4 h-4 border border-stone-200 border-t-stone-500 rounded-full animate-spin" style={{ animationDelay: `${i * 0.2}s` }} />
                  {label}
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Step: Preview */}
        {step === 'preview' && (
          <div className="flex flex-col gap-4">
            <p className="text-sm text-stone-500 text-center -mt-4 mb-2">
              We created {generatedGoals.length} starter goals for <span className="text-stone-800 font-medium">{coupleName}</span>. Edit anything after you're in.
            </p>

            <div className="flex flex-col gap-2 max-h-72 overflow-y-auto pr-1">
              {generatedGoals.map(goal => (
                <div key={goal.id} className="bg-white rounded-2xl px-4 py-3 border border-stone-100 flex items-start gap-3">
                  <span className="text-xs font-medium text-stone-400 uppercase tracking-wide mt-0.5 shrink-0 w-16">
                    {goal.category}
                  </span>
                  <div className="min-w-0">
                    <p className="text-sm font-medium text-stone-800 truncate">{goal.title}</p>
                    <p className="text-xs text-stone-400 mt-0.5 line-clamp-1">{goal.nextAction}</p>
                  </div>
                </div>
              ))}
            </div>

            {error && <p className="text-sm text-red-500">{error}</p>}

            <button
              onClick={handleEnter}
              disabled={saving}
              className="w-full py-4 bg-stone-800 text-white rounded-xl font-medium hover:bg-stone-700 transition-colors mt-2 text-base disabled:opacity-60 flex items-center justify-center gap-2"
            >
              {saving ? (
                <>
                  <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                  Saving your board…
                </>
              ) : (
                'Enter your dashboard →'
              )}
            </button>

            <button
              onClick={() => setStep('goal')}
              disabled={saving}
              className="text-sm text-stone-400 hover:text-stone-600 transition-colors text-center"
            >
              ← Start over
            </button>
          </div>
        )}
      </div>
    </main>
  )
}
