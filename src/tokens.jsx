// ── Design tokens (MindMatters-matched) ──────────────────────────────────────
export const NAVY    = '#1B3557'
export const NAVY_LT = '#2B4A7A'
export const NAVY_BG = '#EEF3FF'
export const CREAM   = '#FAF8F5'
export const WHITE   = '#FFFFFF'
export const BORDER  = '#E8E6E1'
export const BORDER2 = '#D1CEC8'
export const T1      = '#111827'
export const T2      = '#374151'
export const TM      = '#6B7280'
export const TL      = '#9CA3AF'

// Status colors
export const S_PICK  = { bg: '#F3F4F6', text: '#374151', dot: '#9CA3AF' }
export const S_PROC  = { bg: '#EFF6FF', text: '#1D4ED8', dot: '#3B82F6' }
export const S_HOLD  = { bg: '#FFFBEB', text: '#92400E', dot: '#F59E0B' }
export const S_DONE  = { bg: '#ECFDF5', text: '#065F46', dot: '#10B981' }

export const STATUS_MAP = {
  to_be_picked: { label: 'To Be Picked', ...S_PICK },
  in_process:   { label: 'In Process',   ...S_PROC },
  on_hold:      { label: 'On Hold',      ...S_HOLD },
  done:         { label: 'Done',         ...S_DONE },
}

// Tag palette (6 colors, cycling by hash)
export const TAG_PALETTE = [
  { bg: '#EEF3FF', text: '#1B3557', border: '#C7D7F5' },
  { bg: '#ECFDF5', text: '#065F46', border: '#A7F3D0' },
  { bg: '#FEF3C7', text: '#78350F', border: '#FCD34D' },
  { bg: '#FEE2E2', text: '#7F1D1D', border: '#FECACA' },
  { bg: '#EDE9FE', text: '#4C1D95', border: '#C4B5FD' },
  { bg: '#E0F2FE', text: '#0C4A6E', border: '#BAE6FD' },
]

export function tagColor(tag) {
  let h = 0
  for (let i = 0; i < tag.length; i++) h = (h * 31 + tag.charCodeAt(i)) & 0xffff
  return TAG_PALETTE[h % TAG_PALETTE.length]
}

// Column accent colors
export const COL_ACCENTS = ['#6B7280','#2563EB','#7C3AED','#D97706','#DC2626','#059669','#0891B2','#DB2777']

// Shadows
export const SH_SM = '0 1px 3px rgba(0,0,0,0.06), 0 1px 2px rgba(0,0,0,0.04)'
export const SH_MD = '0 4px 16px rgba(0,0,0,0.08)'
export const SH_LG = '0 8px 32px rgba(0,0,0,0.12)'
export const SH_XL = '0 20px 60px rgba(0,0,0,0.16)'

// ── SVG icon system ───────────────────────────────────────────────────────────
export function Svg({ size = 16, children, fill = 'none', style, ...rest }) {
  return (
    <svg width={size} height={size} viewBox="0 0 24 24" fill={fill}
         stroke="currentColor" strokeWidth={1.75} strokeLinecap="round"
         strokeLinejoin="round" style={{ display: 'block', flexShrink: 0, ...style }} {...rest}>
      {children}
    </svg>
  )
}

