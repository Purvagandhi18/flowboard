import { useState } from 'react'
import { USERS } from './data.js'
import { NAVY, WHITE, BORDER, T1, T2, TM, TL, SH_SM, SH_MD, tagColor, formatDate, initials, now } from './tokens.jsx'
import { ICheck, ITrash, IStar, ICalendar, IChevD, IChevR } from './tokens.jsx'

function Avatar({ userId, size = 22 }) {
  const u = USERS.find(u => u.id === userId)
  if (!u) return null
  return (
    <div title={u.name} style={{ width: size, height: size, borderRadius: '50%', background: u.color, display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: size * 0.36, fontWeight: 700, color: WHITE, flexShrink: 0 }}>
      {initials(u.name)}
    </div>
  )
}

function CompletedCard({ card, column, tasks, updateCard, deleteCard, openCard }) {
  const [hover, setHover] = useState(false)
  const done = tasks.filter(t => t.status === 'done').length
  const total = tasks.length

  return (
    <div
      onMouseEnter={() => setHover(true)}
      onMouseLeave={() => setHover(false)}
      onClick={() => openCard(card.id)}
      style={{
        background: WHITE, borderRadius: 10, padding: '14px 16px',
        border: `1px solid ${hover ? '#C0BDB8' : BORDER}`,
        boxShadow: hover ? SH_MD : SH_SM,
        transform: hover ? 'translateY(-1px)' : 'none',
        transition: 'all 0.13s', cursor: 'pointer',
        borderLeft: `3px solid #10B981`,
        display: 'flex', alignItems: 'flex-start', gap: 12,
        opacity: 0.85,
      }}>
      {/* Check icon */}
      <div style={{ width: 28, height: 28, borderRadius: '50%', background: '#DCFCE7', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0, marginTop: 1 }}>
        <ICheck s={14} style={{ color: '#16A34A' }} />
      </div>

      <div style={{ flex: 1, minWidth: 0 }}>
        {/* Column badge */}
        {column && (
          <div style={{ display: 'flex', alignItems: 'center', gap: 5, marginBottom: 5 }}>
            <div style={{ width: 6, height: 6, borderRadius: '50%', background: column.accent }} />
            <span style={{ fontSize: 10, fontWeight: 700, color: TL, textTransform: 'uppercase', letterSpacing: '0.4px' }}>{column.title}</span>
          </div>
        )}

        <div style={{ fontSize: 14, fontWeight: 700, color: T2, lineHeight: 1.3, marginBottom: 6, textDecoration: 'line-through' }}>{card.title}</div>

        {/* Tags */}
        {card.tags?.length > 0 && (
          <div style={{ display: 'flex', flexWrap: 'wrap', gap: 4, marginBottom: 6 }}>
            {card.tags.map(tag => {
              const c = tagColor(tag)
              return <span key={tag} style={{ fontSize: 10, fontWeight: 700, padding: '2px 7px', borderRadius: 20, background: c.bg, color: c.text }}>{tag}</span>
            })}
          </div>
        )}

        <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
          {card.dueDate && (
            <span style={{ fontSize: 11, color: TM, display: 'flex', alignItems: 'center', gap: 3 }}>
              <ICalendar s={11} />{formatDate(card.dueDate)}
            </span>
          )}
          {total > 0 && (
            <span style={{ fontSize: 11, color: TM }}>{done}/{total} subtasks</span>
          )}
          {card.updatedAt && (
            <span style={{ fontSize: 11, color: TL }}>Completed {new Date(card.updatedAt).toLocaleDateString('en-IN', { day: 'numeric', month: 'short' })}</span>
          )}
        </div>
      </div>

      <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'flex-end', gap: 6 }}>
        {card.assigneeId && <Avatar userId={card.assigneeId} />}
        {hover && (
          <div style={{ display: 'flex', gap: 4 }}>
            <button
              onClick={e => { e.stopPropagation(); updateCard(card.id, { done: false }) }}
              title="Restore card"
              style={{ width: 26, height: 26, borderRadius: 7, border: `1px solid ${BORDER}`, background: WHITE, cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center', color: NAVY, fontSize: 10, fontWeight: 700 }}>
              ↩
            </button>
            <button
              onClick={e => { e.stopPropagation(); deleteCard(card.id) }}
              title="Delete permanently"
              style={{ width: 26, height: 26, borderRadius: 7, border: `1px solid #FECACA`, background: '#FEF2F2', cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#DC2626' }}>
              <ITrash s={13} />
            </button>
          </div>
        )}
      </div>
    </div>
  )
}

export default function Completed({ state, updateCard, deleteCard, openCard, isManager, currentUser }) {
  const [groupBy, setGroupBy] = useState('column')

  const allDone = (state.cards || []).filter(c => c.done)
  // Members only see their own completed cards
  const doneCards = isManager ? allDone : allDone.filter(c => c.assigneeId === currentUser?.id)

  const columns = state.columns || []
  const tasks = state.tasks || []

  function getTasksForCard(cardId) {
    return tasks.filter(t => t.projectId === cardId)
  }

  function getColumn(columnId) {
    return columns.find(c => c.id === columnId)
  }

  // Group by column or person
  let groups = []
  if (groupBy === 'column') {
    const usedColIds = [...new Set(doneCards.map(c => c.columnId))]
    groups = usedColIds.map(colId => {
      const col = getColumn(colId)
      return {
        key: colId,
        label: col?.title || 'Unknown',
        accent: col?.accent || TL,
        cards: doneCards.filter(c => c.columnId === colId).sort((a, b) => new Date(b.updatedAt) - new Date(a.updatedAt)),
      }
    }).filter(g => g.cards.length > 0)
  } else {
    const assigneeIds = [...new Set(doneCards.map(c => c.assigneeId || 'none'))]
    groups = assigneeIds.map(uid => {
      const u = USERS.find(u => u.id === uid)
      return {
        key: uid,
        label: u?.name || 'Unassigned',
        accent: u?.color || TL,
        cards: doneCards.filter(c => (c.assigneeId || 'none') === uid).sort((a, b) => new Date(b.updatedAt) - new Date(a.updatedAt)),
      }
    }).filter(g => g.cards.length > 0)
  }

  return (
    <div style={{ height: '100%', display: 'flex', flexDirection: 'column', background: '#F7F6F4' }}>
      {/* Header */}
      <div style={{ background: WHITE, borderBottom: `1px solid ${BORDER}`, padding: '18px 24px', flexShrink: 0 }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
          <div style={{ width: 36, height: 36, borderRadius: 9, background: '#DCFCE7', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
            <ICheck s={18} style={{ color: '#16A34A' }} />
          </div>
          <div>
            <div style={{ fontSize: 18, fontWeight: 800, color: T1, letterSpacing: '-0.3px' }}>Completed</div>
            <div style={{ fontSize: 12, color: TM }}>{doneCards.length} card{doneCards.length !== 1 ? 's' : ''} completed</div>
          </div>
          <div style={{ flex: 1 }} />
          {/* Group by toggle */}
          <div style={{ display: 'flex', borderRadius: 8, overflow: 'hidden', border: `1.5px solid ${BORDER}` }}>
            {[{ id: 'column', label: 'By column' }, { id: 'person', label: 'By person' }].map(opt => (
              <button key={opt.id} onClick={() => setGroupBy(opt.id)}
                style={{ padding: '6px 12px', border: 'none', background: groupBy === opt.id ? NAVY : WHITE, fontSize: 11, fontWeight: 700, color: groupBy === opt.id ? WHITE : TM, cursor: 'pointer', transition: 'all 0.12s' }}>
                {opt.label}
              </button>
            ))}
          </div>
        </div>
      </div>

      {/* Content */}
      <div style={{ flex: 1, overflowY: 'auto', padding: '20px 24px' }}>
        {doneCards.length === 0 ? (
          <div style={{ textAlign: 'center', padding: '80px 0' }}>
            <div style={{ fontSize: 40, marginBottom: 14, opacity: 0.4 }}>✓</div>
            <div style={{ fontSize: 15, fontWeight: 700, color: T2, marginBottom: 6 }}>No completed cards yet</div>
            <div style={{ fontSize: 13, color: TM }}>Mark a card as done from the card detail view</div>
          </div>
        ) : (
          <div style={{ maxWidth: 800, margin: '0 auto', display: 'flex', flexDirection: 'column', gap: 24 }}>
            {groups.map(group => (
              <div key={group.key}>
                <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 10 }}>
                  <div style={{ width: 10, height: 10, borderRadius: '50%', background: group.accent }} />
                  <span style={{ fontSize: 13, fontWeight: 800, color: T1 }}>{group.label}</span>
                  <span style={{ fontSize: 11, fontWeight: 700, color: TL, background: '#F3F4F6', padding: '2px 7px', borderRadius: 20 }}>{group.cards.length}</span>
                  <div style={{ flex: 1, height: 1, background: BORDER }} />
                </div>
                <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
                  {group.cards.map(card => (
                    <CompletedCard
                      key={card.id} card={card}
                      column={getColumn(card.columnId)}
                      tasks={getTasksForCard(card.id)}
                      updateCard={updateCard}
                      deleteCard={deleteCard}
                      openCard={openCard}
                    />
                  ))}
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  )
}
