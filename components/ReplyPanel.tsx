'use client'
import { useState, useEffect } from 'react'
import { MessageSquare, RefreshCw, Check } from 'lucide-react'
import type { SlackMessage, UserRole } from '@/lib/types'
import { canApproveFlagged } from '@/lib/permissions'

interface Props {
  message: SlackMessage | null
  projectId: string
  currentRole: UserRole
  currentUserId: string
  onStatusChange: (msg: SlackMessage) => void
}

export default function ReplyPanel({ message, projectId, currentRole, currentUserId, onStatusChange }: Props) {
  const [draft, setDraft] = useState('')
  const [regenerating, setRegenerating] = useState(false)
  const [copied, setCopied] = useState(false)

  useEffect(() => { setDraft(message?.draft_reply || ''); setCopied(false) }, [message?.id])

  async function updateStatus(action: string, extra?: Record<string, string>) {
    if (!message) return
    const res = await fetch(`/api/slack-feed/${message.id}`, { method: 'PATCH', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ action, ...extra }) })
    onStatusChange(await res.json())
  }

  async function saveDraft() {
    if (!message) return
    await fetch(`/api/slack-feed/${message.id}`, { method: 'PATCH', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ draft_reply: draft }) })
  }

  async function copyAndDone() {
    await navigator.clipboard.writeText(draft); setCopied(true); await updateStatus('replied'); setTimeout(() => setCopied(false), 2000)
  }

  async function regenerate() {
    if (!message) return
    setRegenerating(true)
    const res = await fetch(`/api/slack-feed/${message.id}`, { method: 'POST' })
    const updated = await res.json()
    setDraft(updated.draft_reply || ''); setRegenerating(false); onStatusChange(updated)
  }

  if (!message) return (
    <div style={{ width: 400, minWidth: 400, display: 'flex', alignItems: 'center', justifyContent: 'center', flexDirection: 'column', gap: 'var(--space-3)', color: 'var(--tx2)', background: 'var(--bg2)', borderRadius: '0 var(--radius-lg) var(--radius-lg) 0' }}>
      <div style={{ width: 52, height: 52, background: 'var(--bg1)', borderRadius: 'var(--radius-lg)', display: 'flex', alignItems: 'center', justifyContent: 'center', boxShadow: 'var(--shadow-card)' }}>
        <MessageSquare size={22} />
      </div>
      <span style={{ fontSize: 'var(--text-sm)', fontWeight: 600 }}>select a message</span>
    </div>
  )

  return (
    <div style={{ width: 400, minWidth: 400, display: 'flex', flexDirection: 'column', overflow: 'hidden', background: 'var(--bg2)' }}>

      {/* Original message */}
      <div style={{ padding: 'var(--space-5) var(--space-5) var(--space-4)', flexShrink: 0 }}>
        <div style={{ fontSize: 'var(--text-xs)', color: 'var(--tx2)', textTransform: 'uppercase', letterSpacing: '0.06em', fontWeight: 700, marginBottom: 'var(--space-3)' }}>original message</div>
        <div style={{ background: 'var(--bg1)', borderRadius: 'var(--radius-lg)', padding: 'var(--space-3) var(--space-4)', fontSize: 'var(--text-sm)', color: 'var(--tx1)', lineHeight: 1.55, boxShadow: 'var(--shadow-card)', borderLeft: '4px solid var(--brand)' }}>
          <span style={{ fontWeight: 600, color: 'var(--tx0)' }}>{message.from_name}</span>
          <span style={{ color: 'var(--tx2)', fontSize: 'var(--text-xs)', marginLeft: 'var(--space-2)' }}>{message.channel}</span>
          <div style={{ marginTop: 'var(--space-2)' }}>{message.message}</div>
        </div>
      </div>

      {/* Draft reply */}
      <div style={{ flex: 1, display: 'flex', flexDirection: 'column', padding: '0 var(--space-5) var(--space-4)', gap: 'var(--space-3)', overflow: 'hidden' }}>
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
          <div style={{ fontSize: 'var(--text-xs)', color: 'var(--tx2)', textTransform: 'uppercase', letterSpacing: '0.06em', fontWeight: 700 }}>draft reply</div>
          <div style={{ display: 'flex', alignItems: 'center', gap: 'var(--space-2)' }}>
            <span style={{ fontSize: 10, background: 'var(--purple-bg)', color: 'var(--purple)', padding: 'var(--space-1) var(--space-3)', borderRadius: 'var(--radius-md)', fontWeight: 700 }}>AI draft</span>
            <button onClick={regenerate} disabled={regenerating} title="Regenerate" style={{ background: 'var(--bg1)', border: 'none', color: 'var(--tx2)', cursor: 'pointer', width: 28, height: 28, borderRadius: 'var(--radius-md)', display: 'flex', alignItems: 'center', justifyContent: 'center', boxShadow: 'var(--shadow-card)' }}>
              <RefreshCw size={14} className={regenerating ? 'animate-spin' : ''} />
            </button>
          </div>
        </div>

        <textarea
          value={draft} onChange={e => setDraft(e.target.value)} onBlur={saveDraft}
          style={{ flex: 1, background: 'var(--bg1)', border: 'none', borderRadius: 'var(--radius-lg)', padding: 'var(--space-3) var(--space-4)', fontSize: 'var(--text-sm)', color: 'var(--tx0)', resize: 'none', outline: 'none', lineHeight: 1.6, minHeight: 140, boxShadow: 'var(--shadow-card)' }}
        />

        {message.status !== 'pending' && (
          <div style={{ padding: 'var(--space-2) var(--space-3)', background: 'var(--bg1)', borderRadius: 'var(--radius-md)', fontSize: 'var(--text-xs)', color: 'var(--tx2)', textAlign: 'center', boxShadow: 'var(--shadow-card)' }}>
            status: <span style={{ color: message.status === 'replied' ? 'var(--green)' : message.status === 'flagged' ? 'var(--amber)' : 'var(--tx1)', fontWeight: 600 }}>{message.status}</span>
          </div>
        )}
      </div>

      {/* Actions */}
      <div style={{ padding: 'var(--space-3) var(--space-5) var(--space-5)', display: 'flex', gap: 'var(--space-2)', flexWrap: 'wrap', flexShrink: 0 }}>
        {message.status === 'flagged' && canApproveFlagged(currentRole) ? (
          <>
            <button onClick={async () => { await navigator.clipboard.writeText(draft); setCopied(true); await updateStatus('approved'); setTimeout(() => setCopied(false), 2000) }} style={{ flex: 1, padding: 'var(--space-3) var(--space-4)', borderRadius: 'var(--radius-lg)', fontSize: 'var(--text-sm)', cursor: 'pointer', border: 'none', fontWeight: 600, background: 'var(--green)', color: '#fff', transition: 'all var(--duration-normal) var(--ease-default)' }}>
              {copied ? <><Check size={14} style={{ display: 'inline', verticalAlign: 'middle', marginRight: 'var(--space-1)' }} /> Copied!</> : 'Approve & Copy'}
            </button>
            <button onClick={() => updateStatus('pending')} style={{ padding: 'var(--space-3) var(--space-4)', borderRadius: 'var(--radius-lg)', fontSize: 'var(--text-sm)', cursor: 'pointer', border: 'none', fontWeight: 500, background: 'var(--bg1)', color: 'var(--tx1)', boxShadow: 'var(--shadow-card)' }}>Reject</button>
            <button onClick={() => updateStatus('dismissed')} style={{ padding: 'var(--space-3) var(--space-4)', borderRadius: 'var(--radius-lg)', fontSize: 'var(--text-sm)', cursor: 'pointer', border: 'none', fontWeight: 500, background: 'var(--bg1)', color: 'var(--tx2)', boxShadow: 'var(--shadow-card)' }}>Dismiss</button>
          </>
        ) : (
          <>
            <button onClick={copyAndDone} style={{ flex: 1, padding: 'var(--space-3) var(--space-4)', borderRadius: 'var(--radius-lg)', fontSize: 'var(--text-sm)', cursor: 'pointer', border: 'none', fontWeight: 600, background: copied ? 'var(--green)' : 'var(--brand)', color: '#fff', transition: 'all var(--duration-normal) var(--ease-default)' }}>
              {copied ? <><Check size={14} style={{ display: 'inline', verticalAlign: 'middle', marginRight: 'var(--space-1)' }} /> Copied!</> : 'Copy & Done'}
            </button>
            <button onClick={() => updateStatus('flagged', { flagged_by: currentUserId })} style={{ padding: 'var(--space-3) var(--space-4)', borderRadius: 'var(--radius-lg)', fontSize: 'var(--text-sm)', cursor: 'pointer', border: 'none', fontWeight: 500, background: 'var(--amber-bg)', color: 'var(--amber)' }}>Flag</button>
            <button onClick={() => updateStatus('dismissed')} style={{ padding: 'var(--space-3) var(--space-4)', borderRadius: 'var(--radius-lg)', fontSize: 'var(--text-sm)', cursor: 'pointer', border: 'none', fontWeight: 500, background: 'var(--bg1)', color: 'var(--tx2)', boxShadow: 'var(--shadow-card)' }}>Dismiss</button>
          </>
        )}
      </div>
    </div>
  )
}
