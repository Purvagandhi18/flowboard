import { getDb } from './_db.js'

export default async function handler(req, res) {
  res.setHeader('Access-Control-Allow-Origin', '*')
  res.setHeader('Access-Control-Allow-Methods', 'GET, POST, DELETE, OPTIONS')
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type')
  if (req.method === 'OPTIONS') return res.status(200).end()
  const sql = getDb()
  try {
    if (req.method === 'GET') {
      const { userId } = req.query
      const rows = await sql`
        SELECT c.data, s.shared_by, s.created_at as shared_at
        FROM flowboard_shares s
        JOIN flowboard_cards c ON c.id = s.card_id
        WHERE s.user_id = ${userId}
        ORDER BY s.created_at DESC
      `
      return res.status(200).json(rows.map(r => ({ ...r.data, sharedBy: r.shared_by, sharedAt: r.shared_at })))
    }
    if (req.method === 'POST') {
      const { cardId, userIds, sharedBy } = req.body
      for (const uid of userIds) {
        await sql`
          INSERT INTO flowboard_shares (card_id, user_id, shared_by)
          VALUES (${cardId}, ${uid}, ${sharedBy})
          ON CONFLICT (card_id, user_id) DO NOTHING
        `
      }
      return res.status(200).json({ ok: true })
    }
    if (req.method === 'DELETE') {
      const { cardId, userId } = req.query
      await sql`DELETE FROM flowboard_shares WHERE card_id = ${cardId} AND user_id = ${userId}`
      return res.status(200).json({ ok: true })
    }
    res.status(405).end()
  } catch (e) {
    console.error(e)
    res.status(500).json({ error: e.message })
  }
}
