import { NextRequest, NextResponse } from 'next/server'
import { sendSms } from '@/lib/twilio'
import { kvSet } from '@/lib/kv'

// Vercel cron — fires every Sunday at 6pm UTC
export async function GET(req: NextRequest) {
  const authHeader = req.headers.get('authorization')
  if (authHeader !== `Bearer ${process.env.CRON_SECRET}`) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  const phones = [process.env.HARVEY_PHONE, process.env.STEPH_PHONE].filter(Boolean) as string[]
  if (phones.length === 0) {
    return NextResponse.json({ error: 'No phone numbers configured' }, { status: 400 })
  }

  const message = `Hey 👋 Sunday check-in! How's the week been on your family goals — anything moved forward, anything feeling stuck? Just reply and we'll log it.`

  await Promise.all(phones.map(phone => sendSms(phone, message)))
  await kvSet('checkin:last_sent', { sentAt: new Date().toISOString(), type: 'generic' })

  return NextResponse.json({ ok: true, sent: phones.length })
}

// Manual trigger from UI — passes phones + optional specific goal
export async function POST(req: NextRequest) {
  const { phones, goal } = await req.json()

  if (!phones?.length) {
    return NextResponse.json({ error: 'phones required' }, { status: 400 })
  }

  const message = goal
    ? `Hey 👋 Quick check-in on "${goal.title}" — how's it going? Any progress this week, or is anything blocking you? Just reply and we'll update your dashboard.`
    : `Hey 👋 Sunday check-in! How's the week been on your family goals — anything moved forward, anything feeling stuck? Just reply and we'll log it.`

  await Promise.all(phones.map((phone: string) => sendSms(phone, message)))

  if (goal) {
    await kvSet('checkin:last_goal', {
      goalId: goal.id,
      goalTitle: goal.title,
      sentAt: new Date().toISOString(),
    })
  }

  return NextResponse.json({ ok: true, sent: phones.length })
}
