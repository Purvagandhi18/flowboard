import { getDb } from './_db.js'

export default async function handler(req, res) {
  res.setHeader('Access-Control-Allow-Origin', '*')
  res.setHeader('Access-Control-Allow-Methods', 'GET, POST, OPTIONS')
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type')
  if (req.method === 'OPTIONS') return res.status(200).end()
  const sql = getDb()
  try {
    if (req.method === 'GET') {
      const { userId } = req.query
      const rows = await sql`
        SELECT id, card_id, card_title, mentioned_user_id, mentioned_by_user_id, comment_text, created_at, read_at
        FROM flowboard_mentions
        WHERE mentioned_user_id = ${userId}
        ORDER BY created_at DESC
        LIMIT 100
      `
      return res.status(200).json(rows)
    }
    if (req.method === 'POST') {
      const body = req.body
      if (body.markRead) {
        for (const id of body.ids) {
          await sql`UPDATE flowboard_mentions SET read_at = NOW() WHERE id = ${id}`
        }
        return res.status(200).json({ ok: true })
      }
      const { id, cardId, cardTitle, mentionedUserId, mentionedByUserId, commentText } = body
      await sql`
        INSERT INTO flowboard_mentions (id, card_id, card_title, mentioned_user_id, mentioned_by_user_id, comment_text)
        VALUES (${id}, ${cardId}, ${cardTitle}, ${mentionedUserId}, ${mentionedByUserId}, ${commentText})
        ON CONFLICT (id) DO NOTHING
      `
      return res.status(200).json({ ok: true })
    }
    res.status(405).end()
  } catch (e) {
    console.error(e)
    res.status(500).json({ error: e.message })
  }
}
