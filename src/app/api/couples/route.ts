import { NextRequest, NextResponse } from 'next/server'
import { dbSelect, dbInsert } from '@/lib/supabase'

interface Couple {
  id: string
  your_name: string
  partner_name: string
  couple_name: string
  location: string
  kids: string
  email: string
}

// GET /api/couples?email=xxx — look up couple by email (for returning users)
export async function GET(req: NextRequest) {
  const email = req.nextUrl.searchParams.get('email')
  if (!email) return NextResponse.json({ error: 'email required' }, { status: 400 })

  try {
    const rows = await dbSelect<Couple>('couples', `email=eq.${encodeURIComponent(email)}&select=*`)
    if (!rows.length) return NextResponse.json({ couple: null })
    return NextResponse.json({ couple: rows[0] })
  } catch (e) {
    return NextResponse.json({ error: String(e) }, { status: 500 })
  }
}

// POST /api/couples — create a new couple at onboarding
export async function POST(req: NextRequest) {
  const body = await req.json()
  const { yourName, partnerName, coupleName, location, kids, email } = body

  if (!yourName || !partnerName || !email) {
    return NextResponse.json({ error: 'yourName, partnerName, email required' }, { status: 400 })
  }

  try {
    // Check if email already exists
    const existing = await dbSelect<Couple>('couples', `email=eq.${encodeURIComponent(email)}&select=*`)
    if (existing.length) {
      return NextResponse.json({ couple: existing[0] })
    }

    const couple = await dbInsert<Couple>('couples', {
      your_name: yourName,
      partner_name: partnerName,
      couple_name: coupleName || `${yourName} & ${partnerName}`,
      location: location || '',
      kids: kids || '0',
      email,
    })

    return NextResponse.json({ couple })
  } catch (e) {
    return NextResponse.json({ error: String(e) }, { status: 500 })
  }
}
