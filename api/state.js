import { getDb, initSchema } from './_db.js'

export default async function handler(req, res) {
  res.setHeader('Access-Control-Allow-Origin', '*')
  res.setHeader('Access-Control-Allow-Methods', 'GET, OPTIONS')
  if (req.method === 'OPTIONS') return res.status(200).end()
  if (req.method !== 'GET') return res.status(405).end()

  try {
    const sql = getDb()
    await initSchema(sql)

    const [columns, cards, tasks, reminders] = await Promise.all([
      sql`SELECT id, title, accent, position FROM flowboard_columns ORDER BY position`,
      sql`SELECT data FROM flowboard_cards ORDER BY (data->>'createdAt') ASC`,
      sql`SELECT data FROM flowboard_tasks ORDER BY (data->>'createdAt') ASC`,
      sql`SELECT data FROM flowboard_reminders ORDER BY (data->>'createdAt') ASC`,
    ])

    res.status(200).json({
      columns: columns.map(r => ({ id: r.id, title: r.title, accent: r.accent, position: r.position })),
      cards: cards.map(r => r.data),
      tasks: tasks.map(r => r.data),
      reminders: reminders.map(r => r.data),
    })
  } catch (e) {
    console.error(e)
    res.status(500).json({ error: e.message })
  }
}