export const IBoard    = ({ s=18 }) => <Svg size={s}><rect x="3" y="3" width="7" height="9" rx="1.5"/><rect x="14" y="3" width="7" height="5" rx="1.5"/><rect x="14" y="12" width="7" height="9" rx="1.5"/><rect x="3" y="16" width="7" height="5" rx="1.5"/></Svg>
export const IStar     = ({ s=14, filled }) => <Svg size={s} fill={filled ? '#F59E0B' : 'none'} style={{color: filled ? '#F59E0B' : 'currentColor'}}><polygon points="12 2 15.09 8.26 22 9.27 17 14.14 18.18 21.02 12 17.77 5.82 21.02 7 14.14 2 9.27 8.91 8.26 12 2"/></Svg>
export const IBell     = ({ s=17 }) => <Svg size={s}><path d="M18 8A6 6 0 0 0 6 8c0 7-3 9-3 9h18s-3-2-3-9"/><path d="M13.73 21a2 2 0 0 1-3.46 0"/></Svg>
export const IFlag     = ({ s=15 }) => <Svg size={s}><path d="M4 15s1-1 4-1 5 2 8 2 4-1 4-1V3s-1 1-4 1-5-2-8-2-4 1-4 1z"/><line x1="4" y1="22" x2="4" y2="15"/></Svg>
export const IChevR    = ({ s=14 }) => <Svg size={s}><polyline points="9 18 15 12 9 6"/></Svg>
export const IChevD    = ({ s=13 }) => <Svg size={s}><polyline points="6 9 12 15 18 9"/></Svg>
export const IChevL    = ({ s=14 }) => <Svg size={s}><polyline points="15 18 9 12 15 6"/></Svg>
export const IPlus     = ({ s=14 }) => <Svg size={s}><line x1="12" y1="5" x2="12" y2="19"/><line x1="5" y1="12" x2="19" y2="12"/></Svg>
export const IX        = ({ s=14 }) => <Svg size={s}><line x1="18" y1="6" x2="6" y2="18"/><line x1="6" y1="6" x2="18" y2="18"/></Svg>
export const ISearch   = ({ s=15 }) => <Svg size={s}><circle cx="11" cy="11" r="8"/><line x1="21" y1="21" x2="16.65" y2="16.65"/></Svg>
export const IDots     = ({ s=16 }) => <Svg size={s} fill="currentColor" stroke="none"><circle cx="12" cy="5" r="1.5"/><circle cx="12" cy="12" r="1.5"/><circle cx="12" cy="19" r="1.5"/></Svg>
export const IDotsH    = ({ s=16 }) => <Svg size={s} fill="currentColor" stroke="none"><circle cx="5" cy="12" r="1.5"/><circle cx="12" cy="12" r="1.5"/><circle cx="19" cy="12" r="1.5"/></Svg>
export const ITrash    = ({ s=14 }) => <Svg size={s}><polyline points="3 6 5 6 21 6"/><path d="M19 6v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6m3 0V4a1 1 0 0 1 1-1h4a1 1 0 0 1 1 1v2"/></Svg>
export const IPen      = ({ s=13 }) => <Svg size={s}><path d="M11 4H4a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2v-7"/><path d="M18.5 2.5a2.121 2.121 0 0 1 3 3L12 15l-4 1 1-4 9.5-9.5z"/></Svg>
export const ICheck    = ({ s=13 }) => <Svg size={s}><polyline points="20 6 9 17 4 12"/></Svg>
export const IArchive  = ({ s=14 }) => <Svg size={s}><polyline points="21 8 21 21 3 21 3 8"/><rect x="1" y="3" width="22" height="5"/><line x1="10" y1="12" x2="14" y2="12"/></Svg>
export const ILink     = ({ s=13 }) => <Svg size={s}><path d="M10 13a5 5 0 0 0 7.54.54l3-3a5 5 0 0 0-7.07-7.07l-1.72 1.71"/><path d="M14 11a5 5 0 0 0-7.54-.54l-3 3a5 5 0 0 0 7.07 7.07l1.71-1.71"/></Svg>
export const IComment  = ({ s=13 }) => <Svg size={s}><path d="M21 15a2 2 0 0 1-2 2H7l-4 4V5a2 2 0 0 1 2-2h14a2 2 0 0 0 0"/><path d="M21 15a2 2 0 0 1-2 2H7l-4 4V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2z"/></Svg>
export const ICalendar = ({ s=13 }) => <Svg size={s}><rect x="3" y="4" width="18" height="17" rx="2"/><line x1="16" y1="2" x2="16" y2="6"/><line x1="8" y1="2" x2="8" y2="6"/><line x1="3" y1="10" x2="21" y2="10"/></Svg>
export const IUser     = ({ s=13 }) => <Svg size={s}><path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2"/><circle cx="12" cy="7" r="4"/></Svg>
export const ITag      = ({ s=13 }) => <Svg size={s}><path d="M20.6 11.4l-9-9A2 2 0 0 0 10.2 2H4a2 2 0 0 0-2 2v6.2a2 2 0 0 0 .6 1.4l9 9a2 2 0 0 0 2.8 0l6.2-6.2a2 2 0 0 0 0-2.8z"/><circle cx="7.5" cy="7.5" r="1.5" fill="currentColor" stroke="none"/></Svg>
export const IClock    = ({ s=13 }) => <Svg size={s}><circle cx="12" cy="12" r="10"/><polyline points="12 6 12 12 16 14"/></Svg>
export const ISlack    = ({ s=14 }) => <Svg size={s}><path d="M14.5 10c-.83 0-1.5-.67-1.5-1.5v-5c0-.83.67-1.5 1.5-1.5s1.5.67 1.5 1.5v5c0 .83-.67 1.5-1.5 1.5z"/><path d="M20.5 10H19V8.5c0-.83.67-1.5 1.5-1.5s1.5.67 1.5 1.5-.67 1.5-1.5 1.5z"/><path d="M9.5 14c.83 0 1.5.67 1.5 1.5v5c0 .83-.67 1.5-1.5 1.5S8 21.33 8 20.5v-5c0-.83.67-1.5 1.5-1.5z"/><path d="M3.5 14H5v1.5c0 .83-.67 1.5-1.5 1.5S2 16.33 2 15.5 2.67 14 3.5 14z"/><path d="M14 14.5c0-.83.67-1.5 1.5-1.5h5c.83 0 1.5.67 1.5 1.5s-.67 1.5-1.5 1.5h-5c-.83 0-1.5-.67-1.5-1.5z"/><path d="M15.5 19H14v1.5c0 .83.67 1.5 1.5 1.5s1.5-.67 1.5-1.5-.67-1.5-1.5-1.5z"/><path d="M10 9.5C10 8.67 9.33 8 8.5 8h-5C2.67 8 2 8.67 2 9.5S2.67 11 3.5 11h5c.83 0 1.5-.67 1.5-1.5z"/><path d="M8.5 5H10V3.5C10 2.67 9.33 2 8.5 2S7 2.67 7 3.5 7.67 5 8.5 5z"/></Svg>
export const IRepeat   = ({ s=13 }) => <Svg size={s}><polyline points="17 1 21 5 17 9"/><path d="M3 11V9a4 4 0 0 1 4-4h14"/><polyline points="7 23 3 19 7 15"/><path d="M21 13v2a4 4 0 0 1-4 4H3"/></Svg>
export const IZap      = ({ s=14 }) => <Svg size={s}><polygon points="13 2 3 14 12 14 11 22 21 10 12 10 13 2"/></Svg>
export const IGrip     = ({ s=14 }) => <Svg size={s} fill="currentColor" stroke="none"><rect x="5" y="4" width="3" height="3" rx="1"/><rect x="11" y="4" width="3" height="3" rx="1"/><rect x="5" y="10" width="3" height="3" rx="1"/><rect x="11" y="10" width="3" height="3" rx="1"/><rect x="5" y="16" width="3" height="3" rx="1"/><rect x="11" y="16" width="3" height="3" rx="1"/></Svg>
export const ISettings = ({ s=16 }) => <Svg size={s}><circle cx="12" cy="12" r="3"/><path d="M19.4 15a1.65 1.65 0 0 0 .33 1.82l.06.06a2 2 0 0 1-2.83 2.83l-.06-.06a1.65 1.65 0 0 0-1.82-.33 1.65 1.65 0 0 0-1 1.51V21a2 2 0 0 1-4 0v-.09A1.65 1.65 0 0 0 9 19.4a1.65 1.65 0 0 0-1.82.33l-.06.06a2 2 0 0 1-2.83-2.83l.06-.06A1.65 1.65 0 0 0 4.68 15a1.65 1.65 0 0 0-1.51-1H3a2 2 0 0 1 0-4h.09A1.65 1.65 0 0 0 4.6 9a1.65 1.65 0 0 0-.33-1.82l-.06-.06a2 2 0 0 1 2.83-2.83l.06.06A1.65 1.65 0 0 0 9 4.68a1.65 1.65 0 0 0 1-1.51V3a2 2 0 0 1 4 0v.09a1.65 1.65 0 0 0 1 1.51 1.65 1.65 0 0 0 1.82-.33l.06-.06a2 2 0 0 1 2.83 2.83l-.06.06A1.65 1.65 0 0 0 19.4 9a1.65 1.65 0 0 0 1.51 1H21a2 2 0 0 1 0 4h-.09a1.65 1.65 0 0 0-1.51 1z"/></Svg>
export const ILogout   = ({ s=15 }) => <Svg size={s}><path d="M9 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h4"/><polyline points="16 17 21 12 16 7"/><line x1="21" y1="12" x2="9" y2="12"/></Svg>
export const IActivity = ({ s=15 }) => <Svg size={s}><polyline points="22 12 18 12 15 21 9 3 6 12 2 12"/></Svg>
export const IPaper    = ({ s=15 }) => <Svg size={s}><path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z"/><polyline points="14 2 14 8 20 8"/><line x1="16" y1="13" x2="8" y2="13"/><line x1="16" y1="17" x2="8" y2="17"/><polyline points="10 9 9 9 8 9"/></Svg>
export const ISummary  = ({ s=18 }) => <Svg size={s}><rect x="3" y="3" width="18" height="18" rx="2"/><path d="M7 8h10M7 12h7M7 16h5"/></Svg>
export const ISnooze   = ({ s=13 }) => <Svg size={s}><circle cx="12" cy="13" r="7"/><polyline points="12 10 12 13 14 15"/><path d="M5 5L2 8M22 8l-3-3M9 5h6"/></Svg>
export const IInbox    = ({ s=15 }) => <Svg size={s}><polyline points="22 12 16 12 14 15 10 15 8 12 2 12"/><path d="M5.45 5.11L2 12v6a2 2 0 0 0 2 2h16a2 2 0 0 0 2-2v-6l-3.45-6.89A2 2 0 0 0 16.76 4H7.24a2 2 0 0 0-1.79 1.11z"/></Svg>
export const IMessage  = ({ s=16 }) => <Svg size={s}><path d="M21 15a2 2 0 0 1-2 2H7l-4 4V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2z"/></Svg>
export const IShare    = ({ s=14 }) => <Svg size={s}><circle cx="18" cy="5" r="3"/><circle cx="6" cy="12" r="3"/><circle cx="18" cy="19" r="3"/><line x1="8.59" y1="13.51" x2="15.42" y2="17.49"/><line x1="15.41" y1="6.51" x2="8.59" y2="10.49"/></Svg>

// ── Utility ───────────────────────────────────────────────────────────────────
export const uid = () => Math.random().toString(36).slice(2, 10)
export const now = () => new Date().toISOString()

export function formatDate(iso) {
  if (!iso) return ''
  const d = new Date(iso)
  const today = new Date()
  const diff = Math.floor((d - today) / 86400000)
  if (diff === 0) return 'Today'
  if (diff === 1) return 'Tomorrow'
  if (diff === -1) return 'Yesterday'
  return d.toLocaleDateString('en-IN', { month: 'short', day: 'numeric' })
}

export function isOverdue(iso) {
  if (!iso) return false
  return new Date(iso) < new Date(new Date().toDateString())
}

export function initials(name) {
  return name.split(' ').map(w => w[0]).join('').slice(0, 2).toUpperCase()
}
