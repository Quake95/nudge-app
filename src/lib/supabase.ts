// Supabase REST client — no SDK, native fetch only

const SUPABASE_URL = process.env.NEXT_PUBLIC_SUPABASE_URL!
const SERVICE_KEY = process.env.SUPABASE_SERVICE_ROLE_KEY!
const ANON_KEY = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!

function serverHeaders(extras: Record<string, string> = {}) {
  return {
    apikey: SERVICE_KEY,
    Authorization: `Bearer ${SERVICE_KEY}`,
    'Content-Type': 'application/json',
    Prefer: 'return=representation',
    ...extras,
  }
}

export async function dbSelect<T>(table: string, query: string): Promise<T[]> {
  const res = await fetch(`${SUPABASE_URL}/rest/v1/${table}?${query}`, {
    headers: serverHeaders(),
  })
  if (!res.ok) throw new Error(`dbSelect ${table}: ${await res.text()}`)
  return res.json()
}

export async function dbInsert<T>(table: string, data: object): Promise<T> {
  const res = await fetch(`${SUPABASE_URL}/rest/v1/${table}`, {
    method: 'POST',
    headers: serverHeaders(),
    body: JSON.stringify(data),
  })
  if (!res.ok) throw new Error(`dbInsert ${table}: ${await res.text()}`)
  const rows = await res.json()
  return Array.isArray(rows) ? rows[0] : rows
}

export async function dbUpsert(table: string, data: object | object[]): Promise<void> {
  const res = await fetch(`${SUPABASE_URL}/rest/v1/${table}`, {
    method: 'POST',
    headers: serverHeaders({ Prefer: 'resolution=merge-duplicates' }),
    body: JSON.stringify(data),
  })
  if (!res.ok) throw new Error(`dbUpsert ${table}: ${await res.text()}`)
}

export async function dbDelete(table: string, query: string): Promise<void> {
  const res = await fetch(`${SUPABASE_URL}/rest/v1/${table}?${query}`, {
    method: 'DELETE',
    headers: serverHeaders(),
  })
  if (!res.ok) throw new Error(`dbDelete ${table}: ${await res.text()}`)
}
