import { NextRequest, NextResponse } from 'next/server'
import { dbSelect, dbUpsert, dbDelete } from '@/lib/supabase'
import { Goal } from '@/components/types'

interface DbGoal extends Omit<Goal, 'insight'> {
  couple_id: string
  insight: Goal['insight'] | null
}

function toDbGoal(g: Goal, coupleId: string): DbGoal {
  return {
    ...g,
    couple_id: coupleId,
    insight: g.insight ?? null,
  }
}

function fromDbGoal(row: DbGoal): Goal {
  const { couple_id, ...rest } = row
  void couple_id
  return {
    ...rest,
    insight: rest.insight ?? undefined,
  } as Goal
}

// GET /api/goals?coupleId=xxx
export async function GET(req: NextRequest) {
  const coupleId = req.nextUrl.searchParams.get('coupleId')
  if (!coupleId) return NextResponse.json({ error: 'coupleId required' }, { status: 400 })

  try {
    const rows = await dbSelect<DbGoal>('goals', `couple_id=eq.${coupleId}&select=*&order=created_at.asc`)
    return NextResponse.json({ goals: rows.map(fromDbGoal) })
  } catch (e) {
    return NextResponse.json({ error: String(e) }, { status: 500 })
  }
}

// POST /api/goals — upsert all goals for a couple
export async function POST(req: NextRequest) {
  const { coupleId, goals } = await req.json()
  if (!coupleId || !Array.isArray(goals)) {
    return NextResponse.json({ error: 'coupleId and goals[] required' }, { status: 400 })
  }

  try {
    if (goals.length > 0) {
      await dbUpsert('goals', goals.map((g: Goal) => toDbGoal(g, coupleId)))
    }
    return NextResponse.json({ ok: true })
  } catch (e) {
    return NextResponse.json({ error: String(e) }, { status: 500 })
  }
}

// DELETE /api/goals?coupleId=xxx&goalId=yyy
export async function DELETE(req: NextRequest) {
  const coupleId = req.nextUrl.searchParams.get('coupleId')
  const goalId = req.nextUrl.searchParams.get('goalId')

  if (!coupleId) return NextResponse.json({ error: 'coupleId required' }, { status: 400 })

  try {
    if (goalId) {
      await dbDelete('goals', `id=eq.${goalId}&couple_id=eq.${coupleId}`)
    } else {
      await dbDelete('goals', `couple_id=eq.${coupleId}`)
    }
    return NextResponse.json({ ok: true })
  } catch (e) {
    return NextResponse.json({ error: String(e) }, { status: 500 })
  }
}
