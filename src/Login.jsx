import { useEffect, useRef, useState } from 'react'
import { GoogleLogin } from '@react-oauth/google'

const NAVY = '#1B3557'
const WHITE = '#FFFFFF'
const CREAM = '#F5F4F2'

const ADMINS = ['purva.gandhi@mosaicwellness.in', 'abhijeet.mittal@mosaicwellness.in']
const ALLOWED_DOMAIN = 'mosaicwellness.in'

// Map known emails to stable IDs so existing board data stays consistent
const EMAIL_TO_ID = {
  'purva.gandhi@mosaicwellness.in':   'u1',
  'sabika.ansari@mosaicwellness.in':  'u2',
  'kunal@mosaicwellness.in':          'u3',
}

const COLORS = ['#1B3557','#DB2777','#059669','#7C3AED','#D97706','#2563EB','#DC2626','#0891B2']

function colorForEmail(email) {
  let hash = 0
  for (let i = 0; i < email.length; i++) hash = email.charCodeAt(i) + ((hash << 5) - hash)
  return COLORS[Math.abs(hash) % COLORS.length]
}

function decodeJwt(token) {
  const base64 = token.split('.')[1].replace(/-/g, '+').replace(/_/g, '/')
  return JSON.parse(atob(base64))
}

export function buildSession(credential) {
  const payload = decodeJwt(credential)
  const email = payload.email || ''
  const domain = email.split('@')[1]

  if (domain !== ALLOWED_DOMAIN) return null

  const id = EMAIL_TO_ID[email] || ('u_' + email.replace(/[^a-z0-9]/gi, '_'))
  const role = ADMINS.includes(email) ? 'manager' : 'member'

  return {
    id,
    name: payload.name || email.split('@')[0],
    email,
    picture: payload.picture || null,
    role,
    color: colorForEmail(email),
  }
}

export default function Login({ onLogin }) {
  const [error, setError] = useState(null)
  const [visible, setVisible] = useState(false)

  useEffect(() => {
    requestAnimationFrame(() => setVisible(true))
  }, [])

  function handleSuccess(response) {
    const session = buildSession(response.credential)
    if (!session) {
      setError('Only @mosaicwellness.in accounts are allowed.')
      return
    }
    localStorage.setItem('flowboard_session', JSON.stringify(session))
    onLogin(session)
  }

  function handleError() {
    setError('Sign in failed. Please try again.')
  }

  return (
    <div style={{
      display: 'flex', height: '100vh', width: '100vw',
      background: CREAM, alignItems: 'center', justifyContent: 'center',
      fontFamily: '-apple-system,BlinkMacSystemFont,"Segoe UI",Roboto,Helvetica,sans-serif',
    }}>
      <div style={{
        background: WHITE, borderRadius: 20, padding: '48px 44px',
        boxShadow: '0 8px 48px rgba(27,53,87,0.12)',
        display: 'flex', flexDirection: 'column', alignItems: 'center',
        gap: 0, width: 380, maxWidth: '90vw',
        opacity: visible ? 1 : 0, transform: visible ? 'translateY(0)' : 'translateY(16px)',
        transition: 'all 0.35s cubic-bezier(0.22,1,0.36,1)',
      }}>
        {/* Logo */}
        <div style={{
          width: 52, height: 52, borderRadius: 16, marginBottom: 20,
          background: 'linear-gradient(135deg, #1B3557 0%, #2563EB 100%)',
          display: 'flex', alignItems: 'center', justifyContent: 'center',
          boxShadow: '0 4px 16px rgba(27,53,87,0.3)',
        }}>
          <svg width="24" height="24" viewBox="0 0 16 16" fill="none">
            <path d="M3 8.5L6.5 12L13 4" stroke="white" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
            <circle cx="8" cy="8" r="6.5" stroke="white" strokeWidth="1" opacity="0.3"/>
          </svg>
        </div>

        <div style={{ fontSize: 22, fontWeight: 900, color: NAVY, letterSpacing: '-0.5px', marginBottom: 6 }}>
          FlowBoard
        </div>
        <div style={{ fontSize: 13, color: '#6B7280', marginBottom: 32, textAlign: 'center', lineHeight: 1.5 }}>
          Mosaic Wellness · Work Management
        </div>

        {/* Divider */}
        <div style={{ width: '100%', height: 1, background: '#F3F4F6', marginBottom: 28 }} />

        <div style={{ fontSize: 13, fontWeight: 600, color: '#374151', marginBottom: 16 }}>
          Sign in with your Mosaic account
        </div>

        <GoogleLogin
          onSuccess={handleSuccess}
          onError={handleError}
          useOneTap={false}
          theme="outline"
          size="large"
          width="296"
          text="signin_with_google"
          shape="rectangular"
        />

        {error && (
          <div style={{
            marginTop: 16, padding: '10px 14px', borderRadius: 8,
            background: '#FEF2F2', border: '1px solid #FECACA',
            fontSize: 12, color: '#DC2626', textAlign: 'center', lineHeight: 1.5,
          }}>
            {error}
          </div>
        )}

        <div style={{ marginTop: 24, fontSize: 11, color: '#9CA3AF', textAlign: 'center', lineHeight: 1.6 }}>
          Only <strong>@mosaicwellness.in</strong> accounts are allowed.<br/>
          Contact your admin if you need access.
        </div>
      </div>
    </div>
  )
}
