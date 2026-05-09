import { NextRequest, NextResponse } from 'next/server'
import { kvGet, kvSet } from '@/lib/kv'

interface PendingUpdate {
  id: string
  from: string
  raw: string
  intent: string
  goalId: string | null
  goalTitle: string | null
  summary: string
  progressDelta: number | null
  newDate: string | null
  receivedAt: string
}

function twiml(message: string) {
  return new NextResponse(
    `<?xml version="1.0" encoding="UTF-8"?><Response><Message>${message}</Message></Response>`,
    { headers: { 'Content-Type': 'text/xml' } }
  )
}

export async function POST(req: NextRequest) {
  const body = await req.text()
  const params = new URLSearchParams(body)
  const from = params.get('From') || ''
  const messageBody = (params.get('Body') || '').trim()

  if (!messageBody) return twiml('Got it!')

  // Handle opt-out
  if (/^(stop|unsubscribe|cancel|quit)$/i.test(messageBody)) {
    return twiml('You\'ve been unsubscribed. Reply START to opt back in anytime.')
  }

  const lastGoal = await kvGet<{ goalId: string; goalTitle: string }>('checkin:last_goal')

  let update: Omit<PendingUpdate, 'id' | 'receivedAt'> = {
    from,
    raw: messageBody,
    intent: 'note',
    goalId: lastGoal?.goalId ?? null,
    goalTitle: lastGoal?.goalTitle ?? null,
    summary: messageBody,
    progressDelta: null,
    newDate: null,
  }

  const apiKey = process.env.ANTHROPIC_API_KEY
  if (apiKey) {
    const context = lastGoal
      ? `The last goal we asked about was: "${lastGoal.goalTitle}" (ID: ${lastGoal.goalId})`
      : 'This was a general check-in with no specific goal referenced'

    const prompt = `${context}

Someone replied to a family goals check-in text:
"${messageBody}"

Extract their intent. Return ONLY raw JSON with no markdown:
{
  "intent": "progress_update | date_change | goal_change | stuck | positive | note",
  "goalId": "${lastGoal?.goalId ?? 'null — only set if clearly referenced'}",
  "goalTitle": "${lastGoal?.goalTitle ?? 'null'}",
  "summary": "one short sentence summarising what they said",
  "progressDelta": null or a number 0-100 if they clearly mentioned progress,
  "newDate": null or "YYYY-MM-DD" if they mentioned changing a target date
}`

    try {
      const res = await fetch('https://api.anthropic.com/v1/messages', {
        method: 'POST',
        headers: {
          'x-api-key': apiKey,
          'anthropic-version': '2023-06-01',
          'content-type': 'application/json',
        },
        body: JSON.stringify({
          model: 'claude-haiku-4-5-20251001',
          max_tokens: 256,
          messages: [{ role: 'user', content: prompt }],
        }),
      })
      const data = await res.json()
      const text = data.content?.[0]?.text ?? ''
      const parsed = JSON.parse(text)
      update = { ...update, ...parsed, from, raw: messageBody }
    } catch {
      // Fall through with raw note
    }
  }

  const pending = await kvGet<PendingUpdate[]>('checkin:pending') ?? []
  const newUpdate: PendingUpdate = {
    ...update,
    id: `update-${Date.now()}`,
    receivedAt: new Date().toISOString(),
  }
  await kvSet('checkin:pending', [...pending, newUpdate])

  const reply = update.intent === 'stuck'
    ? `Thanks for being honest 💪 We've flagged this one — maybe time for a rethink.`
    : `Got it, logged! Open your dashboard to review and apply the update 🎯`

  return twiml(reply)
}
