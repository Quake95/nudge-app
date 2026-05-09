'use client'

import { useState, useEffect } from 'react'
import { Goal } from './types'

interface SmsConfig {
  harveyPhone: string
  stephPhone: string
  enabled: boolean
}

interface Props {
  goals: Goal[]
  onClose: () => void
}

const SMS_KEY = 'fgd-sms-settings'

export default function SmsSettings({ goals, onClose }: Props) {
  const [config, setConfig] = useState<SmsConfig>({ harveyPhone: '', stephPhone: '', enabled: true })
  const [sending, setSending] = useState(false)
  const [sent, setSent] = useState(false)
  const [error, setError] = useState('')
  const [selectedGoalId, setSelectedGoalId] = useState<string>('random')

  useEffect(() => {
    const stored = localStorage.getItem(SMS_KEY)
    if (stored) setConfig(JSON.parse(stored))
  }, [])

  const save = (update: Partial<SmsConfig>) => {
    const next = { ...config, ...update }
    setConfig(next)
    localStorage.setItem(SMS_KEY, JSON.stringify(next))
  }

  const handleSendTest = async () => {
    const phones = [config.harveyPhone, config.stephPhone].filter(Boolean)
    if (phones.length === 0) { setError('Add at least one phone number first'); return }

    setSending(true)
    setError('')
    setSent(false)

    const goal = selectedGoalId === 'random'
      ? goals.find(g => g.status !== 'complete') ?? null
      : goals.find(g => g.id === selectedGoalId) ?? null

    try {
      const res = await fetch('/api/sms/send', {
        method: 'POST',
        headers: { 'content-type': 'application/json' },
        body: JSON.stringify({ phones, goal }),
      })
      if (!res.ok) throw new Error('Failed to send')
      setSent(true)
      setTimeout(() => setSent(false), 4000)
    } catch {
      setError('Failed to send — check your Twilio credentials in Vercel env vars')
    } finally {
      setSending(false)
    }
  }

  const incompleteGoals = goals.filter(g => g.status !== 'complete')

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
      <div className="absolute inset-0 bg-black/30 backdrop-blur-sm" onClick={onClose} />
      <div className="relative bg-white rounded-3xl shadow-2xl w-full max-w-md">
        <div className="p-8">
          <div className="flex items-center justify-between mb-6">
            <div>
              <h2 className="font-serif text-2xl text-stone-800">Sunday Check-ins</h2>
              <p className="text-sm text-stone-400 mt-0.5">Weekly SMS reminders to keep you on track</p>
            </div>
            <button onClick={onClose} className="text-stone-400 hover:text-stone-600 transition-colors text-xl leading-none">×</button>
          </div>

          <div className="flex flex-col gap-5">
            {/* Enable toggle */}
            <div className="flex items-center justify-between py-3 border-b border-stone-100">
              <div>
                <p className="text-sm font-medium text-stone-700">Sunday check-ins</p>
                <p className="text-xs text-stone-400">Every Sunday at 6pm</p>
              </div>
              <button
                onClick={() => save({ enabled: !config.enabled })}
                className={`w-11 h-6 rounded-full transition-colors relative ${config.enabled ? 'bg-stone-800' : 'bg-stone-200'}`}
              >
                <span className={`absolute top-0.5 w-5 h-5 bg-white rounded-full shadow transition-transform ${config.enabled ? 'translate-x-5' : 'translate-x-0.5'}`} />
              </button>
            </div>

            {/* Phone numbers */}
            <div>
              <label className="block text-xs font-medium text-stone-500 uppercase tracking-wide mb-1.5">Harvey&apos;s number</label>
              <input
                type="tel"
                value={config.harveyPhone}
                onChange={e => save({ harveyPhone: e.target.value })}
                className="w-full border border-stone-200 rounded-xl px-4 py-2.5 text-sm text-stone-800 focus:outline-none focus:ring-2 focus:ring-stone-300"
                placeholder="+447700000000"
              />
            </div>
            <div>
              <label className="block text-xs font-medium text-stone-500 uppercase tracking-wide mb-1.5">Steph&apos;s number</label>
              <input
                type="tel"
                value={config.stephPhone}
                onChange={e => save({ stephPhone: e.target.value })}
                className="w-full border border-stone-200 rounded-xl px-4 py-2.5 text-sm text-stone-800 focus:outline-none focus:ring-2 focus:ring-stone-300"
                placeholder="+447700000001"
              />
            </div>

            {/* Test send */}
            <div className="bg-stone-50 rounded-2xl p-4 flex flex-col gap-3">
              <p className="text-xs font-medium text-stone-500 uppercase tracking-wide">Send a test now</p>
              <select
                value={selectedGoalId}
                onChange={e => setSelectedGoalId(e.target.value)}
                className="w-full border border-stone-200 rounded-xl px-4 py-2.5 text-sm text-stone-800 focus:outline-none focus:ring-2 focus:ring-stone-300 bg-white"
              >
                <option value="random">Pick a goal automatically</option>
                {incompleteGoals.map(g => (
                  <option key={g.id} value={g.id}>{g.title}</option>
                ))}
              </select>
              {error && <p className="text-xs text-red-500">{error}</p>}
              {sent && <p className="text-xs text-emerald-600">✓ Texts sent!</p>}
              <button
                onClick={handleSendTest}
                disabled={sending}
                className="w-full py-2.5 bg-stone-800 text-white rounded-xl text-sm font-medium hover:bg-stone-700 transition-colors disabled:opacity-40 flex items-center justify-center gap-2"
              >
                {sending
                  ? <><span className="inline-block w-3.5 h-3.5 border-2 border-white/30 border-t-white rounded-full animate-spin" /> Sending…</>
                  : '📱 Send test check-in'}
              </button>
            </div>

            {/* Setup note */}
            <div className="rounded-xl bg-amber-50 border border-amber-200 p-3">
              <p className="text-xs text-amber-700 leading-relaxed">
                <span className="font-semibold">To activate:</span> add <code className="bg-amber-100 px-1 rounded">TWILIO_ACCOUNT_SID</code>, <code className="bg-amber-100 px-1 rounded">TWILIO_AUTH_TOKEN</code>, <code className="bg-amber-100 px-1 rounded">TWILIO_PHONE_NUMBER</code>, and <code className="bg-amber-100 px-1 rounded">KV_REST_API_URL</code> / <code className="bg-amber-100 px-1 rounded">KV_REST_API_TOKEN</code> to your Vercel environment variables.
              </p>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}
