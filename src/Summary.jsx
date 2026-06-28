import { useState } from 'react'
import { USERS } from './data.js'
import { NAVY, WHITE, BORDER, T1, T2, TM, TL, SH_SM, tagColor, formatDate, isOverdue, initials } from './tokens.jsx'
import { ISummary, ICheck, IStar, IBell, IFlag, ICalendar, IChevR, IActivity } from './tokens.jsx'

function StatCard({ icon, label, value, sub, accent }) {
  return (
    <div style={{ background: WHITE, borderRadius: 10, padding: '16px 18px', border: `1px solid ${BORDER}`, borderTop: `3px solid ${accent}`, boxShadow: SH_SM, display: 'flex', gap: 14, alignItems: 'flex-start' }}>
      <div style={{ width: 38, height: 38, borderRadius: 9, background: accent + '1A', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
        {icon}
      </div>
      <div>
        <div style={{ fontSize: 24, fontWeight: 900, color: T1, letterSpacing: '-0.5px', lineHeight: 1 }}>{value}</div>
        <div style={{ fontSize: 12, fontWeight: 700, color: T2, marginTop: 3 }}>{label}</div>
        {sub && <div style={{ fontSize: 11, color: TM, marginTop: 2 }}>{sub}</div>}
      </div>
    </div>
  )
}

function CardRow({ card, tasks, columns }) {
  const col = columns.find(c => c.id === card.columnId)
  const done = tasks.filter(t => t.status === 'done').length
  const total = tasks.length
  const overdue = isOverdue(card.dueDate)
  const u = USERS.find(u => u.id === card.assigneeId)

  return (
    <div style={{ display: 'flex', alignItems: 'center', gap: 10, padding: '10px 14px', borderRadius: 8, background: card.priorityFlag ? '#FFFBEB' : '#FAFAF9', border: `1px solid ${card.priorityFlag ? '#FDE68A' : BORDER}` }}>
      <div style={{ width: 8, height: 8, borderRadius: '50%', background: col?.accent || TL, flexShrink: 0 }} />
      <div style={{ flex: 1, minWidth: 0 }}>
        <div style={{ fontSize: 13, fontWeight: 700, color: T1, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
          {card.priorityFlag && <span style={{ color: '#D97706', marginRight: 4 }}>★</span>}
          {card.title}
        </div>
        <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginTop: 2 }}>
          {col && <span style={{ fontSize: 10, color: TL, fontWeight: 600, textTransform: 'uppercase', letterSpacing: '0.3px' }}>{col.title}</span>}
          {card.dueDate && <span style={{ fontSize: 10, color: overdue ? '#DC2626' : TM }}>{formatDate(card.dueDate)}{overdue ? ' · Overdue' : ''}</span>}
          {total > 0 && <span style={{ fontSize: 10, color: TM }}>{done}/{total} tasks</span>}
        </div>
      </div>
      {u && (
        <div title={u.name} style={{ width: 22, height: 22, borderRadius: '50%', background: u.color, display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 8, fontWeight: 700, color: WHITE, flexShrink: 0 }}>
          {initials(u.name)}
        </div>
      )}
    </div>
  )
}

export default function Summary({ state, currentUser }) {
  const today = new Date().toISOString().slice(0, 10)
  const isManager = currentUser?.role === 'manager'

  // Derived metrics from state
  const cards = state.cards || []
  const tasks = state.tasks || []
  const reminders = state.reminders || []
  const columns = state.columns || []

  // Cards per column pipeline
  const sortedCols = [...columns].sort((a, b) => a.position - b.position)
  const colStats = sortedCols.map(col => ({
    ...col,
    count: cards.filter(c => c.columnId === col.id && !c.archivedAt && !c.done).length,
  }))

  // Completed (marked done)
  const doneCards = cards.filter(c => c.done && !c.archivedAt)

  // Priority cards
  const priorityCards = cards.filter(c => c.priorityFlag && !c.archivedAt && !c.done)

  // Overdue cards (not done)
  const overdueCards = cards.filter(c => !c.archivedAt && !c.done && isOverdue(c.dueDate))

  // Active reminders
  const activeReminders = reminders.filter(r => r.status === 'active')
  const todayReminders = reminders.filter(r => r.triggerDate === today && r.status === 'active')

  // Task stats
  const totalTasks = tasks.length
  const doneTasks = tasks.filter(t => t.status === 'done').length
  const inProgressTasks = tasks.filter(t => t.status === 'in_process').length

  // TODAY: tasks completed today (have completedAt timestamp starting with today)
  const tasksCompletedToday = tasks.filter(t => t.completedAt?.startsWith(today))

  // TODAY: comments posted today across all cards
  const commentsToday = cards.flatMap(card =>
    (card.comments || [])
      .filter(c => c.createdAt?.startsWith(today))
      .map(c => ({ ...c, cardTitle: card.title, cardId: card.id }))
  )

  // TODAY: cards picked up (moved to in_process today — tracked by updatedAt if status is in_process)
  // We approximate: tasks that have status=in_process and were updated today
  const tasksPickedToday = tasks.filter(t => t.status === 'in_process' && t.updatedAt?.startsWith(today))

  // Active cards (not done, not archived)
  const activeCards = cards.filter(c => !c.archivedAt && !c.done)

  // Person filter — managers can view any user's summary
  const [viewingUserId, setViewingUserId] = useState(currentUser?.id)
  const viewingUser = USERS.find(u => u.id === viewingUserId) || currentUser
  const effectiveUserId = isManager ? viewingUserId : currentUser?.id

  // For selected user stats
  const userCards = cards.filter(c => c.assigneeId === effectiveUserId && !c.archivedAt && !c.done)
  const userTasks = tasks.filter(t => t.assigneeId === effectiveUserId)
  const userTasksCompletedToday = tasksCompletedToday.filter(t => t.assigneeId === effectiveUserId)
  const userCommentsToday = isManager && effectiveUserId
    ? commentsToday // managers see all when viewing all, user comments filtered below
    : commentsToday

  // Team workload (managers see all)
  const visibleUsers = isManager ? USERS : USERS.filter(u => u.id === currentUser?.id)
  const byAssignee = visibleUsers.map(u => ({
    ...u,
    cards: cards.filter(c => c.assigneeId === u.id && !c.archivedAt && !c.done),
    tasks: tasks.filter(t => t.assigneeId === u.id),
    overdue: cards.filter(c => c.assigneeId === u.id && isOverdue(c.dueDate) && !c.done).length,
  })).filter(u => u.cards.length > 0 || u.tasks.length > 0)

  return (
    <div style={{ height: '100%', display: 'flex', flexDirection: 'column', background: '#F7F6F4' }}>
      {/* Header */}
      <div style={{ background: WHITE, borderBottom: `1px solid ${BORDER}`, padding: '18px 24px', flexShrink: 0 }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
          <div style={{ width: 36, height: 36, borderRadius: 9, background: '#EEF2F8', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
            <ISummary s={18} style={{ color: NAVY }} />
          </div>
          <div>
            <div style={{ fontSize: 18, fontWeight: 800, color: T1, letterSpacing: '-0.3px' }}>
              {isManager && viewingUserId !== currentUser?.id ? `${viewingUser?.name?.split(' ')[0]}'s Summary` : "Today's Summary"}
            </div>
            <div style={{ fontSize: 12, color: TM }}>
              {new Date().toLocaleDateString('en-IN', { weekday: 'long', day: 'numeric', month: 'long', year: 'numeric' })}
            </div>
          </div>
          <div style={{ flex: 1 }} />
          {/* Manager: view any person's summary */}
          {isManager && (
            <div style={{ display: 'flex', gap: 5 }}>
              {USERS.map(u => (
                <button key={u.id} onClick={() => setViewingUserId(u.id === viewingUserId ? null : u.id)}
                  title={u.name}
                  style={{ width: 30, height: 30, borderRadius: '50%', border: viewingUserId === u.id ? `2.5px solid ${NAVY}` : '2px solid transparent', background: u.color, display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 10, fontWeight: 700, color: WHITE, cursor: 'pointer', opacity: viewingUserId && viewingUserId !== u.id ? 0.45 : 1, transition: 'all 0.12s' }}>
                  {initials(u.name)}
                </button>
              ))}
              {viewingUserId && (
                <button onClick={() => setViewingUserId(null)} style={{ height: 30, padding: '0 10px', borderRadius: 15, border: `1px solid ${BORDER}`, background: WHITE, fontSize: 11, fontWeight: 600, color: TM, cursor: 'pointer' }}>All</button>
              )}
            </div>
          )}
        </div>
      </div>

      {/* Content */}
      <div style={{ flex: 1, overflowY: 'auto', padding: '20px 24px' }}>
        <div style={{ maxWidth: 860, margin: '0 auto', display: 'flex', flexDirection: 'column', gap: 24 }}>

          {/* Stat cards */}
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(190px, 1fr))', gap: 12 }}>
            <StatCard icon={<ICheck s={18} style={{ color: '#10B981' }} />} label="Completed cards" value={doneCards.length} sub="marked as done" accent="#10B981" />
            <StatCard icon={<IFlag s={18} style={{ color: '#F59E0B' }} />} label="Priority cards" value={priorityCards.length} sub="flagged as priority" accent="#F59E0B" />
            <StatCard icon={<IActivity s={18} style={{ color: '#3B82F6' }} />} label="Active cards" value={activeCards.length} sub={`${inProgressTasks} tasks in progress`} accent="#3B82F6" />
            <StatCard icon={<IBell s={18} style={{ color: '#D97706' }} />} label="Reminders" value={activeReminders.length} sub={`${todayReminders.length} firing today`} accent="#D97706" />
            {overdueCards.length > 0 && (
              <StatCard icon={<ICalendar s={18} style={{ color: '#DC2626' }} />} label="Overdue" value={overdueCards.length} sub="past due date" accent="#DC2626" />
            )}
          </div>

          {/* Today's activity */}
          {(tasksCompletedToday.length > 0 || commentsToday.length > 0 || tasksPickedToday.length > 0) && (
            <div style={{ background: WHITE, borderRadius: 10, border: `1px solid ${BORDER}`, padding: '16px 18px', boxShadow: SH_SM }}>
              <div style={{ fontSize: 13, fontWeight: 800, color: T1, marginBottom: 12, display: 'flex', alignItems: 'center', gap: 6 }}>
                <IActivity s={14} style={{ color: '#3B82F6' }} /> Today's activity
              </div>
              <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
                {tasksCompletedToday.length > 0 && (
                  <div style={{ display: 'flex', alignItems: 'flex-start', gap: 10 }}>
                    <span style={{ fontSize: 11, fontWeight: 700, color: '#16A34A', background: '#DCFCE7', padding: '2px 8px', borderRadius: 20, flexShrink: 0 }}>✓ Done</span>
                    <div style={{ fontSize: 12, color: T2, lineHeight: 1.6 }}>
                      {tasksCompletedToday.map(t => t.title).join(' · ')}
                    </div>
                  </div>
                )}
                {tasksPickedToday.length > 0 && (
                  <div style={{ display: 'flex', alignItems: 'flex-start', gap: 10 }}>
                    <span style={{ fontSize: 11, fontWeight: 700, color: '#1D4ED8', background: '#DBEAFE', padding: '2px 8px', borderRadius: 20, flexShrink: 0 }}>→ Picked up</span>
                    <div style={{ fontSize: 12, color: T2, lineHeight: 1.6 }}>
                      {tasksPickedToday.map(t => t.title).join(' · ')}
                    </div>
                  </div>
                )}
                {commentsToday.length > 0 && (
                  <div style={{ display: 'flex', alignItems: 'flex-start', gap: 10 }}>
                    <span style={{ fontSize: 11, fontWeight: 700, color: '#6D28D9', background: '#EDE9FE', padding: '2px 8px', borderRadius: 20, flexShrink: 0 }}>💬 Comments</span>
                    <div style={{ fontSize: 12, color: T2, lineHeight: 1.6 }}>
                      {commentsToday.length} comment{commentsToday.length !== 1 ? 's' : ''} across {new Set(commentsToday.map(c => c.cardId)).size} card{new Set(commentsToday.map(c => c.cardId)).size !== 1 ? 's' : ''}
                    </div>
                  </div>
                )}
              </div>
            </div>
          )}

          {/* Task breakdown */}
          <div style={{ background: WHITE, borderRadius: 10, border: `1px solid ${BORDER}`, padding: '16px 18px', boxShadow: SH_SM }}>
            <div style={{ fontSize: 13, fontWeight: 800, color: T1, marginBottom: 12 }}>Task breakdown</div>
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: 8 }}>
              {[
                { label: 'To pick up', value: tasks.filter(t => t.status === 'to_be_picked').length, dot: '#9CA3AF' },
                { label: 'In progress', value: inProgressTasks, dot: '#3B82F6' },
                { label: 'Done',        value: doneTasks,        dot: '#10B981' },
              ].map(s => (
                <div key={s.label} style={{ textAlign: 'center', padding: '10px 0' }}>
                  <div style={{ fontSize: 22, fontWeight: 900, color: T1 }}>{s.value}</div>
                  <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 4, marginTop: 4 }}>
                    <div style={{ width: 6, height: 6, borderRadius: '50%', background: s.dot }} />
                    <span style={{ fontSize: 11, fontWeight: 600, color: TM }}>{s.label}</span>
                  </div>
                </div>
              ))}
            </div>
            {totalTasks > 0 && (
              <div style={{ marginTop: 10 }}>
                <div style={{ height: 6, background: '#F3F4F6', borderRadius: 3, overflow: 'hidden', display: 'flex' }}>
                  {[
                    { pct: tasks.filter(t => t.status === 'to_be_picked').length / totalTasks, color: '#9CA3AF' },
                    { pct: inProgressTasks / totalTasks, color: '#3B82F6' },
                    { pct: doneTasks / totalTasks, color: '#10B981' },
                  ].filter(x => x.pct > 0).map((x, i) => (
                    <div key={i} style={{ flex: x.pct, background: x.color, transition: 'flex 0.4s' }} />
                  ))}
                </div>
                <div style={{ fontSize: 11, color: TM, marginTop: 5, textAlign: 'right' }}>{Math.round((doneTasks / totalTasks) * 100)}% complete</div>
              </div>
            )}
          </div>

          {/* Team workload */}
          {byAssignee.length > 0 && (
            <div>
              <div style={{ fontSize: 13, fontWeight: 800, color: T1, marginBottom: 12 }}>Team workload</div>
              <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
                {byAssignee.map(u => (
                  <div key={u.id} style={{ background: WHITE, borderRadius: 9, border: `1px solid ${BORDER}`, padding: '12px 16px', display: 'flex', alignItems: 'center', gap: 12 }}>
                    <div style={{ width: 32, height: 32, borderRadius: '50%', background: u.color, display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 12, fontWeight: 700, color: WHITE, flexShrink: 0 }}>
                      {initials(u.name)}
                    </div>
                    <div style={{ flex: 1 }}>
                      <div style={{ fontSize: 13, fontWeight: 700, color: T1 }}>{u.name}</div>
                      <div style={{ fontSize: 11, color: TM, display: 'flex', gap: 10, marginTop: 2 }}>
                        <span>{u.cards.length} card{u.cards.length !== 1 ? 's' : ''}</span>
                        <span>{u.tasks.length} task{u.tasks.length !== 1 ? 's' : ''}</span>
                        {u.overdue > 0 && <span style={{ color: '#DC2626', fontWeight: 600 }}>{u.overdue} overdue</span>}
                      </div>
                    </div>
                    {/* Mini task bar */}
                    {u.tasks.length > 0 && (
                      <div style={{ width: 80 }}>
                        <div style={{ height: 4, background: '#F3F4F6', borderRadius: 2, overflow: 'hidden' }}>
                          <div style={{ width: `${Math.round((u.tasks.filter(t => t.status === 'done').length / u.tasks.length) * 100)}%`, height: '100%', background: '#10B981', transition: 'width 0.4s' }} />
                        </div>
                        <div style={{ fontSize: 10, color: TM, marginTop: 2, textAlign: 'right' }}>
                          {u.tasks.filter(t => t.status === 'done').length}/{u.tasks.length}
                        </div>
                      </div>
                    )}
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Priority cards */}
          {priorityCards.length > 0 && (
            <div>
              <div style={{ fontSize: 13, fontWeight: 800, color: T1, marginBottom: 12, display: 'flex', alignItems: 'center', gap: 6 }}>
                <IStar s={14} style={{ color: '#F59E0B' }} /> Priority cards
              </div>
              <div style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
                {priorityCards.map(card => (
                  <CardRow key={card.id} card={card} tasks={tasks.filter(t => t.projectId === card.id)} columns={columns} />
                ))}
              </div>
            </div>
          )}

          {/* Overdue cards */}
          {overdueCards.length > 0 && (
            <div>
              <div style={{ fontSize: 13, fontWeight: 800, color: '#DC2626', marginBottom: 12, display: 'flex', alignItems: 'center', gap: 6 }}>
                <ICalendar s={14} /> Overdue
              </div>
              <div style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
                {overdueCards.map(card => (
                  <CardRow key={card.id} card={card} tasks={tasks.filter(t => t.projectId === card.id)} columns={columns} />
                ))}
              </div>
            </div>
          )}

          {/* Today's reminders */}
          {todayReminders.length > 0 && (
            <div>
              <div style={{ fontSize: 13, fontWeight: 800, color: T1, marginBottom: 12, display: 'flex', alignItems: 'center', gap: 6 }}>
                <IBell s={14} style={{ color: '#D97706' }} /> Reminders today
              </div>
              <div style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
                {todayReminders.map(r => (
                  <div key={r.id} style={{ background: '#FFFBEB', border: `1px solid #FDE68A`, borderRadius: 8, padding: '10px 14px', display: 'flex', alignItems: 'center', gap: 10 }}>
                    <IBell s={14} style={{ color: '#D97706', flexShrink: 0 }} />
                    <div style={{ flex: 1 }}>
                      <div style={{ fontSize: 13, fontWeight: 700, color: T1 }}>{r.title}</div>
                      {r.description && <div style={{ fontSize: 11, color: TM, marginTop: 1 }}>{r.description}</div>}
                    </div>
                    <span style={{ fontSize: 11, color: '#92400E', fontWeight: 700 }}>{r.triggerTime}</span>
                  </div>
                ))}
              </div>
            </div>
          )}

        </div>
      </div>
    </div>
  )
}
