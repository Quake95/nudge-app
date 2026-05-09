import { NextRequest, NextResponse } from 'next/server'

const SYSTEM_PROMPT = `You are a life-planning assistant helping a couple get started with their shared goals dashboard. Based on what they've told you about themselves, generate a set of realistic, personalised starter goals across 4 categories: Financial, Travel, Family, and Home.

Rules:
- Generate 6–8 goals total, spread across categories (at least 1 per category)
- Tailor goals to their life stage: expecting a baby → nursery, antenatal, parental leave planning. Young kids → education savings, family holidays. No kids yet → more freedom for travel/lifestyle goals. etc.
- Use their location to make travel goals realistic (Australians travel to SE Asia, Japan, Europe — not just "Paris")
- Make financial goals concrete with realistic figures for their region (AUD for Australia)
- Today's date is 2026-05-09. All target dates must be within 2026 or early 2027
- Keep titles punchy (3–5 words), descriptions warm and human — like a smart friend wrote them
- Set progress to 0 and status to "not-started" for all goals (they're starting fresh)
- nextAction should be something they can do THIS WEEK

Return ONLY a raw JSON object, no markdown:
{
  "coupleName": "First name & First name (e.g. Jake & Emma)",
  "goals": [
    {
      "id": "gen-1",
      "title": "...",
      "description": "...",
      "category": "Financial | Travel | Family | Home",
      "targetDate": "YYYY-MM-DD",
      "status": "not-started",
      "progress": 0,
      "nextAction": "...",
      "target": "if financial/measurable, e.g. AU$15,000 — otherwise omit",
      "current": "omit for new users",
      "budget": "if relevant — otherwise omit"
    }
  ]
}`

export async function POST(req: NextRequest) {
  const apiKey = process.env.ANTHROPIC_API_KEY
  if (!apiKey) {
    return NextResponse.json({ error: 'ANTHROPIC_API_KEY not configured' }, { status: 500 })
  }

  const { yourName, partnerName, location, kids, mainGoal } = await req.json()

  if (!yourName || !partnerName) {
    return NextResponse.json({ error: 'Names are required' }, { status: 400 })
  }

  const kidsDesc = kids === '0' ? 'no children yet'
    : kids === 'expecting' ? 'expecting their first baby'
    : kids === '1' ? 'one child'
    : kids === '2' ? 'two children'
    : 'three or more children'

  const userMessage = `Here's the couple:
- Names: ${yourName} and ${partnerName}
- Based in: ${location || 'Australia'}
- Kids: ${kidsDesc}
- Their main goal right now: "${mainGoal || 'building a great life together'}"

Generate their personalised starter goals.`

  const response = await fetch('https://api.anthropic.com/v1/messages', {
    method: 'POST',
    headers: {
      'x-api-key': apiKey,
      'anthropic-version': '2023-06-01',
      'content-type': 'application/json',
    },
    body: JSON.stringify({
      model: 'claude-sonnet-4-6',
      max_tokens: 2048,
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
