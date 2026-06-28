import { useState, useEffect, useCallback, useRef } from 'react'
import { USERS } from './data.js'
import { NAVY, NAVY_BG, CREAM, WHITE, BORDER, T1, T2, TM, SH_MD, uid, now, initials } from './tokens.jsx'

const EMPTY_STATE = { columns: [], cards: [], tasks: [], reminders: [], shares: [] }

async function apiFetch(path, opts = {}) {
  const res = await fetch(path, {
    headers: { 'Content-Type': 'application/json' },
    ...opts,
    body: opts.body ? JSON.stringify(opts.body) : undefined,
  })
  if (!res.ok) throw new Error(`API ${path} failed: ${res.status}`)
  return res.json()
}

function persist(path, method, body) {
  apiFetch(path, { method, body }).catch(err => console.error('persist failed', err))
}

function persistDelete(path) {
  fetch(path, { method: 'DELETE' }).catch(err => console.error('delete failed', err))
}
import { IBoard, IStar, IBell, IFlag, ISummary, ISettings, ILogout, ISearch, IZap, IX, ICheck, IMessage } from './tokens.jsx'
import Dashboard from './Dashboard.jsx'
import CardDrawer from './CardDrawer.jsx'
import Reminders from './Reminders.jsx'
import Priority from './Priority.jsx'
import Summary from './Summary.jsx'
import Completed from './Completed.jsx'
import Threads from './Threads.jsx'

const NAV = [
  { id: 'dashboard', label: 'Dashboard',      Icon: IBoard   },
  { id: 'threads',   label: 'Threads',         Icon: IMessage },
  { id: 'priority',  label: 'Priority',        Icon: IFlag    },
  { id: 'completed', label: 'Completed',       Icon: ICheck   },
  { id: 'reminders', label: 'Reminders',       Icon: IBell    },
  { id: 'summary',   label: "Today's Summary", Icon: ISummary },
]

// ── Notification toast system ─────────────────────────────────────────────────
let _toastFn = null
export function toast(msg, type = 'info') {
  _toastFn?.(msg, type)
}

function ToastHost() {
  const [toasts, setToasts] = useState([])
  useEffect(() => {
    _toastFn = (msg, type) => {
      const id = uid()
      setToasts(t => [...t, { id, msg, type }])
      setTimeout(() => setToasts(t => t.filter(x => x.id !== id)), 3200)
    }
    return () => { _toastFn = null }
  }, [])

  const colors = { info: NAVY, success: '#059669', warning: '#D97706', error: '#DC2626' }

  return (
    <div style={{ position: 'fixed', bottom: 24, right: 24, zIndex: 9999, display: 'flex', flexDirection: 'column', gap: 8 }}>
      {toasts.map(t => (
        <div key={t.id} style={{
          background: WHITE, border: `1px solid ${BORDER}`, borderLeft: `3px solid ${colors[t.type] || NAVY}`,
          borderRadius: 8, padding: '10px 16px', fontSize: 13, color: T1, fontWeight: 500,
          boxShadow: SH_MD, display: 'flex', alignItems: 'center', gap: 8,
          animation: 'slideUp 0.22s cubic-bezier(0.22,1,0.36,1)',
          maxWidth: 340,
        }}>
          {t.msg}
        </div>
      ))}
      <style>{`@keyframes slideUp { from { opacity:0; transform:translateY(12px); } to { opacity:1; transform:translateY(0); } }`}</style>
    </div>
  )
}

