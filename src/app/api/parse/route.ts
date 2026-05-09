import { NextRequest, NextResponse } from 'next/server'

const SYSTEM_PROMPT = `You are a goal-structuring assistant for Harvey and Steph, a couple planning their 2026 family goals. They will paste a block of text containing multiple goals described loosely. Your job is to:

1. Split the text into individual goals (each distinct idea = one goal)
2. For each goal, pick the best framework:
   - Financial or measurable goals → "okr"
   - Habit, identity, or lifestyle goals → "atomic-habits"
   - Goals with a clear obstacle or "but..." → "woop"
   - Goals that feel overwhelming or need singular focus → "one-thing"

Today's date is 2026-05-09. All target dates must be realistic within 2026.

Return ONLY a raw JSON array (no markdown, no explanation). Each element must use this exact shape:

{
  "goal": {
    "title": "Short punchy title (3–5 words max)",
    "description": "1–2 sentence description",
    "category": "Financial | Travel | Family | Home",
    "targetDate": "YYYY-MM-DD",
    "status": "not-started",
    "progress": 0,
    "nextAction": "The single most important first step, actionable this week",
    "target": "if financially measurable — otherwise omit",
    "current": "if they mentioned a current figure — otherwise omit",
    "budget": "if they mentioned a budget — otherwise omit"
  },
  "insight": {
    "framework": "atomic-habits | woop | okr | one-thing",
    "label": "Human-readable framework name",
    "rationale": "One sentence explaining why this framework fits",
    "extras": {
      (only keys relevant to the chosen framework)
      atomic-habits → "identity" (string), "milestones" (string[3])
      woop → "obstacle" (string), "ifThen" (string)
      okr → "objective" (string), "keyResults" (string[2-3])
      one-thing → "dominoQuestion" (string)
    }
  }
}`

export async function POST(req: NextRequest) {
  const apiKey = process.env.ANTHROPIC_API_KEY
  if (!apiKey) {
    return NextResponse.json({ error: 'ANTHROPIC_API_KEY not configured' }, { status: 500 })
  }

  const { text } = await req.json()
  if (!text?.trim()) {
    return NextResponse.json({ error: 'Text is required' }, { status: 400 })
  }

  const response = await fetch('https://api.anthropic.com/v1/messages', {
    method: 'POST',
    headers: {
      'x-api-key': apiKey,
      'anthropic-version': '2023-06-01',
      'content-type': 'application/json',
    },
    body: JSON.stringify({
      model: 'claude-sonnet-4-6',
      max_tokens: 4096,
      system: SYSTEM_PROMPT,
      messages: [{ role: 'user', content: `Parse these goals for Harvey and Steph:\n\n${text}` }],
    }),
  })

  if (!response.ok) {
    const err = await response.text()
    return NextResponse.json({ error: err }, { status: response.status })
  }

  const data = await response.json()
  const raw = data.content?.[0]?.text ?? ''

  try {
    const parsed = JSON.parse(raw)
    return NextResponse.json({ goals: Array.isArray(parsed) ? parsed : [parsed] })
  } catch {
    return NextResponse.json({ error: 'Failed to parse AI response', raw }, { status: 500 })
  }
}
