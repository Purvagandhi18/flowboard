import { getDb, initSchema } from './_db.js'

export default async function handler(req, res) {
  res.setHeader('Access-Control-Allow-Origin', '*')
  res.setHeader('Access-Control-Allow-Methods', 'GET, POST, OPTIONS')
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type')
  if (req.method === 'OPTIONS') return res.status(200).end()

  const sql = getDb()

  try {
    await initSchema(sql)

    if (req.method === 'GET') {
      const rows = await sql`SELECT id, name, email, picture, role, color, last_seen FROM flowboard_users ORDER BY name`
      return res.status(200).json(rows)
    }

    if (req.method === 'POST') {
      const { id, name, email, picture, role, color } = req.body
      await sql`
        INSERT INTO flowboard_users (id, name, email, picture, role, color, last_seen)
        VALUES (${id}, ${name}, ${email}, ${picture}, ${role}, ${color}, NOW())
        ON CONFLICT (id) DO UPDATE SET
          name = ${name}, picture = ${picture}, role = ${role},
          color = ${color}, last_seen = NOW()
      `
      return res.status(200).json({ ok: true })
    }

    res.status(405).end()
  } catch (e) {
    console.error(e)
    res.status(500).json({ error: e.message })
  }
}
