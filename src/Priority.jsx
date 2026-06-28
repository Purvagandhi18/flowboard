import { useState } from 'react'
import { USERS } from './data.js'
import { NAVY, WHITE, BORDER, T1, T2, TM, TL, SH_SM, SH_MD, STATUS_MAP, tagColor, formatDate, isOverdue, initials, now } from './tokens.jsx'
import { IFlag, IStar, ICalendar, IUser, IChevD, IChevR, ICheck, ITrash } from './tokens.jsx'

function Avatar({ userId, size = 22 }) {
  const u = USERS.find(u => u.id === userId)
  if (!u) return null
  return (
    <div title={u.name} style={{ width: size, height: size, borderRadius: '50%', background: u.color, display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: size * 0.36, fontWeight: 700, color: WHITE, flexShrink: 0 }}>
      {initials(u.name)}
    </div>
  )
}

function PriorityCard({ card, column, tasks, updateCard, openCard }) {
  const [hover, setHover] = useState(false)
  const done = tasks.filter(t => t.status === 'done').length
  const total = tasks.length
  const overdue = isOverdue(card.dueDate)
  const s = STATUS_MAP[card.status] || STATUS_MAP.to_be_picked

  return (
    <div
      onMouseEnter={() => setHover(true)}
      onMouseLeave={() => setHover(false)}
      onClick={() => openCard(card.id)}
      style={{
        background: WHITE, borderRadius: 10, padding: '14px 16px', border: `1px solid ${BORDER}`,
        boxShadow: hover ? SH_MD : SH_SM, transform: hover ? 'translateY(-1px)' : 'none',
        transition: 'all 0.13s', cursor: 'pointer',
        borderLeft: `3px solid #F59E0B`,
        display: 'grid', gridTemplateColumns: '1fr auto', gap: 10, alignItems: 'start',
      }}>
      <div style={{ minWidth: 0 }}>
        {/* Column badge */}
        <div style={{ display: 'flex', alignItems: 'center', gap: 6, marginBottom: 6 }}>
          <span style={{ fontSize: 10, fontWeight: 700, color: TL, textTransform: 'uppercase', letterSpacing: '0.4px' }}>{column?.title || 'Unknown'}</span>
          <div style={{ width: 4, height: 4, borderRadius: '50%', background: column?.accent || TL }} />
          <IStar s={11} style={{ color: '#F59E0B' }} />
        </div>

        <div style={{ fontSize: 14, fontWeight: 700, color: T1, lineHeight: 1.3, marginBottom: 8 }}>{card.title}</div>

        {card.description && (
          <div style={{ fontSize: 12, color: T2, lineHeight: 1.5, marginBottom: 8, display: '-webkit-box', WebkitLineClamp: 2, WebkitBoxOrient: 'vertical', overflow: 'hidden' }}>{card.description}</div>
        )}

        {/* Tags */}
        {card.tags?.length > 0 && (
          <div style={{ display: 'flex', flexWrap: 'wrap', gap: 4, marginBottom: 8 }}>
            {card.tags.map(tag => {
              const c = tagColor(tag)
              return <span key={tag} style={{ fontSize: 10, fontWeight: 700, padding: '2px 7px', borderRadius: 20, background: c.bg, color: c.text }}>{tag}</span>
            })}
          </div>
        )}

        {/* Footer */}
        <div style={{ display: 'flex', alignItems: 'center', gap: 10, flexWrap: 'wrap' }}>
          {card.dueDate && (
            <span style={{ fontSize: 11, fontWeight: 600, color: overdue ? '#DC2626' : TM, display: 'flex', alignItems: 'center', gap: 3 }}>
              <ICalendar s={11} />{formatDate(card.dueDate)}{overdue && ' · Overdue'}
            </span>
          )}
          {total > 0 && (
            <span style={{ fontSize: 11, color: TM, display: 'flex', alignItems: 'center', gap: 3 }}>
              <ICheck s={11} />{done}/{total} tasks
            </span>
          )}
        </div>

        {/* Progress bar */}
        {total > 0 && (
          <div style={{ marginTop: 8, height: 3, background: '#F3F4F6', borderRadius: 2 }}>
            <div style={{ width: `${Math.round((done / total) * 100)}%`, height: '100%', background: done === total ? '#10B981' : NAVY, borderRadius: 2, transition: 'width 0.4s' }} />
          </div>
        )}
      </div>

      {/* Right side */}
      <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'flex-end', gap: 8 }}>
        {card.assigneeId && <Avatar userId={card.assigneeId} />}
        <button
          onClick={e => { e.stopPropagation(); updateCard(card.id, { priorityFlag: false }) }}
          title="Remove from priority"
          style={{ width: 26, height: 26, borderRadius: 7, border: `1px solid #FDE68A`, background: '#FFFBEB', cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#D97706' }}>
          <IStar s={13} filled />
        </button>
      </div>
    </div>
  )
}

