import { getDb } from './_db.js'

export default async function handler(req, res) {
  res.setHeader('Access-Control-Allow-Origin', '*')
  res.setHeader('Access-Control-Allow-Methods', 'POST, DELETE, OPTIONS')
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type')
  if (req.method === 'OPTIONS') return res.status(200).end()

  const sql = getDb()

  try {
    if (req.method === 'POST') {
      const task = req.body
      await sql`
        INSERT INTO flowboard_tasks (id, data)
        VALUES (${task.id}, ${JSON.stringify(task)})
        ON CONFLICT (id) DO UPDATE SET data = ${JSON.stringify(task)}, updated_at = NOW()
      `
      return res.status(200).json({ ok: true })
    }

    if (req.method === 'DELETE') {
      const { id } = req.query
      await sql`DELETE FROM flowboard_tasks WHERE id = ${id}`
      return res.status(200).json({ ok: true })
    }

    res.status(405).end()
  } catch (e) {
    console.error(e)
    res.status(500).json({ error: e.message })
  }
}
