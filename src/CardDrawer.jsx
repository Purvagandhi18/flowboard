import { useState, useEffect, useRef } from 'react'
import {
  DndContext, closestCorners, useSensor, useSensors, PointerSensor, DragOverlay,
  useDroppable,
} from '@dnd-kit/core'
import { SortableContext, useSortable, verticalListSortingStrategy, arrayMove } from '@dnd-kit/sortable'
import { CSS } from '@dnd-kit/utilities'
import {
  NAVY, WHITE, BORDER, T1, T2, TM, TL,
  SH_SM, SH_MD, SH_LG, tagColor, formatDate, isOverdue, initials, uid, now,
} from './tokens.jsx'
import { IPlus, IX, IChevD, IChevL, IStar, ICalendar, ITag, IGrip, ITrash, ICheck, ILink, IShare } from './tokens.jsx'

// ─── 3 subtask columns (On Hold removed) ─────────────────────────────────────
const TASK_COLS = [
  { id: 'to_be_picked', label: 'To Pick Up', dot: '#9CA3AF', bg: '#F9FAFB', border: '#E5E7EB' },
  { id: 'in_process',   label: 'In Process',  dot: '#3B82F6', bg: '#EFF6FF', border: '#BFDBFE' },
  { id: 'done',         label: 'Done',        dot: '#10B981', bg: '#F0FDF4', border: '#A7F3D0' },
]

// ─── Helpers ──────────────────────────────────────────────────────────────────
function Av({ userId, size = 22, allUsers = [] }) {
  const u = allUsers.find(u => u.id === userId)
  if (!u) return null
  return (
    <div title={u.name} style={{ width: size, height: size, borderRadius: '50%', background: u.color, display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: size * 0.36, fontWeight: 700, color: WHITE, flexShrink: 0 }}>
      {initials(u.name)}
    </div>
  )
}

function TagChip({ tag, onRemove }) {
  const c = tagColor(tag)
  return (
    <span style={{ display: 'inline-flex', alignItems: 'center', gap: 4, fontSize: 11, fontWeight: 600, padding: '3px 8px', borderRadius: 20, background: c.bg, color: c.text, border: `1px solid ${c.border}` }}>
      {tag}
      {onRemove && <button onClick={() => onRemove(tag)} style={{ border: 'none', background: 'none', cursor: 'pointer', color: c.text, padding: 0, lineHeight: 1 }}>✕</button>}
    </span>
  )
}

// ─── Task card ────────────────────────────────────────────────────────────────
function TaskCard({ task, onToggle, onSelect, isDragOverlay }) {
  const [hover, setHover] = useState(false)
  const col = TASK_COLS.find(c => c.id === task.status)
  const commentCount = (task.comments || []).length
  const hasNotes = !!task.description?.trim()

  return (
    <div
      onMouseEnter={() => !isDragOverlay && setHover(true)}
      onMouseLeave={() => setHover(false)}
      onClick={e => { e.stopPropagation(); if (!isDragOverlay) onSelect?.() }}
      style={{
        background: WHITE, borderRadius: 9, padding: '10px 12px',
        border: `1px solid ${hover ? '#C0BDB8' : BORDER}`,
        boxShadow: isDragOverlay ? SH_LG : hover ? SH_MD : SH_SM,
        transform: isDragOverlay ? 'rotate(2deg) scale(1.04)' : 'none',
        transition: 'all 0.12s',
        borderLeft: `3px solid ${task.priority ? '#F59E0B' : (col?.dot || TL)}`,
        cursor: isDragOverlay ? 'grabbing' : 'pointer',
        userSelect: 'none',
      }}
    >
      <div style={{ display: 'flex', alignItems: 'flex-start', gap: 8 }}>
        {/* Done toggle */}
        <button
          onClick={e => { e.stopPropagation(); onToggle?.() }}
          style={{
            width: 17, height: 17, borderRadius: '50%', flexShrink: 0, marginTop: 2,
            border: `2px solid ${col?.dot || TL}`,
            background: task.status === 'done' ? (col?.dot || TL) : 'transparent',
            cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center',
            transition: 'all 0.15s',
          }}
        >
          {task.status === 'done' && <ICheck s={9} style={{ color: WHITE }} />}
        </button>

        <div style={{ flex: 1, minWidth: 0 }}>
          <div style={{
            fontSize: 12, fontWeight: 600, lineHeight: 1.45, wordBreak: 'break-word',
            color: task.status === 'done' ? TL : T1,
            textDecoration: task.status === 'done' ? 'line-through' : 'none',
          }}>
            {task.priority && <span style={{ color: '#F59E0B', marginRight: 4 }}>★</span>}
            {task.title}
          </div>
          {(commentCount > 0 || hasNotes) && (
            <div style={{ display: 'flex', gap: 8, marginTop: 5 }}>
              {commentCount > 0 && <span style={{ fontSize: 10, color: TL }}>💬 {commentCount}</span>}
              {hasNotes && <span style={{ fontSize: 10, color: TL }}>📝</span>}
            </div>
          )}
        </div>

        {hover && !isDragOverlay && (
          <span style={{ fontSize: 10, color: TM, fontWeight: 700, flexShrink: 0, alignSelf: 'center', whiteSpace: 'nowrap' }}>Open →</span>
        )}
      </div>
    </div>
  )
}

// ─── Sortable wrapper — whole card is the drag handle, no grip dots ───────────
function SortableTask({ task, onToggle, onSelect }) {
  const { attributes, listeners, setNodeRef, transform, transition, isDragging } = useSortable({ id: task.id })
  return (
    <div
      ref={setNodeRef}
      {...attributes}
      {...listeners}
      style={{ transform: CSS.Transform.toString(transform), transition, opacity: isDragging ? 0.2 : 1, touchAction: 'none', cursor: isDragging ? 'grabbing' : 'grab', willChange: 'transform' }}
    >
      <TaskCard task={task} onToggle={onToggle} onSelect={onSelect} />
    </div>
  )
}

