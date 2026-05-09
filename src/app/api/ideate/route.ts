import { NextRequest, NextResponse } from 'next/server'

const SYSTEM_PROMPT = `You are a goal-structuring assistant for Harvey and Steph, a couple planning their 2026 family goals. They will describe a goal loosely — your job is to structure it using the best-fit framework.

Framework selection rules:
- Financial or measurable goals → "okr" (Objectives & Key Results)
- Habit, identity, or lifestyle goals → "atomic-habits" (identity-based, James Clear)
- Goals with a clear obstacle or "but..." → "woop" (Wish, Outcome, Obstacle, Plan)
- Goals that feel overwhelming or require singular focus → "one-thing" (Gary Keller)

Today's date is 2026-05-08. All target dates must be realistic within 2026.

Return ONLY a raw JSON object with no markdown fencing, no explanation, no extra text. Use this exact shape:

{
  "goal": {
    "title": "Short punchy title (3–5 words max)",
    "description": "1–2 sentence description capturing the spirit of what they described",
    "category": "Financial | Travel | Family | Home",
    "targetDate": "YYYY-MM-DD",
    "status": "not-started",
    "progress": 0,
    "nextAction": "The single most important first step, actionable this week",
    "target": "if financially measurable, e.g. £10,000 — otherwise omit",
    "current": "if they mentioned a current figure — otherwise omit",
    "budget": "if they mentioned a budget — otherwise omit"
  },
  "insight": {
    "framework": "atomic-habits | woop | okr | one-thing",
    "label": "Human-readable framework name",
    "rationale": "One sentence explaining why this framework fits this specific goal",
    "extras": {
      "For atomic-habits: include identity (string) and milestones (string array of 3 steps)": "",
      "For woop: include obstacle (string) and ifThen (string)": "",
      "For okr: include objective (string) and keyResults (string array of 2–3 KRs)": "",
      "For one-thing: include dominoQuestion (string)": ""
    }
  }
}

For extras, only include the keys relevant to the chosen framework — do not include the instruction strings above.`

export async function POST(req: NextRequest) {
  const apiKey = process.env.ANTHROPIC_API_KEY
  if (!apiKey) {
    return NextResponse.json({ error: 'ANTHROPIC_API_KEY not configured' }, { status: 500 })
  }

  const { description, category } = await req.json()
  if (!description?.trim()) {
    return NextResponse.json({ error: 'Description is required' }, { status: 400 })
  }

  const userMessage = `Category hint: ${category || 'unknown'}

Here's what Harvey and Steph described:
"${description}"`

  const response = await fetch('https://api.anthropic.com/v1/messages', {
    method: 'POST',
    headers: {
      'x-api-key': apiKey,
      'anthropic-version': '2023-06-01',
      'content-type': 'application/json',
    },
    body: JSON.stringify({
      model: 'claude-sonnet-4-6',
      max_tokens: 1024,
      system: SYSTEM_PROMPT,
      messages: [{ role: 'user', content: userMessage }],
    }),
  })

  if (!response.ok) {
    const err = await response.text()
    return NextResponse.json({ error: err }, { status: response.status })
  }

  const data = await response.json()
  const text = data.content?.[0]?.text ?? ''

  try {
    const parsed = JSON.parse(text)
    return NextResponse.json(parsed)
  } catch {
    return NextResponse.json({ error: 'Failed to parse AI response', raw: text }, { status: 500 })
  }
}
