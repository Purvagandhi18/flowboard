import { useState } from 'react'
import { NAVY, WHITE, BORDER, T1, T2, TM, TL, SH_SM, SH_MD, uid, now, formatDate } from './tokens.jsx'
import { IBell, IPlus, ITrash, IPen, IX, ICheck, ISlack, IRepeat, ICalendar, IClock, ISnooze } from './tokens.jsx'

const DAYS = ['Su', 'Mo', 'Tu', 'We', 'Th', 'Fr', 'Sa']
const DAY_NAMES = ['Sunday', 'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday']

function StatusBadge({ status }) {
  const map = {
    active:    { bg: '#DCFCE7', text: '#166534', dot: '#22C55E', label: 'Active' },
    paused:    { bg: '#F3F4F6', text: '#6B7280', dot: '#9CA3AF', label: 'Paused' },
    snoozed:   { bg: '#FEF3C7', text: '#92400E', dot: '#F59E0B', label: 'Snoozed' },
    done:      { bg: '#EFF6FF', text: '#1D4ED8', dot: '#3B82F6', label: 'Done'   },
    dismissed: { bg: '#FEF2F2', text: '#991B1B', dot: '#EF4444', label: 'Dismissed' },
  }
  const s = map[status] || map.active
  return (
    <span style={{ display: 'inline-flex', alignItems: 'center', gap: 4, fontSize: 11, fontWeight: 700, padding: '3px 8px', borderRadius: 20, background: s.bg, color: s.text }}>
      <div style={{ width: 5, height: 5, borderRadius: '50%', background: s.dot }} />{s.label}
    </span>
  )
}