// ─── Kanban column ────────────────────────────────────────────────────────────
function KanbanCol({ col, tasks, onToggle, onSelect, onAdd }) {
  const { setNodeRef, isOver } = useDroppable({ id: col.id })
  const [adding, setAdding] = useState(false)
  const [title, setTitle] = useState('')

  function submit() {
    const t = title.trim()
    if (t) onAdd(t, col.id)
    setTitle(''); setAdding(false)
  }

  return (
    <div style={{ flex: 1, minWidth: 150, display: 'flex', flexDirection: 'column' }}>
      {/* Header */}
      <div style={{ display: 'flex', alignItems: 'center', gap: 6, marginBottom: 8, padding: '0 2px' }}>
        <div style={{ width: 8, height: 8, borderRadius: '50%', background: col.dot, flexShrink: 0 }} />
        <span style={{ fontSize: 10, fontWeight: 800, color: TM, textTransform: 'uppercase', letterSpacing: '0.5px' }}>{col.label}</span>
        <span style={{ fontSize: 10, fontWeight: 700, color: TL, marginLeft: 'auto', background: WHITE, borderRadius: 10, padding: '1px 6px', border: `1px solid ${BORDER}` }}>{tasks.length}</span>
      </div>

      {/* Drop zone */}
      <div
        ref={setNodeRef}
        style={{
          flex: 1, borderRadius: 10, padding: 8,
          background: isOver ? col.border + '99' : col.bg,
          border: `1.5px solid ${isOver ? col.dot : col.border}`,
          transition: 'background 0.13s, border-color 0.13s',
          minHeight: 80,
          display: 'flex', flexDirection: 'column', gap: 6,
        }}
      >
        <SortableContext items={tasks.map(t => t.id)} strategy={verticalListSortingStrategy}>
          {tasks.map(task => (
            <SortableTask
              key={task.id} task={task}
              onToggle={() => onToggle(task.id)}
              onSelect={() => onSelect(task.id)}
            />
          ))}
        </SortableContext>

        {adding ? (
          <input
            autoFocus value={title} onChange={e => setTitle(e.target.value)}
            onKeyDown={e => { if (e.key === 'Enter') submit(); if (e.key === 'Escape') { setAdding(false); setTitle('') } }}
            onBlur={() => { if (title.trim()) submit(); else setAdding(false) }}
            placeholder="Subtask name…"
            style={{ width: '100%', padding: '7px 9px', borderRadius: 7, border: `1.5px solid ${col.dot}`, fontSize: 12, outline: 'none', fontFamily: 'inherit', boxSizing: 'border-box', background: WHITE }}
          />
        ) : (
          <button
            onClick={() => setAdding(true)}
            style={{ marginTop: 'auto', padding: '6px 0', border: 'none', background: 'transparent', cursor: 'pointer', color: TL, fontSize: 11, fontWeight: 600, display: 'flex', alignItems: 'center', gap: 4, justifyContent: 'center', borderRadius: 6, transition: 'all 0.12s', width: '100%' }}
            onMouseEnter={e => { e.currentTarget.style.background = WHITE + 'CC'; e.currentTarget.style.color = NAVY }}
            onMouseLeave={e => { e.currentTarget.style.background = 'transparent'; e.currentTarget.style.color = TL }}
          >
            <IPlus s={11} /> Add subtask
          </button>
        )}
      </div>
    </div>
  )
}

