import { uid, now } from './tokens.jsx'

export const USERS = [
  { id: 'u1', name: 'Purva Gandhi',  color: '#1B3557', role: 'manager', email: 'purva.gandhi@mosaicwellness.in' },
  { id: 'u2', name: 'Sabika Ansari', color: '#DB2777', role: 'member',  email: 'sabika.ansari@mosaicwellness.in' },
  { id: 'u3', name: 'Kunal',         color: '#059669', role: 'member',  email: 'kunal@mosaicwellness.in' },
]

const INITIAL_STATE = {
  columns: [
    { id: 'col1', title: 'Backlog',     accent: '#6B7280', position: 0 },
    { id: 'col2', title: 'In Progress', accent: '#2563EB', position: 1 },
    { id: 'col3', title: 'Review',      accent: '#D97706', position: 2 },
    { id: 'col4', title: 'Shipped',     accent: '#059669', position: 3 },
  ],
  cards: [],
  tasks: [],
  reminders: [],
  activityLog: [],
}

const KEY = 'flowboard_v2'

export function loadState() {
  try {
    const raw = localStorage.getItem(KEY)
    if (raw) return JSON.parse(raw)
  } catch {}
  return INITIAL_STATE
}

export function saveState(state) {
  try { localStorage.setItem(KEY, JSON.stringify(state)) } catch {}
}

export function resetState() {
  localStorage.removeItem(KEY)
  return INITIAL_STATE
}

export { INITIAL_STATE }
