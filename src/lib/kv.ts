// Vercel KV via REST API — no SDK needed
const KV_URL = process.env.KV_REST_API_URL
const KV_TOKEN = process.env.KV_REST_API_TOKEN

async function pipeline(commands: unknown[][]) {
  if (!KV_URL || !KV_TOKEN) return null
  const res = await fetch(`${KV_URL}/pipeline`, {
    method: 'POST',
    headers: {
      Authorization: `Bearer ${KV_TOKEN}`,
      'Content-Type': 'application/json',
    },
    body: JSON.stringify(commands),
  })
  return res.json()
}

export async function kvSet(key: string, value: unknown, exSeconds = 604800) {
  await pipeline([['SET', key, JSON.stringify(value), 'EX', exSeconds]])
}

export async function kvGet<T>(key: string): Promise<T | null> {
  const data = await pipeline([['GET', key]])
  const result = data?.[0]?.result
  if (!result) return null
  try { return JSON.parse(result) as T } catch { return null }
}

export async function kvDel(key: string) {
  await pipeline([['DEL', key]])
}
