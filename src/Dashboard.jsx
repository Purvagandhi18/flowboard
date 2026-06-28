import { useState, useRef, useCallback } from 'react'
import { DndContext, DragOverlay, closestCorners, useSensor, useSensors, PointerSensor, KeyboardSensor, useDroppable } from '@dnd-kit/core'
import { SortableContext, useSortable, verticalListSortingStrategy, arrayMove, sortableKeyboardCoordinates } from '@dnd-kit/sortable'
import { CSS } from '@dnd-kit/utilities'
import { USERS } from './data.js'
import { NAVY, NAVY_BG, CREAM, WHITE, BORDER, BORDER2, T1, T2, TM, TL, SH_SM, SH_MD, tagColor, isOverdue, formatDate, initials, uid, now } from './tokens.jsx'
import { IStar, IPlus, IDotsH, IChevD, ICalendar, IUser, ITag, IComment, IGrip, IX, IPen, ITrash, IArchive, ICheck, IChevR } from './tokens.jsx'

// ── Avatar ────────────────────────────────────────────────────────────────────
function Avatar({ userId, size = 22 }) {
  const u = USERS.find(u => u.id === userId)
  if (!u) return null
  return (
    <div style={{ width: size, height: size, borderRadius: '50%', background: u.color, display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: size * 0.38, fontWeight: 700, color: WHITE, flexShrink: 0, border: `2px solid ${WHITE}` }}>
      {initials(u.name)}
    </div>
  )
}

// ── Tag chip ──────────────────────────────────────────────────────────────────
function TagChip({ tag }) {
  const c = tagColor(tag)
  return (
    <span style={{ fontSize: 10, fontWeight: 600, padding: '2px 7px', borderRadius: 20, background: c.bg, color: c.text, border: `1px solid ${c.border}`, whiteSpace: 'nowrap' }}>
      {tag}
    </span>
  )
}

// ── Priority flash animation ──────────────────────────────────────────────────
function StarBtn({ active, onToggle }) {
  const [flash, setFlash] = useState(false)
  function handle(e) {
    e.stopPropagation()
    setFlash(true)
    setTimeout(() => setFlash(false), 300)
    onToggle()
  }
  return (
    <button onClick={handle} style={{ border: 'none', background: 'none', padding: 3, cursor: 'pointer', color: active ? '#F59E0B' : TL, transform: flash ? 'scale(1.4)' : 'scale(1)', transition: 'transform 0.18s cubic-bezier(0.34,1.56,0.64,1), color 0.15s', display: 'flex', alignItems: 'center' }}>
      <IStar s={13} filled={active} />
    </button>
  )
}

// ── Progress bar ──────────────────────────────────────────────────────────────
function Progress({ done, total }) {
  if (total === 0) return null
  const pct = Math.round((done / total) * 100)
  return (
    <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
      <div style={{ flex: 1, height: 3, background: '#F3F4F6', borderRadius: 2, overflow: 'hidden' }}>
        <div style={{ width: `${pct}%`, height: '100%', background: pct === 100 ? '#10B981' : NAVY, borderRadius: 2, transition: 'width 0.4s ease' }} />
      </div>
      <span style={{ fontSize: 10, fontWeight: 600, color: pct === 100 ? '#10B981' : TM, flexShrink: 0 }}>{done}/{total}</span>
    </div>
  )
}

