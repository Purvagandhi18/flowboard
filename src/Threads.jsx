import { useState, useEffect } from 'react'
import { NAVY, WHITE, CREAM, BORDER, T1, T2, TM, initials } from './tokens.jsx'

function timeAgo(ts) {
  const diff = Date.now() - new Date(ts).getTime()
  const min = Math.floor(diff / 60000)
  if (min < 1) return 'just now'
  if (min < 60) return `${min}m ago`
  const hr = Math.floor(min / 60)
  if (hr < 24) return `${hr}h ago`
  const d = Math.floor(hr / 24)
  if (d === 1) return 'Yesterday'
  return `${d} days ago`
}

function highlightMention(text) {
  const parts = text.split(/(@\w+)/g)
  return parts.map((p, i) =>
    p.startsWith('@')
      ? <span key={i} style={{ color: NAVY, fontWeight: 700 }}>{p}</span>
      : p
  )
}

export default function Threads({ currentUser, openCard }) {
  const [mentions, setMentions] = useState([])

  const fetchMentions = () => {
    fetch(`/api/mentions?userId=${currentUser.id}`)
      .then(r => r.json())
      .then(data => Array.isArray(data) ? setMentions(data) : null)
      .catch(() => {})
  }

  useEffect(() => {
    fetchMentions()
    const iv = setInterval(fetchMentions, 3000)
    return () => clearInterval(iv)
  }, [currentUser.id])

  // Mark unread as read when tab is opened
  useEffect(() => {
    const unread = mentions.filter(m => !m.read_at).map(m => m.id)
    if (unread.length > 0) {
      fetch('/api/mentions', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ markRead: true, ids: unread }),
      }).catch(() => {})
    }
  }, [mentions])

  const unread = mentions.filter(m => !m.read_at)
  const read = mentions.filter(m => m.read_at)

  function MentionRow({ m }) {
    const sender = USERS.find(u => u.id === m.mentioned_by_user_id)
    return (
      <div
        onClick={() => openCard(m.card_id)}
        style={{
          display: 'flex', gap: 12, padding: '14px 20px', borderBottom: `1px solid ${BORDER}`,
          cursor: 'pointer', background: !m.read_at ? '#F0F4FF' : WHITE,
          transition: 'background 0.12s',
        }}
        onMouseEnter={e => e.currentTarget.style.background = '#F5F7FA'}
        onMouseLeave={e => e.currentTarget.style.background = !m.read_at ? '#F0F4FF' : WHITE}
      >
        <div style={{ width: 36, height: 36, borderRadius: '50%', background: sender?.color || NAVY, display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 12, fontWeight: 700, color: WHITE, flexShrink: 0 }}>
          {initials(sender?.name || '?')}
        </div>
        <div style={{ flex: 1, minWidth: 0 }}>
          <div style={{ fontSize: 13, color: T1, lineHeight: 1.4 }}>
            <span style={{ fontWeight: 700 }}>{sender?.name || 'Someone'}</span>
            {' mentioned you in '}
            <span style={{ fontWeight: 700 }}>{m.card_title}</span>
          </div>
          <div style={{ fontSize: 12, color: T2, marginTop: 4, lineHeight: 1.5 }}>
            {highlightMention(m.comment_text)}
          </div>
          <div style={{ fontSize: 11, color: TM, marginTop: 4 }}>{timeAgo(m.created_at)}</div>
        </div>
        {!m.read_at && <div style={{ width: 8, height: 8, borderRadius: '50%', background: NAVY, flexShrink: 0, marginTop: 6 }} />}
      </div>
    )
  }

  return (
    <div style={{ display: 'flex', flexDirection: 'column', height: '100%', overflow: 'hidden' }}>
      <div style={{ padding: '16px 24px 12px', borderBottom: `1px solid ${BORDER}`, background: WHITE, flexShrink: 0 }}>
        <div style={{ fontSize: 17, fontWeight: 800, color: T1, letterSpacing: '-0.3px' }}>Threads</div>
        <div style={{ fontSize: 12, color: TM, marginTop: 1 }}>{unread.length} unread mention{unread.length !== 1 ? 's' : ''}</div>
      </div>
      <div style={{ flex: 1, overflowY: 'auto', background: WHITE }}>
        {mentions.length === 0 && (
          <div style={{ padding: 40, textAlign: 'center', color: TM, fontSize: 13 }}>No mentions yet. Tag someone with @name in a comment.</div>
        )}
        {unread.length > 0 && (
          <>
            <div style={{ padding: '10px 20px 6px', fontSize: 11, fontWeight: 700, color: TM, textTransform: 'uppercase', letterSpacing: '0.5px', background: CREAM, borderBottom: `1px solid ${BORDER}` }}>New</div>
            {unread.map(m => <MentionRow key={m.id} m={m} />)}
          </>
        )}
        {read.length > 0 && (
          <>
            <div style={{ padding: '10px 20px 6px', fontSize: 11, fontWeight: 700, color: TM, textTransform: 'uppercase', letterSpacing: '0.5px', background: CREAM, borderBottom: `1px solid ${BORDER}` }}>Earlier</div>
            {read.map(m => <MentionRow key={m.id} m={m} />)}
          </>
        )}
      </div>
    </div>
  )
}
