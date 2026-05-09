import { NextRequest, NextResponse } from 'next/server'
import { kvGet, kvSet, kvDel } from '@/lib/kv'

interface PendingUpdate {
  id: string
  [key: string]: unknown
}

export async function GET() {
  const pending = await kvGet<PendingUpdate[]>('checkin:pending') ?? []
  return NextResponse.json({ pending })
}

export async function DELETE(req: NextRequest) {
  const { id } = await req.json()
  if (id === 'all') {
    await kvDel('checkin:pending')
  } else {
    const current = await kvGet<PendingUpdate[]>('checkin:pending') ?? []
    await kvSet('checkin:pending', current.filter(u => u.id !== id))
  }
  return NextResponse.json({ ok: true })
}