// ── Reminder popup ────────────────────────────────────────────────────────────
function ReminderPopup({ reminder, onDismiss, onSnooze }) {
  const [visible, setVisible] = useState(false)
  useEffect(() => { requestAnimationFrame(() => setVisible(true)) }, [])

  return (
    <div style={{
      position: 'fixed', bottom: 24, left: '50%', transform: visible ? 'translate(-50%, 0)' : 'translate(-50%, 80px)',
      opacity: visible ? 1 : 0, transition: 'all 0.3s cubic-bezier(0.22,1,0.36,1)',
      background: WHITE, border: `1px solid ${BORDER}`, borderRadius: 12,
      padding: '16px 20px', boxShadow: '0 12px 40px rgba(27,53,87,0.18)',
      zIndex: 8000, width: 360, display: 'flex', flexDirection: 'column', gap: 10,
    }}>
      <div style={{ display: 'flex', alignItems: 'flex-start', gap: 10 }}>
        <div style={{ width: 32, height: 32, borderRadius: 8, background: '#FEF3C7', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
          <IBell s={16} style={{ color: '#D97706' }} />
        </div>
        <div style={{ flex: 1 }}>
          <div style={{ fontSize: 13, fontWeight: 700, color: T1 }}>{reminder.title}</div>
          {reminder.description && <div style={{ fontSize: 12, color: TM, marginTop: 2 }}>{reminder.description}</div>}
        </div>
        <button onClick={onDismiss} style={{ border: 'none', background: 'none', cursor: 'pointer', color: TM, padding: 2 }}><IX s={14} /></button>
      </div>
      <div style={{ display: 'flex', gap: 6 }}>
        <button onClick={onDismiss} style={{ flex: 1, padding: '7px 0', borderRadius: 7, border: `1.5px solid ${BORDER}`, background: WHITE, fontSize: 12, fontWeight: 600, color: T2, cursor: 'pointer' }}>Dismiss</button>
        <button onClick={() => onSnooze(15)} style={{ flex: 1, padding: '7px 0', borderRadius: 7, border: `1.5px solid ${BORDER}`, background: WHITE, fontSize: 12, fontWeight: 600, color: T2, cursor: 'pointer' }}>Snooze 15m</button>
        <button onClick={onDismiss} style={{ flex: 1, padding: '7px 0', borderRadius: 7, border: 'none', background: NAVY, fontSize: 12, fontWeight: 600, color: WHITE, cursor: 'pointer' }}>Open</button>
      </div>
    </div>
  )
}

// ── Sidebar ───────────────────────────────────────────────────────────────────
function Sidebar({ section, setSection, state, currentUser, setCurrentUserId, unreadMentions }) {
  const reminderCount = (state.reminders || []).filter(r => r.status === 'active').length
  const priorityCount = (state.cards || []).filter(c => c.priorityFlag && !c.done).length
  const completedCount = (state.cards || []).filter(c => c.done).length
  const [hover, setHover] = useState(null)
  const [showUserSwitch, setShowUserSwitch] = useState(false)
  const isManager = currentUser?.role === 'manager'

  return (
    <aside style={{
      width: 220, flexShrink: 0, background: WHITE, borderRight: `1px solid ${BORDER}`,
      display: 'flex', flexDirection: 'column', height: '100vh', overflow: 'hidden',
    }}>
      {/* Logo */}
      <div style={{ padding: '18px 18px 14px', borderBottom: `1px solid ${BORDER}` }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
          <div style={{
            width: 34, height: 34, borderRadius: 10,
            background: `linear-gradient(135deg, ${NAVY} 0%, #2563EB 100%)`,
            display: 'flex', alignItems: 'center', justifyContent: 'center',
            boxShadow: '0 2px 8px rgba(27,53,87,0.35)',
          }}>
            <svg width="16" height="16" viewBox="0 0 16 16" fill="none">
              <path d="M3 8.5L6.5 12L13 4" stroke="white" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
              <circle cx="8" cy="8" r="6.5" stroke="white" strokeWidth="1" opacity="0.3"/>
            </svg>
          </div>
          <div>
            <div style={{ fontSize: 14, fontWeight: 900, color: T1, letterSpacing: '-0.5px', lineHeight: 1.2 }}>FlowBoard</div>
            <div style={{ fontSize: 9, color: TM, fontWeight: 600, letterSpacing: '0.8px', textTransform: 'uppercase' }}>Mosaic Wellness</div>
          </div>
        </div>
      </div>

      {/* Nav */}
      <nav style={{ flex: 1, padding: '10px 10px 0', overflowY: 'auto' }}>
        {NAV.map(({ id, label, Icon }) => {
          const active = section === id
          const badge = id === 'reminders' ? reminderCount : id === 'priority' ? priorityCount : id === 'completed' ? completedCount : id === 'threads' ? unreadMentions : 0
          return (
            <button
              key={id}
              onClick={() => setSection(id)}
              onMouseEnter={() => setHover(id)}
              onMouseLeave={() => setHover(null)}
              style={{
                width: '100%', display: 'flex', alignItems: 'center', gap: 9,
                padding: '9px 10px', borderRadius: 8, border: 'none',
                background: active ? NAVY_BG : hover === id ? '#F5F4F2' : 'transparent',
                color: active ? NAVY : T2, cursor: 'pointer', textAlign: 'left',
                marginBottom: 2, transition: 'all 0.12s ease', fontWeight: active ? 700 : 500,
                fontSize: 13, position: 'relative',
              }}>
              {active && (
                <div style={{ position: 'absolute', left: 0, top: '20%', bottom: '20%', width: 3, background: NAVY, borderRadius: '0 3px 3px 0' }} />
              )}
              <Icon s={16} />
              <span style={{ flex: 1 }}>{label}</span>
              {badge > 0 && (
                <span style={{ background: active ? NAVY : '#E8E6E1', color: active ? WHITE : TM, fontSize: 10, fontWeight: 700, borderRadius: 10, padding: '1px 6px', minWidth: 18, textAlign: 'center' }}>{badge}</span>
              )}
            </button>
          )
        })}
      </nav>

      {/* Role badge */}
      {isManager && (
        <div style={{ margin: '0 10px 8px', padding: '5px 10px', borderRadius: 7, background: '#EEF2F8', border: `1px solid ${BORDER}`, fontSize: 10, fontWeight: 700, color: NAVY, textAlign: 'center', letterSpacing: '0.3px' }}>
          MANAGER VIEW — All cards visible
        </div>
      )}
      {!isManager && (
        <div style={{ margin: '0 10px 8px', padding: '5px 10px', borderRadius: 7, background: '#F9FAFB', border: `1px solid ${BORDER}`, fontSize: 10, fontWeight: 700, color: TM, textAlign: 'center', letterSpacing: '0.3px' }}>
          MEMBER VIEW — Your cards only
        </div>
      )}

      {/* User footer */}
      <div style={{ padding: '12px 14px', borderTop: `1px solid ${BORDER}`, position: 'relative' }}>
        {showUserSwitch && (
          <div style={{
            position: 'absolute', bottom: '100%', left: 10, right: 10, marginBottom: 6,
            background: WHITE, border: `1px solid ${BORDER}`, borderRadius: 10,
            boxShadow: SH_MD, overflow: 'hidden', maxHeight: 240, overflowY: 'auto',
          }}>
            <div style={{ padding: '8px 10px', fontSize: 10, fontWeight: 800, color: TM, textTransform: 'uppercase', letterSpacing: '0.4px', borderBottom: `1px solid ${BORDER}` }}>Switch user</div>
            {USERS.map(u => (
              <button key={u.id} onClick={() => { setCurrentUserId(u.id); setShowUserSwitch(false) }}
                style={{ width: '100%', display: 'flex', alignItems: 'center', gap: 8, padding: '8px 10px', border: 'none', background: u.id === currentUser?.id ? '#F0F4FF' : 'transparent', cursor: 'pointer', textAlign: 'left', borderBottom: `1px solid ${BORDER}` }}>
                <div style={{ width: 24, height: 24, borderRadius: '50%', background: u.color, display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 9, fontWeight: 700, color: WHITE, flexShrink: 0 }}>{initials(u.name)}</div>
                <div style={{ flex: 1 }}>
                  <div style={{ fontSize: 11, fontWeight: 700, color: T1 }}>{u.name}</div>
                  <div style={{ fontSize: 9, color: TM, textTransform: 'capitalize' }}>{u.role}</div>
                </div>
                {u.id === currentUser?.id && <div style={{ width: 6, height: 6, borderRadius: '50%', background: NAVY }} />}
              </button>
            ))}
          </div>
        )}

        <button onClick={() => setShowUserSwitch(s => !s)} style={{ width: '100%', display: 'flex', alignItems: 'center', gap: 9, background: 'none', border: 'none', cursor: 'pointer', padding: 0 }}>
          <div style={{ width: 30, height: 30, borderRadius: '50%', background: currentUser?.color || NAVY, display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 11, fontWeight: 700, color: WHITE, flexShrink: 0 }}>
            {initials(currentUser?.name || 'U')}
          </div>
          <div style={{ flex: 1, overflow: 'hidden', textAlign: 'left' }}>
            <div style={{ fontSize: 12, fontWeight: 700, color: T1, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{currentUser?.name || 'Unknown'}</div>
            <div style={{ fontSize: 10, color: TM, textTransform: 'capitalize' }}>{currentUser?.role || 'member'}</div>
          </div>
          <ISettings s={14} style={{ color: TM }} />
        </button>
      </div>
    </aside>
  )
}

// ── App shell ─────────────────────────────────────────────────────────────────
export default function App() {
  const [state, setState] = useState(EMPTY_STATE)
  const [loading, setLoading] = useState(true)
  const [section, setSection] = useState('dashboard')
  const [openCardId, setOpenCardId] = useState(null)
  const [activeReminder, setActiveReminder] = useState(null)
  const [mentions, setMentions] = useState([])
  const [currentUserId, setCurrentUserIdRaw] = useState(() => {
    return localStorage.getItem('flowboard_user') || 'u1'
  })

  const currentUser = USERS.find(u => u.id === currentUserId) || USERS[0]
  const isManager = currentUser?.role === 'manager'

  function setCurrentUserId(id) {
    setCurrentUserIdRaw(id)
    localStorage.setItem('flowboard_user', id)
  }

  // Load all data from Neon on mount
  useEffect(() => {
    apiFetch('/api/state')
      .then(data => { setState(data); setLoading(false) })
      .catch(err => { console.error('Failed to load state:', err); setLoading(false) })
  }, [])

  // Poll board state every 3 seconds for real-time updates
  useEffect(() => {
    const poll = () => {
      fetch('/api/state')
        .then(r => r.json())
        .then(data => setState(data))
        .catch(() => {})
    }
    const iv = setInterval(poll, 3000)
    return () => clearInterval(iv)
  }, [])

  // Poll mentions every 3 seconds
  useEffect(() => {
    if (!currentUser) return
    const fetchMentions = () => {
      fetch(`/api/mentions?userId=${currentUser.id}`)
        .then(r => r.json())
        .then(data => Array.isArray(data) ? setMentions(data) : null)
        .catch(() => {})
    }
    fetchMentions()
    const iv = setInterval(fetchMentions, 3000)
    return () => clearInterval(iv)
  }, [currentUser?.id])

  // Show reminder popup after 4s if there's an active one due today
  useEffect(() => {
    const today = new Date().toISOString().slice(0, 10)
    const t = setTimeout(() => {
      const r = (state.reminders || []).find(r => r.status === 'active' && r.triggerDate === today)
      if (r) setActiveReminder(r)
    }, 4000)
    return () => clearTimeout(t)
  }, [])

  const updateCard = useCallback((id, updates) => {
    setState(s => {
      const cards = s.cards.map(c => c.id === id ? { ...c, ...updates, updatedAt: now() } : c)
      const updated = cards.find(c => c.id === id)
      if (updated) persist('/api/cards', 'POST', updated)
      return { ...s, cards }
    })
  }, [])

  const updateTask = useCallback((id, updates) => {
    if (updates._deleted) {
      setState(s => { persistDelete(`/api/tasks?id=${id}`); return { ...s, tasks: s.tasks.filter(t => t.id !== id) } })
    } else {
      setState(s => {
        const updatedTask = { ...s.tasks.find(t => t.id === id), ...updates }
        const tasks = s.tasks.map(t => t.id === id ? {
          ...t, ...updates,
          ...(updates.status === 'done' && t.status !== 'done' ? { completedAt: now() } : {}),
          ...(updates.status && updates.status !== 'done' ? { completedAt: null } : {}),
        } : t)

        let cards = s.cards
        if ('priority' in updates) {
          const projectId = updatedTask.projectId
          const anyPriority = tasks.some(t => t.projectId === projectId && t.priority)
          cards = s.cards.map(c => c.id === projectId ? { ...c, priorityFlag: anyPriority } : c)
          const updatedCard = cards.find(c => c.id === projectId)
          if (updatedCard) persist('/api/cards', 'POST', updatedCard)
        }

        const saved = tasks.find(t => t.id === id)
        if (saved) persist('/api/tasks', 'POST', saved)
        return { ...s, tasks, cards }
      })
    }
  }, [])

  const addCard = useCallback((columnId, title, dueDate) => {
    const card = {
      id: uid(), columnId, title, description: '', assigneeId: currentUserId,
      dueDate: dueDate || null, tags: [], priorityFlag: false, done: false,
      position: Date.now(), createdAt: now(), updatedAt: now(), comments: [], links: [], attachments: [],
    }
    persist('/api/cards', 'POST', card)
    setState(s => ({ ...s, cards: [...s.cards, card] }))
    return card.id
  }, [currentUserId])

  const addTask = useCallback((projectId, title, status = 'to_be_picked') => {
    const task = { id: uid(), projectId, title, description: '', status, assigneeId: null, dueDate: null, tags: [], position: Date.now(), createdAt: now(), priority: false }
    persist('/api/tasks', 'POST', task)
    setState(s => ({ ...s, tasks: [...s.tasks, task] }))
  }, [])

  const deleteCard = useCallback((id) => {
    persistDelete(`/api/cards?id=${id}`)
    setState(s => {
      s.tasks.filter(t => t.projectId === id).forEach(t => persistDelete(`/api/tasks?id=${t.id}`))
      return { ...s, cards: s.cards.filter(c => c.id !== id), tasks: s.tasks.filter(t => t.projectId !== id) }
    })
  }, [])

  const addColumn = useCallback((title) => {
    const ACCENTS = ['#6B7280','#2563EB','#7C3AED','#D97706','#DC2626','#059669']
    const col = { id: uid(), title, accent: ACCENTS[state.columns.length % ACCENTS.length], position: state.columns.length }
    persist('/api/columns', 'POST', col)
    setState(s => ({ ...s, columns: [...s.columns, col] }))
  }, [state.columns.length])

  const addReminder = useCallback((reminder) => {
    const r = { id: uid(), ...reminder, createdAt: now() }
    persist('/api/reminders', 'POST', r)
    setState(s => ({ ...s, reminders: [...s.reminders, r] }))
  }, [])

  const updateReminder = useCallback((id, updates) => {
    setState(s => {
      const reminders = s.reminders.map(r => r.id === id ? { ...r, ...updates } : r)
      const updated = reminders.find(r => r.id === id)
      if (updated) persist('/api/reminders', 'POST', updated)
      return { ...s, reminders }
    })
  }, [])

  const deleteReminder = useCallback((id) => {
    persistDelete(`/api/reminders?id=${id}`)
    setState(s => ({ ...s, reminders: s.reminders.filter(r => r.id !== id) }))
  }, [])

  const openCard = useCallback((id) => {
    setOpenCardId(id)
  }, [])

  const shareCard = useCallback((cardId, userIds) => {
    fetch('/api/shares', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ cardId, userIds, sharedBy: currentUserId }),
    }).catch(() => {})
  }, [currentUserId])

  const unshareCard = useCallback((cardId, userId) => {
    fetch(`/api/shares?cardId=${cardId}&userId=${userId}`, { method: 'DELETE' }).catch(() => {})
  }, [])

  const unreadMentions = mentions.filter(m => !m.read_at).length

  // Called by Dashboard after same-column drag reorder
  const persistCards = useCallback((cards) => {
    cards.forEach(card => persist('/api/cards', 'POST', card))
  }, [])

  const sharedProps = { state, setState, updateCard, updateTask, addCard, addTask, deleteCard, addColumn, openCard, persistCards, currentUser, isManager }

  if (loading) return (
    <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', height: '100vh', background: CREAM, flexDirection: 'column', gap: 12 }}>
      <div style={{ width: 40, height: 40, borderRadius: 12, background: `linear-gradient(135deg, ${NAVY} 0%, #2563EB 100%)`, display: 'flex', alignItems: 'center', justifyContent: 'center', boxShadow: '0 4px 16px rgba(27,53,87,0.3)' }}>
        <svg width="20" height="20" viewBox="0 0 16 16" fill="none"><path d="M3 8.5L6.5 12L13 4" stroke="white" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/></svg>
      </div>
      <div style={{ fontSize: 13, color: TM, fontWeight: 500 }}>Loading FlowBoard…</div>
    </div>
  )

  return (
    <div style={{ display: 'flex', height: '100vh', overflow: 'hidden', background: CREAM, fontFamily: '-apple-system,BlinkMacSystemFont,"Segoe UI",Roboto,Helvetica,sans-serif' }}>
      <Sidebar section={section} setSection={setSection} state={state} currentUser={currentUser} setCurrentUserId={setCurrentUserId} unreadMentions={unreadMentions} />

      <main style={{ flex: 1, overflow: 'hidden', position: 'relative', display: 'flex', flexDirection: 'column' }}>
        {section === 'dashboard'  && <Dashboard  {...sharedProps} />}
        {section === 'threads'    && <Threads    currentUser={currentUser} openCard={openCard} />}
        {section === 'priority'   && <Priority   {...sharedProps} />}
        {section === 'completed'  && <Completed  {...sharedProps} />}
        {section === 'reminders'  && <Reminders  state={state} addReminder={addReminder} updateReminder={updateReminder} deleteReminder={deleteReminder} />}
        {section === 'summary'    && <Summary    state={state} currentUser={currentUser} />}
      </main>

      {/* Card drawer */}
      <CardDrawer
        cardId={openCardId}
        state={state}
        updateCard={updateCard}
        updateTask={updateTask}
        addTask={addTask}
        deleteCard={deleteCard}
        onClose={() => setOpenCardId(null)}
        currentUser={currentUser}
      />

      {/* Reminder popup */}
      {activeReminder && (
        <ReminderPopup
          reminder={activeReminder}
          onDismiss={() => setActiveReminder(null)}
          onSnooze={(min) => { updateReminder(activeReminder.id, { status: 'snoozed' }); setActiveReminder(null) }}
        />
      )}

      <ToastHost />
    </div>
  )
}