// ── Project card (the draggable card itself) ──────────────────────────────────
function ProjectCard({ card, tasks, accent, onOpen, onTogglePriority, isDragOverlay }) {
  const [hovered, setHovered] = useState(false)
  const doneTasks = tasks.filter(t => t.status === 'done').length
  const overdue = isOverdue(card.dueDate)
  const commentCount = card.comments?.length || 0

  return (
    <div
      onClick={() => !isDragOverlay && onOpen(card.id)}
      onMouseEnter={() => setHovered(true)}
      onMouseLeave={() => setHovered(false)}
      style={{
        background: WHITE, borderRadius: 10, padding: '12px 14px 11px',
        border: `1px solid ${hovered && !isDragOverlay ? BORDER : BORDER}`,
        boxShadow: isDragOverlay ? '0 12px 40px rgba(27,53,87,0.18)' : hovered ? SH_MD : SH_SM,
        cursor: isDragOverlay ? 'grabbing' : 'pointer',
        transform: isDragOverlay ? 'rotate(1.5deg) scale(1.02)' : hovered ? 'translateY(-2px)' : 'translateY(0)',
        transition: isDragOverlay ? 'none' : 'all 0.15s ease',
        position: 'relative', overflow: 'hidden',
        borderLeft: `3px solid ${card.priorityFlag ? '#F59E0B' : accent}`,
      }}>

      {/* Header row */}
      <div style={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', gap: 6, marginBottom: 8 }}>
        <div style={{ fontSize: 13, fontWeight: 700, color: T1, lineHeight: 1.4, flex: 1 }}>{card.title}</div>
        <StarBtn active={card.priorityFlag} onToggle={() => onTogglePriority(card.id)} />
      </div>

      {/* Tags */}
      {card.tags?.length > 0 && (
        <div style={{ display: 'flex', flexWrap: 'wrap', gap: 4, marginBottom: 8 }}>
          {card.tags.slice(0, 3).map(tag => <TagChip key={tag} tag={tag} />)}
          {card.tags.length > 3 && <span style={{ fontSize: 10, color: TM, alignSelf: 'center' }}>+{card.tags.length - 3}</span>}
        </div>
      )}

      {/* Task progress */}
      {tasks.length > 0 && <div style={{ marginBottom: 8 }}><Progress done={doneTasks} total={tasks.length} /></div>}

      {/* Footer */}
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
          {card.dueDate && (
            <span style={{ display: 'flex', alignItems: 'center', gap: 3, fontSize: 11, fontWeight: 600, color: overdue ? '#DC2626' : TM }}>
              <ICalendar s={11} />
              {formatDate(card.dueDate)}
            </span>
          )}
          {commentCount > 0 && (
            <span style={{ display: 'flex', alignItems: 'center', gap: 3, fontSize: 11, color: TM }}>
              <IComment s={11} />{commentCount}
            </span>
          )}
        </div>
        {card.assigneeId && <Avatar userId={card.assigneeId} size={22} />}
      </div>
    </div>
  )
}

// ── Sortable card wrapper ─────────────────────────────────────────────────────
function SortableCard({ card, tasks, accent, onOpen, onTogglePriority }) {
  const { attributes, listeners, setNodeRef, transform, transition, isDragging } = useSortable({
    id: card.id, data: { type: 'card', card }
  })
  const style = {
    transform: CSS.Transform.toString(transform),
    transition: transition ? `${transition}, box-shadow 0.15s, opacity 0.15s` : 'box-shadow 0.15s, opacity 0.15s',
    opacity: isDragging ? 0.3 : 1,
    borderRadius: 10,
    border: isDragging ? `2px dashed ${accent}` : '2px solid transparent',
    background: isDragging ? `${accent}11` : 'transparent',
    cursor: isDragging ? 'grabbing' : 'grab',
    willChange: 'transform',
  }

  return (
    <div ref={setNodeRef} {...attributes} {...listeners} style={style}>
      <ProjectCard card={card} tasks={tasks} accent={accent} onOpen={onOpen} onTogglePriority={onTogglePriority} />
    </div>
  )
}

// ── Add card inline form ──────────────────────────────────────────────────────
function AddCardForm({ onAdd, onCancel, accent }) {
  const [title, setTitle] = useState('')
  const ref = useRef(null)
  const today = new Date().toISOString().slice(0, 10)

  function submit() {
    const t = title.trim()
    if (!t) return onCancel()
    onAdd(t, today)
    setTitle('')
  }

  return (
    <div style={{ padding: '2px 0' }}>
      <textarea
        ref={ref} autoFocus value={title} onChange={e => setTitle(e.target.value)}
        onKeyDown={e => { if (e.key === 'Enter' && !e.shiftKey) { e.preventDefault(); submit() } if (e.key === 'Escape') onCancel() }}
        placeholder="Card title..."
        style={{
          width: '100%', padding: '10px 12px', borderRadius: 8, border: `1.5px solid ${accent}`,
          fontSize: 13, color: T1, background: WHITE, resize: 'none', outline: 'none',
          fontFamily: 'inherit', lineHeight: 1.5, minHeight: 60, boxSizing: 'border-box',
        }}
      />
      <div style={{ display: 'flex', gap: 6, marginTop: 6 }}>
        <button onClick={submit} style={{ flex: 1, padding: '7px 0', borderRadius: 7, border: 'none', background: accent, color: WHITE, fontSize: 12, fontWeight: 700, cursor: 'pointer' }}>Add card</button>
        <button onClick={onCancel} style={{ padding: '7px 12px', borderRadius: 7, border: `1.5px solid ${BORDER}`, background: WHITE, fontSize: 12, fontWeight: 600, color: T2, cursor: 'pointer' }}><IX s={13} /></button>
      </div>
    </div>
  )
}

// ── Column menu ───────────────────────────────────────────────────────────────
function ColMenu({ col, onRename, onDelete, onClose }) {
  const [renaming, setRenaming] = useState(false)
  const [title, setTitle] = useState(col.title)
  const ref = useRef(null)

  if (renaming) return (
    <div style={{ position: 'absolute', top: 36, right: 0, zIndex: 100, background: WHITE, border: `1px solid ${BORDER}`, borderRadius: 10, padding: 12, boxShadow: SH_MD, width: 200 }}>
      <input autoFocus value={title} onChange={e => setTitle(e.target.value)}
        onKeyDown={e => { if (e.key === 'Enter') { onRename(title.trim()); onClose() } if (e.key === 'Escape') { setRenaming(false) } }}
        style={{ width: '100%', padding: '7px 10px', borderRadius: 7, border: `1.5px solid ${BORDER}`, fontSize: 13, outline: 'none', fontFamily: 'inherit', boxSizing: 'border-box' }}
      />
      <button onClick={() => { onRename(title.trim()); onClose() }} style={{ marginTop: 8, width: '100%', padding: '7px 0', borderRadius: 7, border: 'none', background: NAVY, color: WHITE, fontSize: 12, fontWeight: 700, cursor: 'pointer' }}>Rename</button>
    </div>
  )

  return (
    <div style={{ position: 'absolute', top: 36, right: 0, zIndex: 100, background: WHITE, border: `1px solid ${BORDER}`, borderRadius: 10, padding: 6, boxShadow: SH_MD, minWidth: 160 }}>
      {[
        { label: 'Rename column', Icon: IPen, action: () => setRenaming(true) },
        { label: 'Delete column', Icon: ITrash, action: () => { onDelete(); onClose() }, danger: true },
      ].map(({ label, Icon, action, danger }) => (
        <button key={label} onClick={action} style={{ display: 'flex', alignItems: 'center', gap: 8, width: '100%', padding: '8px 10px', border: 'none', background: 'none', borderRadius: 7, cursor: 'pointer', fontSize: 13, fontWeight: 500, color: danger ? '#DC2626' : T2, textAlign: 'left' }}>
          <Icon s={13} />{label}
        </button>
      ))}
    </div>
  )
}

// ── Droppable column ──────────────────────────────────────────────────────────
function Column({ col, cards, tasks, onOpen, onTogglePriority, onAddCard, onRename, onDelete, onUpdateColumn }) {
  const [addingCard, setAddingCard] = useState(false)
  const [collapsed, setCollapsed] = useState(false)
  const [menuOpen, setMenuOpen] = useState(false)
  const [hover, setHover] = useState(false)

  const { setNodeRef, isOver } = useDroppable({ id: col.id })

  return (
    <div
      ref={setNodeRef}
      onMouseEnter={() => setHover(true)}
      onMouseLeave={() => setHover(false)}
      style={{
        width: 290, flexShrink: 0, display: 'flex', flexDirection: 'column',
        background: isOver ? '#F0F4FF' : '#F5F4F2',
        borderRadius: 12, border: `1.5px solid ${isOver ? col.accent + '60' : BORDER}`,
        transition: 'border-color 0.15s, background 0.15s',
        maxHeight: '100%',
      }}>

      {/* Column header */}
      <div style={{ padding: '12px 14px 10px', display: 'flex', alignItems: 'center', gap: 6, position: 'relative' }}>
        <div style={{ width: 9, height: 9, borderRadius: '50%', background: col.accent, flexShrink: 0 }} />
        <span style={{ fontSize: 13, fontWeight: 700, color: T1, flex: 1 }}>{col.title}</span>
        <span style={{ fontSize: 11, fontWeight: 700, color: TM, background: WHITE, borderRadius: 20, padding: '1px 7px', border: `1px solid ${BORDER}` }}>{cards.length}</span>
        <button onClick={e => { e.stopPropagation(); setMenuOpen(o => !o) }} style={{ border: 'none', background: 'none', cursor: 'pointer', color: TM, padding: 2, opacity: hover ? 1 : 0, transition: 'opacity 0.12s' }}>
          <IDotsH s={14} />
        </button>
        <button onClick={() => setCollapsed(c => !c)} style={{ border: 'none', background: 'none', cursor: 'pointer', color: TM, padding: 2, transform: collapsed ? 'rotate(-90deg)' : 'rotate(0)', transition: 'transform 0.2s' }}>
          <IChevD s={13} />
        </button>
        {menuOpen && (
          <>
            <div style={{ position: 'fixed', inset: 0, zIndex: 99 }} onClick={() => setMenuOpen(false)} />
            <ColMenu col={col} onRename={(t) => onRename(col.id, t)} onDelete={() => onDelete(col.id)} onClose={() => setMenuOpen(false)} />
          </>
        )}
      </div>

      {/* Cards area */}
      {!collapsed && (
        <div style={{ flex: 1, overflowY: 'auto', padding: '0 10px', minHeight: 40 }}>
          <SortableContext items={cards.map(c => c.id)} strategy={verticalListSortingStrategy}>
            <div style={{ display: 'flex', flexDirection: 'column', gap: 8, paddingBottom: 8 }}>
              {cards.map(card => (
                <SortableCard
                  key={card.id}
                  card={card}
                  tasks={tasks.filter(t => t.projectId === card.id)}
                  accent={col.accent}
                  onOpen={onOpen}
                  onTogglePriority={onTogglePriority}
                />
              ))}
            </div>
          </SortableContext>

          {addingCard
            ? <AddCardForm accent={col.accent} onAdd={(t, d) => { onAddCard(col.id, t, d); setAddingCard(false) }} onCancel={() => setAddingCard(false)} />
            : null
          }
        </div>
      )}

      {/* Add card button */}
      {!collapsed && (
        <div style={{ padding: '8px 10px 12px' }}>
          {!addingCard && (
            <button
              onClick={() => setAddingCard(true)}
              style={{ width: '100%', display: 'flex', alignItems: 'center', gap: 6, padding: '7px 10px', border: `1.5px dashed ${BORDER}`, borderRadius: 8, background: 'transparent', cursor: 'pointer', color: TM, fontSize: 12, fontWeight: 600, transition: 'all 0.12s' }}
              onMouseEnter={e => { e.currentTarget.style.borderColor = col.accent; e.currentTarget.style.color = col.accent; e.currentTarget.style.background = col.accent + '0A' }}
              onMouseLeave={e => { e.currentTarget.style.borderColor = BORDER; e.currentTarget.style.color = TM; e.currentTarget.style.background = 'transparent' }}
            >
              <IPlus s={13} /> Add card
            </button>
          )}
        </div>
      )}
    </div>
  )
}

// ── Add column form ───────────────────────────────────────────────────────────
function AddColumnBtn({ onAdd }) {
  const [adding, setAdding] = useState(false)
  const [title, setTitle] = useState('')

  function submit() {
    const t = title.trim()
    if (t) onAdd(t)
    setTitle(''); setAdding(false)
  }

  if (!adding) return (
    <button onClick={() => setAdding(true)} style={{
      width: 200, flexShrink: 0, height: 48, display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 7,
      border: `2px dashed ${BORDER2}`, borderRadius: 12, background: 'transparent', cursor: 'pointer', color: TM, fontSize: 13, fontWeight: 600, transition: 'all 0.15s', alignSelf: 'flex-start',
    }}
      onMouseEnter={e => { e.currentTarget.style.borderColor = NAVY; e.currentTarget.style.color = NAVY; e.currentTarget.style.background = NAVY_BG }}
      onMouseLeave={e => { e.currentTarget.style.borderColor = BORDER2; e.currentTarget.style.color = TM; e.currentTarget.style.background = 'transparent' }}
    >
      <IPlus s={14} /> Add column
    </button>
  )

  return (
    <div style={{ width: 200, flexShrink: 0, background: '#F5F4F2', borderRadius: 12, border: `1.5px solid ${BORDER}`, padding: 12, alignSelf: 'flex-start' }}>
      <input autoFocus value={title} onChange={e => setTitle(e.target.value)} placeholder="Column name..."
        onKeyDown={e => { if (e.key === 'Enter') submit(); if (e.key === 'Escape') setAdding(false) }}
        style={{ width: '100%', padding: '8px 10px', borderRadius: 7, border: `1.5px solid ${BORDER}`, fontSize: 13, outline: 'none', fontFamily: 'inherit', boxSizing: 'border-box' }}
      />
      <div style={{ display: 'flex', gap: 6, marginTop: 8 }}>
        <button onClick={submit} style={{ flex: 1, padding: '7px 0', borderRadius: 7, border: 'none', background: NAVY, color: WHITE, fontSize: 12, fontWeight: 700, cursor: 'pointer' }}>Add</button>
        <button onClick={() => setAdding(false)} style={{ padding: '7px 10px', borderRadius: 7, border: `1.5px solid ${BORDER}`, background: WHITE, fontSize: 12, cursor: 'pointer', color: T2 }}><IX s={13} /></button>
      </div>
    </div>
  )
}

// ── Filter bar ────────────────────────────────────────────────────────────────
function FilterBar({ filters, setFilters, allTags }) {
  const [tagOpen, setTagOpen] = useState(false)

  return (
    <div style={{ display: 'flex', alignItems: 'center', gap: 8, flexWrap: 'nowrap' }}>
      {/* Priority filter */}
      <button
        onClick={() => setFilters(f => ({ ...f, priority: !f.priority }))}
        style={{
          display: 'flex', alignItems: 'center', gap: 5, padding: '6px 11px', borderRadius: 20,
          border: `1.5px solid ${filters.priority ? '#F59E0B' : BORDER}`,
          background: filters.priority ? '#FFFBEB' : WHITE, cursor: 'pointer',
          fontSize: 12, fontWeight: 600, color: filters.priority ? '#78350F' : TM, transition: 'all 0.12s',
        }}>
        <IStar s={12} filled={filters.priority} /> Priority
      </button>

      {/* Overdue filter */}
      <button
        onClick={() => setFilters(f => ({ ...f, overdue: !f.overdue }))}
        style={{
          display: 'flex', alignItems: 'center', gap: 5, padding: '6px 11px', borderRadius: 20,
          border: `1.5px solid ${filters.overdue ? '#DC2626' : BORDER}`,
          background: filters.overdue ? '#FEF2F2' : WHITE, cursor: 'pointer',
          fontSize: 12, fontWeight: 600, color: filters.overdue ? '#7F1D1D' : TM, transition: 'all 0.12s',
        }}>
        <ICalendar s={12} /> Overdue
      </button>

      {/* Assignee filter */}
      <div style={{ display: 'flex', gap: 4 }}>
        {USERS.map(u => (
          <button key={u.id}
            onClick={() => setFilters(f => ({ ...f, assignee: f.assignee === u.id ? null : u.id }))}
            title={u.name}
            style={{
              width: 26, height: 26, borderRadius: '50%', border: `2px solid ${filters.assignee === u.id ? u.color : BORDER}`,
              background: u.color, color: WHITE, fontSize: 10, fontWeight: 700, cursor: 'pointer',
              display: 'flex', alignItems: 'center', justifyContent: 'center',
              transform: filters.assignee === u.id ? 'scale(1.1)' : 'scale(1)', transition: 'all 0.12s',
            }}>
            {initials(u.name)}
          </button>
        ))}
      </div>

      {/* Clear */}
      {(filters.priority || filters.overdue || filters.assignee) && (
        <button onClick={() => setFilters({ priority: false, overdue: false, assignee: null })}
          style={{ display: 'flex', alignItems: 'center', gap: 4, padding: '5px 10px', borderRadius: 20, border: `1.5px solid ${BORDER}`, background: WHITE, cursor: 'pointer', fontSize: 11, fontWeight: 600, color: TM }}>
          <IX s={11} /> Clear
        </button>
      )}
    </div>
  )
}

// ── Completed section ─────────────────────────────────────────────────────────
function CompletedSection({ cards, columns, tasks, onRestore, onDelete, onOpen }) {
  const [open, setOpen] = useState(false)

  return (
    <div style={{ margin: '0 24px 24px', borderRadius: 12, border: `1.5px solid #D1FAE5`, background: '#F0FDF4', overflow: 'hidden', flexShrink: 0 }}>
      {/* Toggle header */}
      <button
        onClick={() => setOpen(o => !o)}
        style={{ width: '100%', display: 'flex', alignItems: 'center', gap: 10, padding: '12px 18px', border: 'none', background: 'transparent', cursor: 'pointer', textAlign: 'left' }}
      >
        <div style={{ width: 22, height: 22, borderRadius: '50%', background: '#10B981', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
          <ICheck s={12} style={{ color: WHITE }} />
        </div>
        <span style={{ fontSize: 13, fontWeight: 800, color: '#065F46' }}>Completed</span>
        <span style={{ fontSize: 11, fontWeight: 700, color: '#10B981', background: '#D1FAE5', padding: '2px 8px', borderRadius: 20 }}>{cards.length}</span>
        <div style={{ marginLeft: 'auto', color: '#10B981', transition: 'transform 0.2s', transform: open ? 'rotate(180deg)' : 'none' }}>
          <IChevD s={14} />
        </div>
      </button>

      {open && (
        <div style={{ borderTop: `1px solid #D1FAE5`, padding: '14px 18px', display: 'flex', flexDirection: 'column', gap: 6 }}>
          {cards.map(card => {
            const col = columns.find(c => c.id === card.columnId)
            const cardTasks = tasks.filter(t => t.projectId === card.id)
            const done = cardTasks.filter(t => t.status === 'done').length
            return (
              <div
                key={card.id}
                style={{ display: 'flex', alignItems: 'center', gap: 10, padding: '10px 14px', borderRadius: 9, background: WHITE, border: `1px solid #D1FAE5`, cursor: 'pointer' }}
                onClick={() => onOpen(card.id)}
              >
                <div style={{ width: 18, height: 18, borderRadius: '50%', background: '#10B981', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
                  <ICheck s={10} style={{ color: WHITE }} />
                </div>
                <div style={{ flex: 1, minWidth: 0 }}>
                  <div style={{ fontSize: 13, fontWeight: 700, color: TM, textDecoration: 'line-through', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{card.title}</div>
                  <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginTop: 2 }}>
                    {col && <span style={{ fontSize: 10, color: TL, fontWeight: 600, textTransform: 'uppercase', letterSpacing: '0.3px' }}>{col.title}</span>}
                    {cardTasks.length > 0 && <span style={{ fontSize: 10, color: TL }}>{done}/{cardTasks.length} subtasks</span>}
                    {card.doneAt && <span style={{ fontSize: 10, color: TL }}>Done {formatDate(card.doneAt)}</span>}
                  </div>
                </div>
                {card.tags?.slice(0, 2).map(tag => {
                  const c = tagColor(tag)
                  return <span key={tag} style={{ fontSize: 10, fontWeight: 700, padding: '2px 7px', borderRadius: 20, background: c.bg, color: c.text }}>{tag}</span>
                })}
                <div style={{ display: 'flex', gap: 4, flexShrink: 0 }} onClick={e => e.stopPropagation()}>
                  <button
                    onClick={() => onRestore(card.id, { done: false, doneAt: null })}
                    title="Restore to board"
                    style={{ fontSize: 10, fontWeight: 700, padding: '4px 9px', borderRadius: 6, border: `1px solid ${BORDER}`, background: WHITE, color: TM, cursor: 'pointer' }}
                  >
                    Restore
                  </button>
                  <button
                    onClick={() => { if (window.confirm(`Permanently delete "${card.title}"?`)) onDelete(card.id) }}
                    style={{ width: 26, height: 26, borderRadius: 6, border: `1px solid #FECACA`, background: '#FEF2F2', cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#DC2626' }}
                  >
                    <ITrash s={12} />
                  </button>
                </div>
              </div>
            )
          })}
        </div>
      )}
    </div>
  )
}

// ── Dashboard ─────────────────────────────────────────────────────────────────
function SharedSection({ shares, cards, tasks, currentUser, openCard }) {
  const myShares = (shares || []).filter(s => s.user_id === currentUser?.id)
  if (myShares.length === 0) return null

  const sharedCards = myShares
    .map(s => {
      const card = cards.find(c => c.id === s.card_id)
      if (!card) return null
      const sharedByUser = USERS.find(u => u.id === s.shared_by)
      return card ? { ...card, sharedByUser } : null
    })
    .filter(Boolean)

  if (sharedCards.length === 0) return null

  return (
    <div style={{ margin: '0 24px 24px', borderRadius: 12, border: `1.5px solid #C7D7F5`, background: '#EEF3FF', overflow: 'hidden', flexShrink: 0 }}>
      <div style={{ padding: '12px 18px', display: 'flex', alignItems: 'center', gap: 10, borderBottom: `1px solid #C7D7F5` }}>
        <div style={{ width: 22, height: 22, borderRadius: '50%', background: NAVY, display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
          <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="white" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><circle cx="18" cy="5" r="3"/><circle cx="6" cy="12" r="3"/><circle cx="18" cy="19" r="3"/><line x1="8.59" y1="13.51" x2="15.42" y2="17.49"/><line x1="15.41" y1="6.51" x2="8.59" y2="10.49"/></svg>
        </div>
        <span style={{ fontSize: 13, fontWeight: 800, color: NAVY }}>Shared with me</span>
        <span style={{ fontSize: 11, fontWeight: 700, color: '#1B3557', background: '#C7D7F5', padding: '2px 8px', borderRadius: 20 }}>{sharedCards.length}</span>
      </div>
      <div style={{ padding: '12px 18px', display: 'flex', gap: 12, overflowX: 'auto', flexWrap: 'wrap' }}>
        {sharedCards.map(card => {
          const cardTasks = (tasks || []).filter(t => t.projectId === card.id)
          const done = cardTasks.filter(t => t.status === 'done').length
          return (
            <div
              key={card.id}
              onClick={() => openCard(card.id)}
              style={{ background: WHITE, borderRadius: 10, padding: '12px 14px', border: `1px solid #C7D7F5`, cursor: 'pointer', minWidth: 200, maxWidth: 260, flex: '0 0 auto', transition: 'box-shadow 0.15s', boxShadow: SH_SM }}
              onMouseEnter={e => e.currentTarget.style.boxShadow = SH_MD}
              onMouseLeave={e => e.currentTarget.style.boxShadow = SH_SM}
            >
              <div style={{ fontSize: 13, fontWeight: 700, color: T1, marginBottom: 8, lineHeight: 1.4 }}>{card.title}</div>
              {cardTasks.length > 0 && (
                <div style={{ display: 'flex', alignItems: 'center', gap: 6, marginBottom: 8 }}>
                  <div style={{ flex: 1, height: 3, background: '#E0E7FF', borderRadius: 2, overflow: 'hidden' }}>
                    <div style={{ width: `${Math.round((done / cardTasks.length) * 100)}%`, height: '100%', background: NAVY, borderRadius: 2 }} />
                  </div>
                  <span style={{ fontSize: 10, color: TM }}>{done}/{cardTasks.length}</span>
                </div>
              )}
              <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
                <div style={{ width: 18, height: 18, borderRadius: '50%', background: card.sharedByUser?.color || NAVY, display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 7, fontWeight: 700, color: WHITE }}>
                  {initials(card.sharedByUser?.name || '?')}
                </div>
                <span style={{ fontSize: 11, color: TM }}>from {card.sharedByUser?.name?.split(' ')[0] || 'someone'}</span>
              </div>
            </div>
          )
        })}
      </div>
    </div>
  )
}

export default function Dashboard({ state, setState, updateCard, addCard, addColumn, deleteCard, openCard, persistCards, currentUser, isManager }) {
  const [activeItem, setActiveItem] = useState(null)
  const [filters, setFilters] = useState({ priority: false, overdue: false, assignee: null })

  const sensors = useSensors(
    useSensor(PointerSensor, { activationConstraint: { distance: 5 } }),
    useSensor(KeyboardSensor, { coordinateGetter: sortableKeyboardCoordinates })
  )

  const sortedCols = [...state.columns].sort((a, b) => a.position - b.position)

  // Members only see their own cards
  const visibleCards = isManager
    ? state.cards
    : state.cards.filter(c => c.assigneeId === currentUser?.id)

  function getColCards(colId) {
    return [...visibleCards]
      .filter(c => c.columnId === colId && !c.archivedAt && !c.done)
      .filter(c => !filters.priority || c.priorityFlag)
      .filter(c => !filters.overdue || isOverdue(c.dueDate))
      .filter(c => !filters.assignee || c.assigneeId === filters.assignee)
      .sort((a, b) => a.position - b.position)
  }

  const doneCards = [...visibleCards].filter(c => c.done && !c.archivedAt).sort((a, b) => new Date(b.doneAt || b.updatedAt) - new Date(a.doneAt || a.updatedAt))

  function onTogglePriority(cardId) {
    updateCard(cardId, { priorityFlag: !state.cards.find(c => c.id === cardId)?.priorityFlag })
  }

  function onRenameColumn(colId, title) {
    setState(s => {
      const columns = s.columns.map(c => c.id === colId ? { ...c, title } : c)
      const col = columns.find(c => c.id === colId)
      if (col) fetch('/api/columns', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(col) }).catch(() => {})
      return { ...s, columns }
    })
  }

  function onDeleteColumn(colId) {
    const hasCards = state.cards.some(c => c.columnId === colId && !c.archivedAt)
    if (hasCards) { alert('Move or archive all cards first.'); return }
    setState(s => ({ ...s, columns: s.columns.filter(c => c.id !== colId) }))
  }

  function handleDragStart({ active }) {
    const card = state.cards.find(c => c.id === active.id)
    if (card) { setActiveItem({ type: 'card', data: card }); return }
  }

  function handleDragEnd({ active, over }) {
    setActiveItem(null)
    if (!over || active.id === over.id) return

    const isCard = (id) => state.cards.some(c => c.id === id)
    const isCol  = (id) => state.columns.some(c => c.id === id)

    // Card moved
    if (!isCard(active.id)) return
    const dragged = state.cards.find(c => c.id === active.id)
    if (!dragged) return

    // Dropped on a column
    if (isCol(over.id)) {
      updateCard(active.id, { columnId: over.id, position: Date.now() })
      return
    }

    // Dropped on another card
    if (isCard(over.id)) {
      const overCard = state.cards.find(c => c.id === over.id)
      if (!overCard) return
      if (overCard.columnId !== dragged.columnId) {
        // Different column: move there
        updateCard(active.id, { columnId: overCard.columnId, position: overCard.position - 0.5 })
      } else {
        // Same column: reorder
        const colCards = state.cards.filter(c => c.columnId === dragged.columnId && !c.archivedAt).sort((a, b) => a.position - b.position)
        const from = colCards.findIndex(c => c.id === active.id)
        const to   = colCards.findIndex(c => c.id === over.id)
        const reordered = arrayMove(colCards, from, to)
        setState(s => {
          const cards = s.cards.map(c => {
            const idx = reordered.findIndex(r => r.id === c.id)
            return idx >= 0 ? { ...c, position: idx * 1000 } : c
          })
          persistCards?.(cards.filter(c => reordered.some(r => r.id === c.id)))
          return { ...s, cards }
        })
      }
    }
  }

  const allTags = [...new Set(state.cards.flatMap(c => c.tags || []))]
  const activeCard = activeItem?.type === 'card' ? activeItem.data : null
  const activeCardCol = activeCard ? state.columns.find(c => c.id === activeCard.columnId) : null

  return (
    <div style={{ display: 'flex', flexDirection: 'column', height: '100%', overflow: 'hidden' }}>
      {/* Top bar */}
      <div style={{ padding: '16px 24px 12px', display: 'flex', alignItems: 'center', gap: 12, borderBottom: `1px solid ${BORDER}`, background: WHITE, flexShrink: 0 }}>
        <div style={{ flex: 1 }}>
          <div style={{ fontSize: 17, fontWeight: 800, color: T1, letterSpacing: '-0.3px' }}>Dashboard</div>
          <div style={{ fontSize: 12, color: TM, marginTop: 1 }}>
            {visibleCards.filter(c => !c.archivedAt && !c.done).length} active · {doneCards.length} completed
          </div>
        </div>
        <FilterBar filters={filters} setFilters={setFilters} allTags={allTags} />
      </div>

      {/* Board + Completed — scrollable vertically */}
      <div style={{ flex: 1, overflowY: 'auto', overflowX: 'hidden', display: 'flex', flexDirection: 'column' }}>

        {/* Kanban board — horizontal scroll within this row */}
        <div style={{ overflowX: 'auto', overflowY: 'hidden', padding: '20px 24px 0', flexShrink: 0 }}>
          <DndContext sensors={sensors} collisionDetection={closestCorners} onDragStart={handleDragStart} onDragEnd={handleDragEnd}>
            <div style={{ display: 'flex', gap: 14, alignItems: 'flex-start', paddingBottom: 20 }}>
                {sortedCols.map(col => (
                  <Column
                    key={col.id}
                    col={col}
                    cards={getColCards(col.id)}
                    tasks={state.tasks || []}
                    onOpen={openCard}
                    onTogglePriority={onTogglePriority}
                    onAddCard={(colId, title, dueDate) => addCard(colId, title, dueDate)}
                    onRename={onRenameColumn}
                    onDelete={onDeleteColumn}
                    onUpdateColumn={(id, updates) => setState(s => ({ ...s, columns: s.columns.map(c => c.id === id ? { ...c, ...updates } : c) }))}
                  />
                ))}
                <AddColumnBtn onAdd={addColumn} />
              </div>

            <DragOverlay dropAnimation={{ duration: 180, easing: 'cubic-bezier(0.22,1,0.36,1)' }}>
              {activeCard && (
                <div style={{ transform: 'rotate(2deg) scale(1.03)', boxShadow: '0 16px 48px rgba(27,53,87,0.22)', borderRadius: 10 }}>
                  <ProjectCard
                    card={activeCard}
                    tasks={(state.tasks || []).filter(t => t.projectId === activeCard.id)}
                    accent={activeCardCol?.accent || NAVY}
                    onOpen={() => {}}
                    onTogglePriority={() => {}}
                    isDragOverlay
                  />
                </div>
              )}
            </DragOverlay>
          </DndContext>
        </div>

        {/* Completed section */}
        {doneCards.length > 0 && <CompletedSection cards={doneCards} columns={state.columns} tasks={state.tasks || []} onRestore={updateCard} onDelete={deleteCard} onOpen={openCard} />}

        {/* Shared with me */}
        <SharedSection shares={state.shares} cards={state.cards} tasks={state.tasks || []} currentUser={currentUser} openCard={openCard} />
      </div>

    </div>
  )
}