function ReminderCard({ reminder, onEdit, onDelete, onToggle }) {
  const [hover, setHover] = useState(false)

  function scheduleLabel(r) {
    if (r.scheduleType === 'one_time') {
      return r.triggerDate ? `${formatDate(r.triggerDate)} at ${r.triggerTime}` : `at ${r.triggerTime}`
    }
    if (r.rrulePreset === 'daily') return `Every day at ${r.triggerTime}`
    if (r.rrulePreset === 'weekly') {
      const days = (r.daysOfWeek || []).map(d => DAY_NAMES[d]).join(', ')
      return `Every ${days} at ${r.triggerTime}`
    }
    if (r.rrulePreset === 'monthly') return `Monthly on day ${r.dayOfMonth} at ${r.triggerTime}`
    return r.triggerTime
  }

  return (
    <div onMouseEnter={() => setHover(true)} onMouseLeave={() => setHover(false)}
      style={{
        background: WHITE, borderRadius: 10, padding: '14px 16px', border: `1px solid ${BORDER}`,
        boxShadow: hover ? SH_SM : 'none', transition: 'all 0.13s',
        borderLeft: `3px solid ${reminder.status === 'active' ? '#22C55E' : reminder.status === 'paused' ? '#9CA3AF' : '#F59E0B'}`,
        display: 'flex', alignItems: 'flex-start', gap: 12,
      }}>
      {/* Icon */}
      <div style={{ width: 36, height: 36, borderRadius: 9, background: '#FEF3C7', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
        {reminder.scheduleType === 'recurring' ? <IRepeat s={16} style={{ color: '#D97706' }} /> : <IBell s={16} style={{ color: '#D97706' }} />}
      </div>

      <div style={{ flex: 1, minWidth: 0 }}>
        <div style={{ display: 'flex', alignItems: 'flex-start', gap: 8, marginBottom: 4 }}>
          <div style={{ fontSize: 14, fontWeight: 700, color: T1, flex: 1, lineHeight: 1.3 }}>{reminder.title}</div>
          <StatusBadge status={reminder.status} />
        </div>
        {reminder.description && (
          <div style={{ fontSize: 12, color: T2, lineHeight: 1.5, marginBottom: 6 }}>{reminder.description}</div>
        )}
        <div style={{ display: 'flex', alignItems: 'center', gap: 12, flexWrap: 'wrap' }}>
          <span style={{ fontSize: 11, color: TM, display: 'flex', alignItems: 'center', gap: 4 }}>
            <IClock s={11} />{scheduleLabel(reminder)}
          </span>
          {reminder.slackEnabled && (
            <span style={{ fontSize: 11, color: '#4338CA', display: 'flex', alignItems: 'center', gap: 3, fontWeight: 600 }}>
              <ISlack s={11} /> Slack
            </span>
          )}
          {reminder.scheduleType === 'recurring' && (
            <span style={{ fontSize: 11, color: TM, display: 'flex', alignItems: 'center', gap: 3 }}>
              <IRepeat s={11} /> Recurring
            </span>
          )}
        </div>
      </div>

      {/* Actions */}
      {hover && (
        <div style={{ display: 'flex', gap: 4, flexShrink: 0 }}>
          <button onClick={() => onToggle(reminder)} title={reminder.status === 'active' ? 'Pause' : 'Activate'}
            style={{ width: 28, height: 28, borderRadius: 7, border: `1px solid ${BORDER}`, background: WHITE, cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center', color: TM }}>
            {reminder.status === 'active' ? <ISnooze s={13} /> : <ICheck s={13} />}
          </button>
          <button onClick={() => onEdit(reminder)}
            style={{ width: 28, height: 28, borderRadius: 7, border: `1px solid ${BORDER}`, background: WHITE, cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center', color: TM }}>
            <IPen s={13} />
          </button>
          <button onClick={() => onDelete(reminder.id)}
            style={{ width: 28, height: 28, borderRadius: 7, border: `1px solid #FECACA`, background: '#FEF2F2', cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#DC2626' }}>
            <ITrash s={13} />
          </button>
        </div>
      )}
    </div>
  )
}

const EMPTY_FORM = {
  title: '', description: '', scheduleType: 'one_time',
  triggerDate: '', triggerTime: '09:00',
  rrulePreset: 'weekly', daysOfWeek: [1], dayOfMonth: 1,
  slackEnabled: false, status: 'active', entityId: null,
}

function ReminderForm({ initial, onSave, onCancel }) {
  const [form, setForm] = useState(initial || EMPTY_FORM)
  const f = (key, val) => setForm(s => ({ ...s, [key]: val }))

  function toggleDay(d) {
    const days = form.daysOfWeek || []
    f('daysOfWeek', days.includes(d) ? days.filter(x => x !== d) : [...days, d])
  }

  function submit() {
    if (!form.title.trim()) return
    onSave({ ...form, title: form.title.trim(), id: form.id || uid(), createdAt: form.createdAt || now() })
  }

  const inputStyle = { width: '100%', padding: '9px 12px', borderRadius: 8, border: `1.5px solid ${BORDER}`, fontSize: 13, outline: 'none', fontFamily: 'inherit', color: T1, boxSizing: 'border-box' }

  return (
    <div style={{ background: WHITE, borderRadius: 12, border: `1.5px solid ${NAVY}`, padding: '20px', boxShadow: SH_MD, display: 'flex', flexDirection: 'column', gap: 14 }}>
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
        <div style={{ fontSize: 14, fontWeight: 800, color: T1 }}>{initial?.id ? 'Edit reminder' : 'New reminder'}</div>
        <button onClick={onCancel} style={{ border: 'none', background: 'none', cursor: 'pointer', color: TM }}><IX s={16} /></button>
      </div>

      {/* Title */}
      <div>
        <label style={{ fontSize: 11, fontWeight: 700, color: TM, display: 'block', marginBottom: 5, textTransform: 'uppercase', letterSpacing: '0.4px' }}>Title *</label>
        <input value={form.title} onChange={e => f('title', e.target.value)} placeholder="What do you want to be reminded about?" style={inputStyle} />
      </div>

      {/* Description */}
      <div>
        <label style={{ fontSize: 11, fontWeight: 700, color: TM, display: 'block', marginBottom: 5, textTransform: 'uppercase', letterSpacing: '0.4px' }}>Notes</label>
        <textarea value={form.description} onChange={e => f('description', e.target.value)} placeholder="Optional notes..." rows={2}
          style={{ ...inputStyle, resize: 'vertical', lineHeight: 1.5 }} />
      </div>

      {/* Schedule type */}
      <div>
        <label style={{ fontSize: 11, fontWeight: 700, color: TM, display: 'block', marginBottom: 8, textTransform: 'uppercase', letterSpacing: '0.4px' }}>Schedule</label>
        <div style={{ display: 'flex', gap: 6 }}>
          {[{ id: 'one_time', label: 'One-time' }, { id: 'recurring', label: 'Recurring' }].map(opt => (
            <button key={opt.id} onClick={() => f('scheduleType', opt.id)}
              style={{ flex: 1, padding: '8px 0', borderRadius: 8, border: `1.5px solid ${form.scheduleType === opt.id ? NAVY : BORDER}`, background: form.scheduleType === opt.id ? '#EEF2F8' : WHITE, fontSize: 12, fontWeight: 700, color: form.scheduleType === opt.id ? NAVY : TM, cursor: 'pointer', transition: 'all 0.12s' }}>
              {opt.label}
            </button>
          ))}
        </div>
      </div>

      {/* One-time: date */}
      {form.scheduleType === 'one_time' && (
        <div>
          <label style={{ fontSize: 11, fontWeight: 700, color: TM, display: 'block', marginBottom: 5, textTransform: 'uppercase', letterSpacing: '0.4px' }}>Date</label>
          <input type="date" value={form.triggerDate} onChange={e => f('triggerDate', e.target.value)} style={inputStyle} />
        </div>
      )}

      {/* Recurring: preset */}
      {form.scheduleType === 'recurring' && (
        <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
          <div>
            <label style={{ fontSize: 11, fontWeight: 700, color: TM, display: 'block', marginBottom: 6, textTransform: 'uppercase', letterSpacing: '0.4px' }}>Frequency</label>
            <div style={{ display: 'flex', gap: 6 }}>
              {['daily', 'weekly', 'monthly'].map(p => (
                <button key={p} onClick={() => f('rrulePreset', p)}
                  style={{ flex: 1, padding: '7px 0', borderRadius: 7, border: `1.5px solid ${form.rrulePreset === p ? NAVY : BORDER}`, background: form.rrulePreset === p ? '#EEF2F8' : WHITE, fontSize: 12, fontWeight: 700, color: form.rrulePreset === p ? NAVY : TM, cursor: 'pointer', textTransform: 'capitalize', transition: 'all 0.12s' }}>
                  {p}
                </button>
              ))}
            </div>
          </div>

          {form.rrulePreset === 'weekly' && (
            <div>
              <label style={{ fontSize: 11, fontWeight: 700, color: TM, display: 'block', marginBottom: 6, textTransform: 'uppercase', letterSpacing: '0.4px' }}>Days</label>
              <div style={{ display: 'flex', gap: 5 }}>
                {DAYS.map((d, i) => (
                  <button key={i} onClick={() => toggleDay(i)}
                    style={{ width: 34, height: 34, borderRadius: '50%', border: `1.5px solid ${(form.daysOfWeek || []).includes(i) ? NAVY : BORDER}`, background: (form.daysOfWeek || []).includes(i) ? NAVY : WHITE, fontSize: 11, fontWeight: 700, color: (form.daysOfWeek || []).includes(i) ? WHITE : TM, cursor: 'pointer', transition: 'all 0.12s' }}>
                    {d}
                  </button>
                ))}
              </div>
            </div>
          )}

          {form.rrulePreset === 'monthly' && (
            <div>
              <label style={{ fontSize: 11, fontWeight: 700, color: TM, display: 'block', marginBottom: 5, textTransform: 'uppercase', letterSpacing: '0.4px' }}>Day of month</label>
              <input type="number" min={1} max={31} value={form.dayOfMonth} onChange={e => f('dayOfMonth', parseInt(e.target.value))} style={{ ...inputStyle, width: 80 }} />
            </div>
          )}
        </div>
      )}

      {/* Time */}
      <div>
        <label style={{ fontSize: 11, fontWeight: 700, color: TM, display: 'block', marginBottom: 5, textTransform: 'uppercase', letterSpacing: '0.4px' }}>Time</label>
        <input type="time" value={form.triggerTime} onChange={e => f('triggerTime', e.target.value)} style={{ ...inputStyle, width: 140 }} />
      </div>

      {/* Slack toggle */}
      <label style={{ display: 'flex', alignItems: 'center', gap: 10, cursor: 'pointer' }}>
        <div onClick={() => f('slackEnabled', !form.slackEnabled)}
          style={{ width: 38, height: 22, borderRadius: 11, background: form.slackEnabled ? NAVY : '#D1D5DB', position: 'relative', transition: 'background 0.2s', flexShrink: 0 }}>
          <div style={{ width: 18, height: 18, borderRadius: '50%', background: WHITE, position: 'absolute', top: 2, left: form.slackEnabled ? 18 : 2, transition: 'left 0.2s', boxShadow: '0 1px 3px rgba(0,0,0,0.2)' }} />
        </div>
        <span style={{ fontSize: 13, fontWeight: 600, color: T2, display: 'flex', alignItems: 'center', gap: 5 }}>
          <ISlack s={14} /> Send Slack notification
        </span>
      </label>

      {/* Actions */}
      <div style={{ display: 'flex', gap: 8, paddingTop: 4 }}>
        <button onClick={onCancel} style={{ flex: 1, padding: '9px 0', borderRadius: 8, border: `1.5px solid ${BORDER}`, background: WHITE, fontSize: 13, fontWeight: 600, color: T2, cursor: 'pointer' }}>Cancel</button>
        <button onClick={submit} style={{ flex: 2, padding: '9px 0', borderRadius: 8, border: 'none', background: NAVY, fontSize: 13, fontWeight: 700, color: WHITE, cursor: 'pointer' }}>
          {initial?.id ? 'Save changes' : 'Create reminder'}
        </button>
      </div>
    </div>
  )
}

export default function Reminders({ state, addReminder, updateReminder, deleteReminder }) {
  const [showForm, setShowForm] = useState(false)
  const [editingReminder, setEditingReminder] = useState(null)

  const reminders = state.reminders || []
  const oneTime = reminders.filter(r => r.scheduleType === 'one_time')
  const recurring = reminders.filter(r => r.scheduleType === 'recurring')

  function handleSave(data) {
    if (data.id && state.reminders.some(r => r.id === data.id)) {
      updateReminder(data.id, data)
    } else {
      addReminder(data)
    }
    setShowForm(false)
    setEditingReminder(null)
  }

  function handleEdit(reminder) {
    setEditingReminder(reminder)
    setShowForm(true)
  }

  function handleToggle(reminder) {
    updateReminder(reminder.id, { status: reminder.status === 'active' ? 'paused' : 'active' })
  }

  return (
    <div style={{ height: '100%', display: 'flex', flexDirection: 'column', background: '#F7F6F4' }}>
      {/* Header */}
      <div style={{ background: WHITE, borderBottom: `1px solid ${BORDER}`, padding: '18px 24px', flexShrink: 0 }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
          <div style={{ width: 36, height: 36, borderRadius: 9, background: '#FEF3C7', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
            <IBell s={18} style={{ color: '#D97706' }} />
          </div>
          <div>
            <div style={{ fontSize: 18, fontWeight: 800, color: T1, letterSpacing: '-0.3px' }}>Reminders</div>
            <div style={{ fontSize: 12, color: TM }}>{oneTime.length} one-time · {recurring.length} recurring</div>
          </div>
          <div style={{ flex: 1 }} />
          <button onClick={() => { setEditingReminder(null); setShowForm(s => !s) }}
            style={{ display: 'flex', alignItems: 'center', gap: 6, padding: '9px 16px', borderRadius: 8, border: 'none', background: NAVY, color: WHITE, fontSize: 13, fontWeight: 700, cursor: 'pointer' }}>
            {showForm && !editingReminder ? <IX s={13} /> : <IPlus s={13} />}
            {showForm && !editingReminder ? 'Cancel' : 'New reminder'}
          </button>
        </div>
      </div>

      {/* Content */}
      <div style={{ flex: 1, overflowY: 'auto', padding: '20px 24px' }}>
        {/* New reminder form (full width at top) */}
        {showForm && (
          <div style={{ maxWidth: 520, margin: '0 auto 20px' }}>
            <ReminderForm
              initial={editingReminder}
              onSave={handleSave}
              onCancel={() => { setShowForm(false); setEditingReminder(null) }}
            />
          </div>
        )}

        {reminders.length === 0 && !showForm ? (
          <div style={{ textAlign: 'center', padding: '64px 0', color: TL }}>
            <div style={{ fontSize: 36, marginBottom: 12, opacity: 0.5 }}>🔔</div>
            <div style={{ fontSize: 14, fontWeight: 600, color: T2, marginBottom: 6 }}>No reminders yet</div>
            <div style={{ fontSize: 13, color: TM }}>Create a reminder to stay on top of your tasks</div>
          </div>
        ) : (
          /* Two-column layout */
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 24, maxWidth: 1100, margin: '0 auto' }}>
            {/* One-time column */}
            <div>
              <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 14, paddingBottom: 10, borderBottom: `2px solid ${BORDER}` }}>
                <IBell s={15} style={{ color: '#D97706' }} />
                <span style={{ fontSize: 13, fontWeight: 800, color: T1 }}>One-time</span>
                <span style={{ fontSize: 11, fontWeight: 700, color: TL, background: '#F3F4F6', padding: '2px 7px', borderRadius: 20 }}>{oneTime.length}</span>
              </div>
              {oneTime.length === 0 ? (
                <div style={{ textAlign: 'center', padding: '32px 0', color: TL, fontSize: 12 }}>No one-time reminders</div>
              ) : (
                <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
                  {oneTime.map(r => (
                    <ReminderCard key={r.id} reminder={r} onEdit={handleEdit} onDelete={deleteReminder} onToggle={handleToggle} />
                  ))}
                </div>
              )}
            </div>

            {/* Recurring column */}
            <div>
              <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 14, paddingBottom: 10, borderBottom: `2px solid ${BORDER}` }}>
                <IRepeat s={15} style={{ color: '#2563EB' }} />
                <span style={{ fontSize: 13, fontWeight: 800, color: T1 }}>Recurring</span>
                <span style={{ fontSize: 11, fontWeight: 700, color: TL, background: '#F3F4F6', padding: '2px 7px', borderRadius: 20 }}>{recurring.length}</span>
              </div>
              {recurring.length === 0 ? (
                <div style={{ textAlign: 'center', padding: '32px 0', color: TL, fontSize: 12 }}>No recurring reminders</div>
              ) : (
                <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
                  {recurring.map(r => (
                    <ReminderCard key={r.id} reminder={r} onEdit={handleEdit} onDelete={deleteReminder} onToggle={handleToggle} />
                  ))}
                </div>
              )}
            </div>
          </div>
        )}
      </div>
    </div>
  )
}
