import { getDb } from './_db.js'

export default async function handler(req, res) {
  res.setHeader('Access-Control-Allow-Origin', '*')
  res.setHeader('Access-Control-Allow-Methods', 'POST, OPTIONS')
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type')
  if (req.method === 'OPTIONS') return res.status(200).end()

  const sql = getDb()

  try {
    if (req.method === 'POST') {
      const col = req.body
      await sql`
        INSERT INTO flowboard_columns (id, title, accent, position)
        VALUES (${col.id}, ${col.title}, ${col.accent}, ${col.position})
        ON CONFLICT (id) DO UPDATE SET title = ${col.title}, accent = ${col.accent}, position = ${col.position}, updated_at = NOW()
      `
      return res.status(200).json({ ok: true })
    }

    res.status(405).end()
  } catch (e) {
    console.error(e)
    res.status(500).json({ error: e.message })
  }
}
