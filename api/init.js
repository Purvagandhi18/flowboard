import { getDb, initSchema } from './_db.js'

const DEFAULT_COLUMNS = [
  { id: 'col1', title: 'Backlog',     accent: '#6B7280', position: 0 },
  { id: 'col2', title: 'In Progress', accent: '#2563EB', position: 1 },
  { id: 'col3', title: 'Review',      accent: '#D97706', position: 2 },
  { id: 'col4', title: 'Shipped',     accent: '#059669', position: 3 },
]

export default async function handler(req, res) {
  if (req.method !== 'POST') return res.status(405).end()
  try {
    const sql = getDb()
    await initSchema(sql)
    // Seed default columns if none exist
    const existing = await sql`SELECT id FROM flowboard_columns LIMIT 1`
    if (existing.length === 0) {
      for (const col of DEFAULT_COLUMNS) {
        await sql`
          INSERT INTO flowboard_columns (id, title, accent, position)
          VALUES (${col.id}, ${col.title}, ${col.accent}, ${col.position})
          ON CONFLICT (id) DO NOTHING
        `
      }
    }
    res.status(200).json({ ok: true })
  } catch (e) {
    console.error(e)
    res.status(500).json({ error: e.message })
  }
}