// ─── Task detail panel (right side) ──────────────────────────────────────────
function TaskDetailPanel({ task, updateTask, onBack, card, currentUser, allUsers }) {
  const [tab, setTab] = useState('comments')
  const [commentText, setCommentText] = useState('')
  const [showLinkInput, setShowLinkInput] = useState(false)
  const [linkUrl, setLinkUrl] = useState('')
  const [linkLabel, setLinkLabel] = useState('')
  const [desc, setDesc] = useState(task.description || '')

  // Sync desc when task changes (e.g. back → another task)
  useEffect(() => { setDesc(task.description || '') }, [task.id])

  const col = TASK_COLS.find(c => c.id === task.status)
  const comments = task.comments || []

  function postComment() {
    const body = commentText.trim()
    if (!body) return
    updateTask(task.id, { comments: [...comments, { id: uid(), body, authorId: currentUser?.id, createdAt: now() }] })
    postMentions(body)
    setCommentText('')
  }

  function postMentions(text) {
    if (!card || !currentUser) return
    const users = allUsers || []
    const mentioned = users.filter(u => {
      const firstName = u.name.split(' ')[0]
      return text.includes(`@${firstName}`) || text.includes(`@${u.name.replace(' ', '')}`)
    })
    for (const user of mentioned) {
      if (user.id === currentUser.id) continue
      fetch('/api/mentions', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          id: uid(),
          cardId: card.id,
          cardTitle: card.title,
          mentionedUserId: user.id,
          mentionedByUserId: currentUser.id,
          commentText: text,
          sender_id: currentUser.id,
          recipient_id: user.id,
        }),
      }).catch(() => {})
    }
  }

  function postLink() {
    const url = linkUrl.trim()
    if (!url) return
    updateTask(task.id, { comments: [...comments, { id: uid(), type: 'link', url, label: linkLabel.trim() || url, authorId: currentUser?.id, createdAt: now() }] })
    setLinkUrl(''); setLinkLabel(''); setShowLinkInput(false)
  }

  function saveDesc() { updateTask(task.id, { description: desc }) }

  function removeComment(id) { updateTask(task.id, { comments: comments.filter(c => c.id !== id) }) }

  return (
    <div style={{ width: 300, flexShrink: 0, display: 'flex', flexDirection: 'column', borderLeft: `1px solid ${BORDER}`, background: '#FDFCFB', overflow: 'hidden' }}>

      {/* ── Panel header ── */}
      <div style={{ padding: '12px 14px', borderBottom: `1px solid ${BORDER}`, flexShrink: 0 }}>
        <button onClick={onBack}
          style={{ display: 'flex', alignItems: 'center', gap: 4, border: 'none', background: 'none', cursor: 'pointer', color: TM, fontSize: 11, fontWeight: 700, padding: 0, marginBottom: 10 }}>
          <IChevL s={12} /> Back to card
        </button>

        <div style={{ display: 'flex', alignItems: 'center', gap: 7, marginBottom: 6 }}>
          <div style={{ width: 8, height: 8, borderRadius: '50%', background: col?.dot || TL }} />
          <span style={{ fontSize: 10, fontWeight: 700, color: TM, textTransform: 'uppercase', letterSpacing: '0.4px' }}>{col?.label || task.status}</span>
          <div style={{ flex: 1 }} />
          {/* Priority toggle for subtask */}
          <button
            onClick={() => updateTask(task.id, { priority: !task.priority })}
            style={{
              display: 'flex', alignItems: 'center', gap: 4, padding: '3px 8px', borderRadius: 6,
              border: `1.5px solid ${task.priority ? '#F59E0B' : BORDER}`,
              background: task.priority ? '#FFFBEB' : 'transparent',
              fontSize: 11, fontWeight: 700, color: task.priority ? '#92400E' : TM,
              cursor: 'pointer', transition: 'all 0.12s',
            }}>
            <IStar s={11} filled={task.priority} />
            {task.priority ? 'Priority' : 'Set priority'}
          </button>
        </div>
        <div style={{ fontSize: 14, fontWeight: 800, color: T1, lineHeight: 1.3 }}>{task.title}</div>
      </div>

      {/* ── Tabs ── */}
      <div style={{ display: 'flex', borderBottom: `1px solid ${BORDER}`, flexShrink: 0 }}>
        {[
          { id: 'comments', label: comments.length > 0 ? `Comments (${comments.length})` : 'Comments' },
          { id: 'notes',    label: 'Notes' },
        ].map(t => (
          <button key={t.id} onClick={() => setTab(t.id)}
            style={{ flex: 1, padding: '9px 4px', border: 'none', background: 'transparent', fontSize: 11, fontWeight: tab === t.id ? 800 : 500, color: tab === t.id ? NAVY : TM, borderBottom: `2px solid ${tab === t.id ? NAVY : 'transparent'}`, cursor: 'pointer', transition: 'all 0.13s' }}>
            {t.label}
          </button>
        ))}
      </div>

      {/* ── Tab content (flex: 1, clips overflow) ── */}
      <div style={{ flex: 1, overflow: 'hidden', display: 'flex', flexDirection: 'column' }}>

        {/* Comments */}
        {tab === 'comments' && (
          <div style={{ flex: 1, display: 'flex', flexDirection: 'column', overflow: 'hidden' }}>
            {/* Feed */}
            <div style={{ flex: 1, overflowY: 'auto', padding: '12px 14px', display: 'flex', flexDirection: 'column', gap: 10 }}>
              {comments.length === 0 && (
                <div style={{ textAlign: 'center', padding: '40px 0', color: TL, fontSize: 12, lineHeight: 1.6 }}>
                  No comments yet<br />Ask for an update or attach a file link
                </div>
              )}
              {comments.map(c => {
                const user = (allUsers || []).find(u => u.id === c.authorId)
                const isLink = c.type === 'link'
                return (
                  <div key={c.id} style={{ display: 'flex', gap: 8 }}>
                    <div style={{ width: 26, height: 26, borderRadius: '50%', background: user?.color || TL, display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 9, fontWeight: 700, color: WHITE, flexShrink: 0 }}>
                      {user ? initials(user.name) : '?'}
                    </div>
                    <div style={{ flex: 1, minWidth: 0 }}>
                      <div style={{ display: 'flex', alignItems: 'center', gap: 6, marginBottom: 3 }}>
                        <span style={{ fontSize: 11, fontWeight: 700, color: T1 }}>{user?.name?.split(' ')[0] || 'You'}</span>
                        <span style={{ fontSize: 10, color: TL }}>{new Date(c.createdAt).toLocaleDateString('en-IN', { month: 'short', day: 'numeric' })}</span>
                        <button onClick={() => removeComment(c.id)} style={{ marginLeft: 'auto', border: 'none', background: 'none', cursor: 'pointer', color: TL, padding: 0, fontSize: 10, lineHeight: 1 }}>✕</button>
                      </div>
                      {isLink ? (
                        <div style={{ display: 'flex', alignItems: 'center', gap: 8, padding: '8px 10px', borderRadius: 8, background: WHITE, border: `1px solid ${BORDER}` }}>
                          <div style={{ width: 20, height: 20, borderRadius: 5, background: '#EEF2F8', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
                            <ILink s={11} style={{ color: NAVY }} />
                          </div>
                          <a href={c.url} target="_blank" rel="noopener noreferrer" onClick={e => e.stopPropagation()}
                            style={{ flex: 1, fontSize: 12, fontWeight: 600, color: NAVY, textDecoration: 'none', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                            {c.label}
                          </a>
                        </div>
                      ) : (
                        <div style={{ fontSize: 12, color: T2, lineHeight: 1.55, background: WHITE, borderRadius: 8, padding: '7px 10px', border: `1px solid ${BORDER}`, wordBreak: 'break-word' }}>
                          {c.body}
                        </div>
                      )}
                    </div>
                  </div>
                )
              })}
            </div>

            {/* Compose */}
            <div style={{ padding: '10px 14px', borderTop: `1px solid ${BORDER}`, flexShrink: 0 }}>
              {showLinkInput && (
                <div style={{ background: WHITE, borderRadius: 9, border: `1.5px solid ${NAVY}`, padding: '10px 11px', display: 'flex', flexDirection: 'column', gap: 7, marginBottom: 8 }}>
                  <input value={linkLabel} onChange={e => setLinkLabel(e.target.value)} placeholder="Label (e.g. Figma file)"
                    style={{ padding: '7px 9px', borderRadius: 7, border: `1.5px solid ${BORDER}`, fontSize: 12, outline: 'none', fontFamily: 'inherit', color: T1 }} />
                  <input autoFocus value={linkUrl} onChange={e => setLinkUrl(e.target.value)} placeholder="https://…"
                    onKeyDown={e => { if (e.key === 'Enter') postLink(); if (e.key === 'Escape') { setShowLinkInput(false); setLinkUrl(''); setLinkLabel('') } }}
                    style={{ padding: '7px 9px', borderRadius: 7, border: `1.5px solid ${BORDER}`, fontSize: 12, outline: 'none', fontFamily: 'inherit', color: T1 }} />
                  <div style={{ display: 'flex', gap: 6 }}>
                    <button onClick={postLink} style={{ flex: 1, padding: '7px 0', borderRadius: 7, border: 'none', background: NAVY, color: WHITE, fontSize: 12, fontWeight: 700, cursor: 'pointer' }}>Attach</button>
                    <button onClick={() => { setShowLinkInput(false); setLinkUrl(''); setLinkLabel('') }}
                      style={{ padding: '7px 10px', borderRadius: 7, border: `1.5px solid ${BORDER}`, background: WHITE, fontSize: 12, cursor: 'pointer', color: T2 }}>Cancel</button>
                  </div>
                </div>
              )}
              <MentionTextarea
                value={commentText}
                onChange={e => setCommentText(e.target.value)}
                onKeyDown={e => { if (e.key === 'Enter' && e.metaKey) postComment() }}
                placeholder="Ask for an update… (⌘↵ to send, type @ to mention)"
                style={{ width: '100%', padding: '8px 10px', borderRadius: 8, border: `1.5px solid ${BORDER}`, fontSize: 12, outline: 'none', resize: 'none', fontFamily: 'inherit', lineHeight: 1.5, color: T1, boxSizing: 'border-box', background: WHITE, transition: 'border-color 0.12s' }}
                allUsers={allUsers}
              />
              <div style={{ display: 'flex', gap: 6, marginTop: 6 }}>
                <button
                  onClick={() => setShowLinkInput(s => !s)}
                  style={{ padding: '7px 10px', borderRadius: 7, border: `1.5px solid ${showLinkInput ? NAVY : BORDER}`, background: showLinkInput ? '#EEF2F8' : WHITE, fontSize: 12, fontWeight: 700, color: NAVY, cursor: 'pointer', display: 'flex', alignItems: 'center', gap: 5 }}>
                  <ILink s={13} /> Link
                </button>
                <button onClick={postComment}
                  style={{ flex: 1, padding: '7px 0', borderRadius: 7, border: 'none', background: NAVY, color: WHITE, fontSize: 12, fontWeight: 700, cursor: 'pointer' }}>
                  Post
                </button>
              </div>
            </div>
          </div>
        )}

        {/* Notes */}
        {tab === 'notes' && (
          <div style={{ flex: 1, display: 'flex', flexDirection: 'column', padding: '12px 14px', overflow: 'hidden' }}>
            <textarea
              value={desc}
              onChange={e => setDesc(e.target.value)}
              placeholder="Write notes, context, or details for this subtask…"
              style={{ flex: 1, width: '100%', padding: '9px 11px', borderRadius: 8, border: `1.5px solid ${BORDER}`, fontSize: 12, lineHeight: 1.6, resize: 'none', fontFamily: 'inherit', outline: 'none', color: T1, background: WHITE, boxSizing: 'border-box', transition: 'border-color 0.12s', marginBottom: 8 }}
              onFocus={e => { e.currentTarget.style.borderColor = NAVY }}
              onBlur={e => { e.currentTarget.style.borderColor = BORDER; saveDesc() }}
            />
            <button onClick={saveDesc}
              style={{ padding: '8px 0', borderRadius: 7, border: 'none', background: NAVY, color: WHITE, fontSize: 12, fontWeight: 700, cursor: 'pointer', flexShrink: 0 }}>
              Save notes
            </button>
          </div>
        )}
      </div>

      {/* ── Delete subtask — always at bottom ── */}
      <div style={{ padding: '10px 14px', borderTop: `1px solid ${BORDER}`, flexShrink: 0 }}>
        <button
          onClick={() => { updateTask(task.id, { _deleted: true }); onBack() }}
          style={{ width: '100%', padding: '7px 0', borderRadius: 7, border: `1.5px solid #FECACA`, background: '#FEF2F2', fontSize: 12, fontWeight: 700, color: '#DC2626', cursor: 'pointer', display: 'flex', alignItems: 'center', gap: 5, justifyContent: 'center' }}>
          <ITrash s={13} /> Delete subtask
        </button>
      </div>
    </div>
  )
}

// ─── Empty right panel ────────────────────────────────────────────────────────
function EmptyPanel() {
  return (
    <div style={{ width: 280, flexShrink: 0, display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', borderLeft: `1px solid ${BORDER}`, background: '#FDFCFB', padding: 24, gap: 10 }}>
      <div style={{ fontSize: 30, opacity: 0.25 }}>☝️</div>
      <div style={{ fontSize: 13, fontWeight: 700, color: T2, textAlign: 'center' }}>Click any subtask</div>
      <div style={{ fontSize: 12, color: TL, textAlign: 'center', lineHeight: 1.5 }}>Open comments, notes, and links for that task</div>
    </div>
  )
}

// ─── Move dropdown ────────────────────────────────────────────────────────────
function MoveDropdown({ columns, currentColId, onMove, onClose }) {
  return (
    <>
      <div style={{ position: 'fixed', inset: 0, zIndex: 9998 }} onClick={onClose} />
      <div style={{ position: 'absolute', top: '110%', left: 0, background: WHITE, border: `1px solid ${BORDER}`, borderRadius: 10, padding: 6, boxShadow: SH_LG, zIndex: 9999, minWidth: 180 }}>
        <div style={{ fontSize: 10, fontWeight: 700, color: TL, textTransform: 'uppercase', letterSpacing: '0.5px', padding: '4px 10px 6px' }}>Move to column</div>
        {columns.filter(c => c.id !== currentColId).sort((a, b) => a.position - b.position).map(col => (
          <button key={col.id} onClick={() => { onMove(col.id); onClose() }}
            style={{ display: 'flex', alignItems: 'center', gap: 8, width: '100%', padding: '8px 10px', border: 'none', background: 'none', borderRadius: 7, cursor: 'pointer', fontSize: 13, fontWeight: 600, color: T1, textAlign: 'left' }}
            onMouseEnter={e => e.currentTarget.style.background = '#F5F4F2'}
            onMouseLeave={e => e.currentTarget.style.background = 'none'}
          >
            <div style={{ width: 8, height: 8, borderRadius: '50%', background: col.accent, flexShrink: 0 }} />
            {col.title}
          </button>
        ))}
      </div>
    </>
  )
}

// ─── Share modal ──────────────────────────────────────────────────────────────
function ShareModal({ cardId, shares, currentUser, allUsers, onClose, setState }) {
  const cardShares = (shares || []).filter(s => s.card_id === cardId)
  const sharedUserIds = new Set(cardShares.map(s => s.user_id))
  const [selected, setSelected] = useState(new Set(sharedUserIds))
  const [saving, setSaving] = useState(false)

  const eligibleUsers = (allUsers || []).filter(u => u.id !== currentUser?.id)

  async function handleSave() {
    setSaving(true)
    const toAdd = [...selected].filter(id => !sharedUserIds.has(id))
    const toRemove = [...sharedUserIds].filter(id => !selected.has(id))

    if (toAdd.length > 0) {
      await fetch('/api/shares', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ cardId, userIds: toAdd, sharedBy: currentUser?.id }),
      }).catch(() => {})
    }
    for (const uid of toRemove) {
      await fetch(`/api/shares?cardId=${cardId}&userId=${uid}`, { method: 'DELETE' }).catch(() => {})
    }

    // Update local state immediately so UI reflects change without waiting for next poll
    if (setState) {
      setState(s => {
        let shares = s.shares || []
        // Add new
        for (const uid of toAdd) {
          if (!shares.find(sh => sh.card_id === cardId && sh.user_id === uid)) {
            shares = [...shares, { card_id: cardId, user_id: uid, shared_by: currentUser?.id }]
          }
        }
        // Remove
        shares = shares.filter(sh => !(sh.card_id === cardId && toRemove.includes(sh.user_id)))
        return { ...s, shares }
      })
    }

    setSaving(false)
    onClose()
  }

  function toggle(userId) {
    setSelected(s => {
      const next = new Set(s)
      if (next.has(userId)) next.delete(userId); else next.add(userId)
      return next
    })
  }

  return (
    <>
      <div style={{ position: 'fixed', inset: 0, zIndex: 9998 }} onClick={onClose} />
      <div style={{ position: 'absolute', top: '110%', right: 0, zIndex: 9999, background: WHITE, border: `1px solid ${BORDER}`, borderRadius: 12, padding: 16, boxShadow: SH_LG, minWidth: 240 }}>
        <div style={{ fontSize: 13, fontWeight: 800, color: T1, marginBottom: 12 }}>Share card with</div>
        <div style={{ display: 'flex', flexDirection: 'column', gap: 8, marginBottom: 14 }}>
          {eligibleUsers.map(u => (
            <label key={u.id} style={{ display: 'flex', alignItems: 'center', gap: 10, cursor: 'pointer', padding: '6px 8px', borderRadius: 8, background: selected.has(u.id) ? '#EEF3FF' : 'transparent', transition: 'background 0.12s' }}>
              <input
                type="checkbox"
                checked={selected.has(u.id)}
                onChange={() => toggle(u.id)}
                style={{ accentColor: NAVY, width: 14, height: 14 }}
              />
              <div style={{ width: 26, height: 26, borderRadius: '50%', background: u.color, display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 9, fontWeight: 700, color: WHITE, flexShrink: 0 }}>
                {initials(u.name)}
              </div>
              <div>
                <div style={{ fontSize: 12, fontWeight: 700, color: T1 }}>{u.name}</div>
                <div style={{ fontSize: 10, color: TM, textTransform: 'capitalize' }}>{u.role}</div>
              </div>
            </label>
          ))}
        </div>
        <button
          onClick={handleSave}
          disabled={saving}
          style={{ width: '100%', padding: '8px 0', borderRadius: 8, border: 'none', background: NAVY, color: WHITE, fontSize: 12, fontWeight: 700, cursor: 'pointer', opacity: saving ? 0.7 : 1 }}>
          {saving ? 'Saving…' : 'Done'}
        </button>
      </div>
    </>
  )
}

// ─── @mention autocomplete ────────────────────────────────────────────────────
function MentionTextarea({ value, onChange, onKeyDown, placeholder, style, allUsers }) {
  const [showDropdown, setShowDropdown] = useState(false)
  const [query, setQuery] = useState('')
  const [atPos, setAtPos] = useState(-1)
  const ref = useRef(null)

  function handleChange(e) {
    const val = e.target.value
    onChange(e)
    const cursor = e.target.selectionStart
    // Find last @ before cursor
    const before = val.slice(0, cursor)
    const match = before.match(/@(\w*)$/)
    if (match) {
      setAtPos(cursor - match[0].length)
      setQuery(match[1])
      setShowDropdown(true)
    } else {
      setShowDropdown(false)
    }
  }

  function selectUser(user) {
    const val = ref.current.value
    const before = val.slice(0, atPos)
    const after = val.slice(atPos + query.length + 1) // +1 for @
    const newVal = before + '@' + user.name.split(' ')[0] + ' ' + after
    onChange({ target: { value: newVal } })
    setShowDropdown(false)
    ref.current.focus()
  }

  const filtered = (allUsers || []).filter(u => u.name.toLowerCase().startsWith(query.toLowerCase()) || u.name.split(' ')[0].toLowerCase().startsWith(query.toLowerCase()))

  return (
    <div style={{ position: 'relative' }}>
      <textarea
        ref={ref}
        value={value}
        onChange={handleChange}
        onKeyDown={e => {
          if (e.key === 'Escape') setShowDropdown(false)
          onKeyDown?.(e)
        }}
        onBlur={() => setTimeout(() => setShowDropdown(false), 150)}
        placeholder={placeholder}
        rows={3}
        style={style}
      />
      {showDropdown && filtered.length > 0 && (
        <div style={{ position: 'absolute', bottom: '100%', left: 0, right: 0, background: WHITE, border: `1px solid ${BORDER}`, borderRadius: 8, boxShadow: SH_MD, overflow: 'hidden', zIndex: 100, marginBottom: 4 }}>
          {filtered.map(u => (
            <button key={u.id} onMouseDown={() => selectUser(u)}
              style={{ width: '100%', display: 'flex', alignItems: 'center', gap: 8, padding: '8px 10px', border: 'none', background: 'none', cursor: 'pointer', textAlign: 'left', borderBottom: `1px solid ${BORDER}` }}
              onMouseEnter={e => e.currentTarget.style.background = '#F5F4F2'}
              onMouseLeave={e => e.currentTarget.style.background = 'none'}
            >
              <div style={{ width: 22, height: 22, borderRadius: '50%', background: u.color, display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 8, fontWeight: 700, color: WHITE }}>{initials(u.name)}</div>
              <span style={{ fontSize: 12, fontWeight: 600, color: T1 }}>{u.name}</span>
            </button>
          ))}
        </div>
      )}
    </div>
  )
}

// ─── Main modal ───────────────────────────────────────────────────────────────
export default function CardDrawer({ cardId, state, updateCard, updateTask, addTask, deleteCard, onClose, currentUser, allUsers, shareCard, unshareCard, setState }) {
  const [mounted, setMounted] = useState(false)
  const [activeTaskId, setActiveTaskId] = useState(null)
  const [selectedTaskId, setSelectedTaskId] = useState(null)
  const [showMove, setShowMove] = useState(false)
  const [showShare, setShowShare] = useState(false)
  const [showTagInput, setShowTagInput] = useState(false)
  const [tagDraft, setTagDraft] = useState('')
  const [titleEditing, setTitleEditing] = useState(false)
  const [titleDraft, setTitleDraft] = useState('')

  const sensors = useSensors(useSensor(PointerSensor, { activationConstraint: { distance: 4 } }))

  useEffect(() => {
    if (cardId) {
      setMounted(false); setShowMove(false); setTitleEditing(false); setSelectedTaskId(null)
      requestAnimationFrame(() => requestAnimationFrame(() => setMounted(true)))
    } else {
      setMounted(false)
    }
  }, [cardId])

  useEffect(() => {
    function onKey(e) {
      if (e.key === 'Escape') {
        if (selectedTaskId) setSelectedTaskId(null)
        else if (!showMove) onClose()
      }
    }
    window.addEventListener('keydown', onKey)
    return () => window.removeEventListener('keydown', onKey)
  }, [onClose, showMove, selectedTaskId])

  const card = state.cards.find(c => c.id === cardId)
  // Treat on_hold tasks as to_be_picked so removing the column doesn't orphan old data
  const tasks = (state.tasks || [])
    .filter(t => t.projectId === cardId && !t._deleted)
    .map(t => t.status === 'on_hold' ? { ...t, status: 'to_be_picked' } : t)
  const currentCol = (state.columns || []).find(c => c.id === card?.columnId)

  if (!cardId || !card) return null

  const doneTasks = tasks.filter(t => t.status === 'done').length
  const totalTasks = tasks.length
  const progressPct = totalTasks > 0 ? Math.round((doneTasks / totalTasks) * 100) : 0

  function update(updates) { updateCard(cardId, updates) }
  function handleMarkDone() { update({ done: true, doneAt: now() }); onClose() }
  function handleDelete() {
    if (window.confirm(`Delete "${card.title}"? This cannot be undone.`)) { deleteCard(cardId); onClose() }
  }

  function addTag(tag) {
    const t = tag.trim().toLowerCase()
    if (!t || card.tags?.includes(t)) return
    update({ tags: [...(card.tags || []), t] })
    setTagDraft(''); setShowTagInput(false)
  }

  function handleAddTask(title, status) { addTask(cardId, title, status) }

  function handleToggle(taskId) {
    const t = tasks.find(x => x.id === taskId)
    if (t) updateTask(taskId, { status: t.status === 'done' ? 'to_be_picked' : 'done' })
  }

  function getColTasks(status) {
    return tasks.filter(t => t.status === status).sort((a, b) => (a.position || 0) - (b.position || 0))
  }

  function handleDragEnd({ active, over }) {
    setActiveTaskId(null)
    if (!over || active.id === over.id) return

    const dragged = tasks.find(t => t.id === active.id)
    if (!dragged) return

    // `over` is either another task id or a column id
    const overIsCol = TASK_COLS.some(c => c.id === over.id)
    const overTask = !overIsCol ? tasks.find(t => t.id === over.id) : null
    const targetStatus = overTask ? overTask.status : over.id

    if (!TASK_COLS.some(c => c.id === targetStatus)) return

    if (overTask && overTask.status === dragged.status) {
      // Reorder within same column
      const col = getColTasks(dragged.status)
      const from = col.findIndex(t => t.id === active.id)
      const to = col.findIndex(t => t.id === over.id)
      arrayMove(col, from, to).forEach((t, i) => updateTask(t.id, { position: i * 100 }))
    } else {
      // Move to different column
      updateTask(active.id, { status: targetStatus, position: Date.now() })
    }
  }

  const activeTask = tasks.find(t => t.id === activeTaskId)
  const selectedTask = selectedTaskId ? tasks.find(t => t.id === selectedTaskId) : null
  const isCardPriority = !!(card?.priorityFlag || tasks.some(t => t.priority))

  return (
    <>
      {/* Backdrop */}
      <div
        onClick={onClose}
        style={{
          position: 'fixed', inset: 0, zIndex: 2000,
          background: 'rgba(15,23,42,0.5)',
          opacity: mounted ? 1 : 0,
          transition: 'opacity 0.2s ease',
          backdropFilter: 'blur(3px)',
        }}
      />

      {/* Modal — centered, no pointerEvents hack */}
      <div style={{ position: 'fixed', inset: 0, zIndex: 2001, display: 'flex', alignItems: 'center', justifyContent: 'center', padding: 24 }}>
        <div
          onClick={e => e.stopPropagation()}
          style={{
            width: '100%', maxWidth: 1040,
            height: '90vh', maxHeight: 720,
            background: WHITE, borderRadius: 16,
            boxShadow: '0 24px 80px rgba(15,23,42,0.28)',
            display: 'flex', flexDirection: 'column', overflow: 'hidden',
            transform: mounted ? 'scale(1) translateY(0)' : 'scale(0.95) translateY(16px)',
            opacity: mounted ? 1 : 0,
            transition: 'transform 0.24s cubic-bezier(0.22,1,0.36,1), opacity 0.18s ease',
          }}
        >
          {/* ── Header ── */}
          <div style={{ padding: '16px 20px 12px', borderBottom: `1px solid ${BORDER}`, flexShrink: 0 }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: 7, marginBottom: 12, flexWrap: 'wrap' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: 5, padding: '4px 10px', borderRadius: 20, border: `1px solid ${BORDER}`, background: '#F7F6F4' }}>
                <div style={{ width: 7, height: 7, borderRadius: '50%', background: currentCol?.accent || TL }} />
                <span style={{ fontSize: 11, fontWeight: 700, color: TM }}>{currentCol?.title || '—'}</span>
              </div>
              <div style={{ flex: 1 }} />

              <button onClick={() => update({ priorityFlag: !card.priorityFlag })}
                style={{ display: 'flex', alignItems: 'center', gap: 5, padding: '5px 11px', borderRadius: 8, border: `1.5px solid ${isCardPriority ? '#F59E0B' : BORDER}`, background: isCardPriority ? '#FFFBEB' : 'transparent', fontSize: 12, fontWeight: 700, color: isCardPriority ? '#92400E' : TM, cursor: 'pointer' }}>
                <IStar s={13} filled={isCardPriority} /> {isCardPriority ? 'Priority' : 'Set priority'}
              </button>

              <div style={{ position: 'relative' }}>
                <button onClick={() => setShowMove(s => !s)}
                  style={{ display: 'flex', alignItems: 'center', gap: 5, padding: '5px 11px', borderRadius: 8, border: `1.5px solid ${BORDER}`, background: 'transparent', fontSize: 12, fontWeight: 700, color: TM, cursor: 'pointer' }}>
                  Move <IChevD s={11} />
                </button>
                {showMove && <MoveDropdown columns={state.columns || []} currentColId={card.columnId} onMove={col => update({ columnId: col })} onClose={() => setShowMove(false)} />}
              </div>

              <div style={{ position: 'relative' }}>
                <button onClick={() => setShowShare(s => !s)}
                  style={{ display: 'flex', alignItems: 'center', gap: 5, padding: '5px 11px', borderRadius: 8, border: `1.5px solid ${BORDER}`, background: showShare ? '#EEF3FF' : 'transparent', fontSize: 12, fontWeight: 700, color: showShare ? NAVY : TM, cursor: 'pointer' }}>
                  <IShare s={13} /> Share
                </button>
                {showShare && <ShareModal cardId={cardId} shares={state.shares || []} currentUser={currentUser} allUsers={allUsers} setState={setState} onClose={() => setShowShare(false)} />}
              </div>

              <button onClick={handleMarkDone}
                style={{ display: 'flex', alignItems: 'center', gap: 5, padding: '5px 11px', borderRadius: 8, border: `1.5px solid #10B981`, background: '#F0FDF4', fontSize: 12, fontWeight: 700, color: '#065F46', cursor: 'pointer' }}>
                <ICheck s={13} /> Mark done
              </button>

              <button onClick={handleDelete}
                style={{ display: 'flex', alignItems: 'center', gap: 5, padding: '5px 11px', borderRadius: 8, border: `1.5px solid #FECACA`, background: '#FEF2F2', fontSize: 12, fontWeight: 700, color: '#DC2626', cursor: 'pointer' }}>
                <ITrash s={13} /> Delete
              </button>

              <button onClick={onClose} style={{ width: 30, height: 30, display: 'flex', alignItems: 'center', justifyContent: 'center', border: 'none', background: '#F3F4F6', borderRadius: 7, cursor: 'pointer', color: TM }}>
                <IX s={14} />
              </button>
            </div>

            {/* Card title */}
            {titleEditing ? (
              <input autoFocus value={titleDraft} onChange={e => setTitleDraft(e.target.value)}
                onBlur={() => { setTitleEditing(false); if (titleDraft.trim()) update({ title: titleDraft.trim() }) }}
                onKeyDown={e => {
                  if (e.key === 'Enter') { setTitleEditing(false); if (titleDraft.trim()) update({ title: titleDraft.trim() }) }
                  if (e.key === 'Escape') setTitleEditing(false)
                }}
                style={{ fontSize: 20, fontWeight: 800, color: T1, border: 'none', outline: 'none', fontFamily: 'inherit', letterSpacing: '-0.3px', width: '100%', background: 'transparent', marginBottom: 8 }} />
            ) : (
              <div onClick={() => { setTitleDraft(card.title); setTitleEditing(true) }}
                style={{ fontSize: 20, fontWeight: 800, color: T1, letterSpacing: '-0.3px', lineHeight: 1.25, marginBottom: 8, cursor: 'text' }}>
                {card.title}
              </div>
            )}

            {/* Meta row */}
            <div style={{ display: 'flex', alignItems: 'center', gap: 10, flexWrap: 'wrap' }}>
              {card.assigneeId && <Av userId={card.assigneeId} size={22} allUsers={allUsers} />}
              {card.dueDate && (
                <span style={{ display: 'flex', alignItems: 'center', gap: 4, fontSize: 12, fontWeight: 600, color: isOverdue(card.dueDate) ? '#DC2626' : TM }}>
                  <ICalendar s={12} />{formatDate(card.dueDate)}
                </span>
              )}
              {(card.tags || []).map(tag => (
                <TagChip key={tag} tag={tag} onRemove={t => update({ tags: (card.tags || []).filter(x => x !== t) })} />
              ))}
              {showTagInput ? (
                <input autoFocus value={tagDraft} onChange={e => setTagDraft(e.target.value)}
                  onKeyDown={e => { if (e.key === 'Enter') addTag(tagDraft); if (e.key === 'Escape') setShowTagInput(false) }}
                  onBlur={() => { if (tagDraft) addTag(tagDraft); else setShowTagInput(false) }}
                  placeholder="tag…"
                  style={{ padding: '3px 8px', borderRadius: 20, border: `1.5px solid ${NAVY}`, fontSize: 11, outline: 'none', width: 90, fontFamily: 'inherit' }} />
              ) : (
                <button onClick={() => setShowTagInput(true)}
                  style={{ display: 'flex', alignItems: 'center', gap: 3, padding: '3px 8px', borderRadius: 20, border: `1.5px dashed ${BORDER}`, background: 'transparent', cursor: 'pointer', fontSize: 11, fontWeight: 600, color: TM }}>
                  <ITag s={11} /> Tag
                </button>
              )}
              {totalTasks > 0 && (
                <div style={{ display: 'flex', alignItems: 'center', gap: 6, marginLeft: 'auto' }}>
                  <div style={{ width: 72, height: 5, background: '#F3F4F6', borderRadius: 3, overflow: 'hidden' }}>
                    <div style={{ width: `${progressPct}%`, height: '100%', background: progressPct === 100 ? '#10B981' : NAVY, borderRadius: 3, transition: 'width 0.4s' }} />
                  </div>
                  <span style={{ fontSize: 11, fontWeight: 700, color: TM, whiteSpace: 'nowrap' }}>{doneTasks}/{totalTasks} done</span>
                </div>
              )}
            </div>
          </div>

          {/* ── Body ── */}
          <div style={{ flex: 1, display: 'flex', overflow: 'hidden' }}>

            {/* Kanban */}
            <div style={{ flex: 1, overflow: 'hidden', padding: '16px 20px', display: 'flex', flexDirection: 'column' }}>
              <div style={{ fontSize: 11, fontWeight: 800, color: TM, textTransform: 'uppercase', letterSpacing: '0.5px', marginBottom: 10 }}>
                Subtasks
              </div>

              <DndContext
                sensors={sensors}
                collisionDetection={closestCorners}
                onDragStart={({ active }) => setActiveTaskId(active.id)}
                onDragEnd={handleDragEnd}
                onDragCancel={() => setActiveTaskId(null)}
              >
                <div style={{ flex: 1, display: 'flex', gap: 10, overflow: 'auto' }}>
                  {TASK_COLS.map(col => (
                    <KanbanCol
                      key={col.id} col={col}
                      tasks={getColTasks(col.id)}
                      onToggle={handleToggle}
                      onSelect={taskId => setSelectedTaskId(taskId)}
                      onAdd={handleAddTask}
                    />
                  ))}
                </div>
                <DragOverlay dropAnimation={{ duration: 180, easing: 'cubic-bezier(0.22,1,0.36,1)' }}>
                  {activeTask && <TaskCard task={activeTask} isDragOverlay />}
                </DragOverlay>
              </DndContext>
            </div>

            {/* Right panel */}
            {selectedTask ? (
              <TaskDetailPanel
                key={selectedTask.id}
                task={selectedTask}
                updateTask={updateTask}
                onBack={() => setSelectedTaskId(null)}
                card={card}
                currentUser={currentUser}
                allUsers={allUsers}
              />
            ) : (
              <EmptyPanel />
            )}
          </div>
        </div>
      </div>
    </>
  )
}
