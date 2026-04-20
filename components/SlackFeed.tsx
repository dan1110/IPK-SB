'use client'
import { useState, useEffect, useCallback } from 'react'
import { MessageSquare, RefreshCw } from 'lucide-react'
import type { SlackMessage } from '@/lib/types'

interface Props {
  projectId: string
  selectedMsgId: string | null
  onSelect: (msg: SlackMessage) => void
  onCountChange: () => void
}

const TAG_STYLES: Record<string, React.CSSProperties> = {
  urgent:    { background:'var(--red-bg)',    color:'var(--red)' },
  '@mention':{ background:'var(--amber-bg)',  color:'var(--amber)' },
  review:    { background:'var(--blue-bg)',   color:'var(--blue)' },
  deadline:  { background:'var(--red-bg)',    color:'var(--red)' },
  finance:   { background:'var(--green-bg)',  color:'var(--green)' },
  replied:   { background:'var(--green-bg)',  color:'var(--green)' },
  flagged:   { background:'var(--amber-bg)',  color:'var(--amber)' },
  default:   { background:'var(--bg3)',       color:'var(--tx2)' },
}

type Filter = 'all' | 'pending' | 'flagged' | 'replied'

export default function SlackFeed({ projectId, selectedMsgId, onSelect, onCountChange }: Props) {
  const [msgs, setMsgs] = useState<SlackMessage[]>([])
  const [filter, setFilter] = useState<Filter>('all')
  const [loading, setLoading] = useState(false)

  const load = useCallback(() => {
    setLoading(true)
    fetch(`/api/slack-feed?project_id=${projectId}&status=${filter}`)
      .then(r => r.json())
      .then(data => { setMsgs(data); setLoading(false) })
  }, [projectId, filter])

  useEffect(() => { load() }, [load])

  const visible = msgs.filter(m => filter === 'all' || m.status === filter)

  function timeAgo(ts: string) {
    const diff = Date.now() - new Date(ts).getTime()
    const m = Math.floor(diff / 60000)
    if (m < 1) return 'just now'
    if (m < 60) return `${m}m ago`
    const h = Math.floor(m / 60)
    if (h < 24) return `${h}h ago`
    return `${Math.floor(h / 24)}d ago`
  }

  return (
    <div style={{ flex: 1, display: 'flex', flexDirection: 'column', overflow: 'hidden', minWidth: 0 }}>
      {/* Header */}
      <div style={{ padding: 'var(--space-4) var(--space-5)', display: 'flex', alignItems: 'center', justifyContent: 'space-between', flexShrink: 0 }}>
        <span style={{ fontSize: 'var(--text-xs)', fontWeight: 700, color: 'var(--tx2)', textTransform: 'uppercase', letterSpacing: '0.06em' }}>@mentions via n8n</span>
        <div style={{ display: 'flex', gap: 'var(--space-1)', background: 'var(--bg3)', borderRadius: 'var(--radius-lg)', padding: 'var(--space-1)' }}>
          {(['all','pending','flagged','replied'] as Filter[]).map(f => (
            <button key={f} onClick={() => setFilter(f)}
              style={{ padding: 'var(--space-1) var(--space-3)', borderRadius: 'var(--radius-md)', fontSize: 'var(--text-xs)', cursor: 'pointer', border: 'none', transition: 'all var(--duration-fast) var(--ease-default)', fontWeight: filter === f ? 600 : 400, background: filter === f ? 'var(--bg1)' : 'transparent', color: filter === f ? 'var(--tx0)' : 'var(--tx2)', boxShadow: filter === f ? 'var(--shadow-card)' : 'none' }}>
              {f}
            </button>
          ))}
          <button onClick={load} style={{ padding: 'var(--space-1) var(--space-2)', borderRadius: 'var(--radius-md)', fontSize: 'var(--text-sm)', cursor: 'pointer', border: 'none', background: 'transparent', color: 'var(--tx2)', display: 'flex', alignItems: 'center', justifyContent: 'center' }} title="Refresh">
            <RefreshCw size={14} className={loading ? 'animate-spin' : ''} />
          </button>
        </div>
      </div>

      {/* List */}
      <div style={{ flex: 1, overflowY: 'auto', padding: '0 var(--space-3) var(--space-3)' }}>
        {visible.length === 0 && !loading && (
          <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', gap: 'var(--space-3)', color: 'var(--tx2)', marginTop: 64 }}>
            <div style={{ width: 52, height: 52, borderRadius: 'var(--radius-lg)', background: 'var(--bg3)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
              <MessageSquare size={22} />
            </div>
            <span style={{ fontSize: 'var(--text-sm)', fontWeight: 600 }}>no messages</span>
            <span style={{ fontSize: 'var(--text-xs)', color: 'var(--tx2)' }}>n8n se tu dong push @mentions vao day</span>
          </div>
        )}
        {visible.map(msg => {
          const tags: string[] = JSON.parse(msg.tags || '[]')
          const isUrgent = tags.includes('urgent')
          const isSelected = msg.id === selectedMsgId
          return (
            <div
              key={msg.id}
              onClick={() => onSelect(msg)}
              className="animate-fade-in"
              style={{
                background: 'var(--bg1)', borderRadius: 'var(--radius-lg)', marginBottom: 'var(--space-2)', cursor: 'pointer', transition: 'all var(--duration-normal) var(--ease-default)', overflow: 'hidden',
                borderLeft: `4px solid ${isUrgent ? 'var(--red)' : msg.status === 'replied' ? 'var(--green)' : msg.status === 'flagged' ? 'var(--amber)' : 'var(--bg4)'}`,
                opacity: msg.status === 'dismissed' ? 0.4 : 1,
                boxShadow: isSelected ? '0 0 0 2px var(--brand-bd), var(--shadow-card)' : 'var(--shadow-card)',
              }}
            >
              <div style={{ padding: 'var(--space-3) var(--space-4) var(--space-2)', display: 'flex', alignItems: 'center', gap: 'var(--space-3)' }}>
                <div style={{ width: 34, height: 34, borderRadius: 'var(--radius-lg)', background: 'var(--bg3)', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 'var(--text-xs)', fontWeight: 700, color: 'var(--tx1)', flexShrink: 0 }}>
                  {msg.from_initials}
                </div>
                <div style={{ flex: 1, minWidth: 0 }}>
                  <div style={{ fontSize: 'var(--text-base)', fontWeight: 600, color: 'var(--tx0)' }}>{msg.from_name}</div>
                  <div style={{ fontSize: 'var(--text-xs)', color: 'var(--tx2)', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{msg.channel}</div>
                </div>
                <div style={{ fontSize: 'var(--text-xs)', color: 'var(--tx2)', flexShrink: 0 }}>{timeAgo(msg.pulled_at)}</div>
              </div>
              <div style={{ padding: '0 var(--space-4) var(--space-3)', fontSize: 'var(--text-sm)', color: 'var(--tx1)', lineHeight: 1.55, display: '-webkit-box', WebkitLineClamp: 2, WebkitBoxOrient: 'vertical', overflow: 'hidden' }}>
                {msg.message}
              </div>
              {tags.length > 0 && (
                <div style={{ padding: '0 var(--space-4) var(--space-3)', display: 'flex', gap: 'var(--space-1)', flexWrap: 'wrap' }}>
                  {msg.status !== 'pending' && (
                    <span style={{ padding: 'var(--space-1) var(--space-3)', borderRadius: 'var(--radius-md)', fontSize: 10, fontWeight: 600, border: 'none', ...TAG_STYLES[msg.status] || TAG_STYLES.default }}>{msg.status}</span>
                  )}
                  {tags.filter(t => t !== '@mention' || msg.status === 'pending').map(tag => (
                    <span key={tag} style={{ padding: 'var(--space-1) var(--space-3)', borderRadius: 'var(--radius-md)', fontSize: 10, fontWeight: 600, border: 'none', ...(TAG_STYLES[tag] || TAG_STYLES.default) }}>{tag}</span>
                  ))}
                </div>
              )}
            </div>
          )
        })}
      </div>
    </div>
  )
}