export default function Priority({ state, updateCard, openCard }) {
  const [groupBy, setGroupBy] = useState('column')
  const [assigneeFilter, setAssigneeFilter] = useState(null)

  const tasks = state.tasks || []
  const priorityCards = (state.cards || []).filter(c => {
    if (c.done || c.archivedAt) return false
    return c.priorityFlag || tasks.some(t => t.projectId === c.id && t.priority)
  })

  const filtered = assigneeFilter
    ? priorityCards.filter(c => c.assigneeId === assigneeFilter)
    : priorityCards

  const overdue = filtered.filter(c => isOverdue(c.dueDate))
  const activeAssignees = [...new Set(priorityCards.map(c => c.assigneeId).filter(Boolean))]

  function getTasksForCard(cardId) {
    return (state.tasks || []).filter(t => t.projectId === cardId)
  }

  function getColumn(columnId) {
    return (state.columns || []).find(c => c.id === columnId)
  }

  // Group cards
  let groups = []
  if (groupBy === 'column') {
    const cols = (state.columns || []).sort((a, b) => a.position - b.position)
    groups = cols.map(col => ({
      key: col.id,
      label: col.title,
      accent: col.accent,
      cards: filtered.filter(c => c.columnId === col.id),
    })).filter(g => g.cards.length > 0)
  } else {
    const assignees = [
      ...activeAssignees.map(uid => {
        const u = USERS.find(u => u.id === uid)
        return { key: uid, label: u?.name || uid, accent: u?.color || NAVY, cards: filtered.filter(c => c.assigneeId === uid) }
      }),
      { key: 'unassigned', label: 'Unassigned', accent: '#9CA3AF', cards: filtered.filter(c => !c.assigneeId) }
    ].filter(g => g.cards.length > 0)
    groups = assignees
  }

  return (
    <div style={{ height: '100%', display: 'flex', flexDirection: 'column', background: '#F7F6F4' }}>
      {/* Header */}
      <div style={{ background: WHITE, borderBottom: `1px solid ${BORDER}`, padding: '18px 24px', flexShrink: 0 }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 12, marginBottom: 14 }}>
          <div style={{ width: 36, height: 36, borderRadius: 9, background: '#FFFBEB', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
            <IFlag s={18} style={{ color: '#D97706' }} />
          </div>
          <div>
            <div style={{ fontSize: 18, fontWeight: 800, color: T1, letterSpacing: '-0.3px' }}>Priority</div>
            <div style={{ fontSize: 12, color: TM }}>
              {filtered.length} priority card{filtered.length !== 1 ? 's' : ''}
              {overdue.length > 0 && <span style={{ color: '#DC2626', fontWeight: 600 }}> · {overdue.length} overdue</span>}
            </div>
          </div>
          <div style={{ flex: 1 }} />

          {/* Assignee filter pills */}
          <div style={{ display: 'flex', gap: 5, alignItems: 'center' }}>
            {activeAssignees.length > 0 && (
              <>
                <span style={{ fontSize: 11, color: TM, fontWeight: 600 }}>Filter:</span>
                {activeAssignees.map(uid => {
                  const u = USERS.find(u => u.id === uid)
                  if (!u) return null
                  const active = assigneeFilter === uid
                  return (
                    <button key={uid} onClick={() => setAssigneeFilter(active ? null : uid)}
                      title={u.name}
                      style={{ width: 28, height: 28, borderRadius: '50%', border: active ? `2.5px solid ${NAVY}` : `2px solid transparent`, background: u.color, display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 10, fontWeight: 700, color: WHITE, cursor: 'pointer', outline: active ? `2px solid ${WHITE}` : 'none', outlineOffset: active ? '-4px' : '0' }}>
                      {initials(u.name)}
                    </button>
                  )
                })}
              </>
            )}
          </div>

          {/* Group by toggle */}
          <div style={{ display: 'flex', borderRadius: 8, overflow: 'hidden', border: `1.5px solid ${BORDER}` }}>
            {[{ id: 'column', label: 'By column' }, { id: 'assignee', label: 'By person' }].map(opt => (
              <button key={opt.id} onClick={() => setGroupBy(opt.id)}
                style={{ padding: '6px 12px', border: 'none', background: groupBy === opt.id ? NAVY : WHITE, fontSize: 11, fontWeight: 700, color: groupBy === opt.id ? WHITE : TM, cursor: 'pointer', transition: 'all 0.12s' }}>
                {opt.label}
              </button>
            ))}
          </div>
        </div>

        {/* Overdue alert */}
        {overdue.length > 0 && (
          <div style={{ display: 'flex', alignItems: 'center', gap: 8, padding: '8px 12px', borderRadius: 8, background: '#FEF2F2', border: '1px solid #FECACA' }}>
            <div style={{ width: 8, height: 8, borderRadius: '50%', background: '#DC2626', flexShrink: 0 }} />
            <span style={{ fontSize: 12, fontWeight: 600, color: '#991B1B' }}>{overdue.length} priority card{overdue.length !== 1 ? 's are' : ' is'} overdue</span>
          </div>
        )}
      </div>

      {/* Content */}
      <div style={{ flex: 1, overflowY: 'auto', padding: '20px 24px' }}>
        {filtered.length === 0 ? (
          <div style={{ textAlign: 'center', padding: '80px 0', color: TL }}>
            <div style={{ fontSize: 40, marginBottom: 14, opacity: 0.4 }}>⭐</div>
            <div style={{ fontSize: 15, fontWeight: 700, color: T2, marginBottom: 6 }}>No priority cards</div>
            <div style={{ fontSize: 13, color: TM }}>Star a card on the Dashboard to track it here</div>
          </div>
        ) : (
          <div style={{ maxWidth: 800, margin: '0 auto', display: 'flex', flexDirection: 'column', gap: 24 }}>
            {groups.map(group => (
              <div key={group.key}>
                {/* Group header */}
                <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 10 }}>
                  <div style={{ width: 10, height: 10, borderRadius: '50%', background: group.accent }} />
                  <span style={{ fontSize: 13, fontWeight: 800, color: T1 }}>{group.label}</span>
                  <span style={{ fontSize: 11, fontWeight: 700, color: TL, background: '#F3F4F6', padding: '2px 7px', borderRadius: 20 }}>{group.cards.length}</span>
                  <div style={{ flex: 1, height: 1, background: BORDER }} />
                </div>

                <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(320px, 1fr))', gap: 10 }}>
                  {group.cards.map(card => (
                    <PriorityCard
                      key={card.id} card={card}
                      column={getColumn(card.columnId)}
                      tasks={getTasksForCard(card.id)}
                      updateCard={updateCard}
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
