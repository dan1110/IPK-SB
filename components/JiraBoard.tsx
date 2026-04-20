'use client'
import { useState, useEffect, useCallback } from 'react'
import type { JiraTicket } from '@/lib/types'

interface Props {
  projectId: string
  onRiskCountChange?: (count: number) => void
}

type FilterKey = 'all' | 'To Do' | 'In Progress' | 'Done' | 'at-risk'

const PRIORITY_COLORS: Record<string, string> = {
  Critical: 'var(--red)',
  Highest: 'var(--red)',
  High: '#f59e0b',
  Medium: 'var(--blue)',
  Low: 'var(--green)',
  Lowest: 'var(--tx2)',
}

const STATUS_COLORS: Record<string, string> = {
  'To Do': 'var(--tx2)',
  'In Progress': 'var(--blue)',
  'In Review': 'var(--purple)',
  'Done': 'var(--green)',
  'Blocked': 'var(--red)',
}

const RISK_COLORS: Record<string, string> = {
  low: '#f59e0b',
  medium: '#f59e0b',
  high: 'var(--red)',
  critical: 'var(--red)',
}

export default function JiraBoard({ projectId, onRiskCountChange }: Props) {
  const [tickets, setTickets] = useState<JiraTicket[]>([])
  const [stats, setStats] = useState<{ status: string; count: number }[]>([])
  const [filter, setFilter] = useState<FilterKey>('all')
  const [expandedId, setExpandedId] = useState<string | null>(null)
  const [loading, setLoading] = useState(true)

  const fetchData = useCallback(() => {
    setLoading(true)
    fetch(`/api/jira?project_id=${projectId}`)
      .then(r => r.json())
      .then(data => {
        setTickets(data.tickets || [])
        setStats(data.stats || [])
        onRiskCountChange?.(data.riskCount || 0)
        setLoading(false)
      })
      .catch(() => setLoading(false))
  }, [projectId, onRiskCountChange])

  useEffect(() => { fetchData() }, [fetchData])

  const totalTickets = stats.reduce((s, st) => s + st.count, 0)
  const filtered = filter === 'all'
    ? tickets
    : filter === 'at-risk'
      ? tickets.filter(t => t.risk_level !== 'none')
      : tickets.filter(t => t.status === filter)

  const FILTERS: { key: FilterKey; label: string }[] = [
    { key: 'all', label: 'all' },
    { key: 'To Do', label: 'to do' },
    { key: 'In Progress', label: 'in progress' },
    { key: 'Done', label: 'done' },
    { key: 'at-risk', label: 'at risk' },
  ]

  return (
    <div style={{ flex: 1, display: 'flex', flexDirection: 'column', overflow: 'hidden' }}>
      {/* Progress overview */}
      <div style={{ padding: '16px 20px 12px', borderBottom: '1px solid var(--bd)', flexShrink: 0 }}>
        <div style={{ fontSize: 11, color: 'var(--tx2)', fontFamily: 'IBM Plex Mono, monospace', marginBottom: 10 }}>
          PROGRESS · {totalTickets} tickets
        </div>

        {totalTickets > 0 ? (
          <div style={{ display: 'flex', height: 8, borderRadius: 4, overflow: 'hidden', gap: 2 }}>
            {stats.map(s => {
              const pct = (s.count / totalTickets) * 100
              if (pct === 0) return null
              return (
                <div
                  key={s.status}
                  title={`${s.status}: ${s.count}`}
                  style={{
                    width: `${pct}%`,
                    background: STATUS_COLORS[s.status] || 'var(--tx2)',
                    borderRadius: 2,
                    minWidth: 4,
                    transition: 'width .3s ease',
                  }}
                />
              )
            })}
          </div>
        ) : (
          <div style={{ height: 8, borderRadius: 4, background: 'var(--bg3)' }} />
        )}

        {/* Status legend */}
        <div style={{ display: 'flex', gap: 14, marginTop: 8, flexWrap: 'wrap' }}>
          {stats.map(s => (
            <div key={s.status} style={{ display: 'flex', alignItems: 'center', gap: 4, fontSize: 11, color: 'var(--tx1)', fontFamily: 'IBM Plex Mono, monospace' }}>
              <div style={{ width: 8, height: 8, borderRadius: 2, background: STATUS_COLORS[s.status] || 'var(--tx2)' }} />
              {s.status} ({s.count})
            </div>
          ))}
        </div>
      </div>

      {/* Filter bar */}
      <div style={{ padding: '8px 20px', display: 'flex', gap: 4, borderBottom: '1px solid var(--bd)', flexShrink: 0 }}>
        {FILTERS.map(f => (
          <button
            key={f.key}
            onClick={() => setFilter(f.key)}
            style={{
              padding: '3px 10px', borderRadius: 5, fontSize: 11, cursor: 'pointer',
              fontFamily: 'IBM Plex Mono, monospace', transition: '.15s', border: '1px solid',
              background: filter === f.key ? 'var(--blue-bg)' : 'transparent',
              color: filter === f.key ? 'var(--blue)' : 'var(--tx2)',
              borderColor: filter === f.key ? 'var(--blue-bd)' : 'transparent',
            }}
          >
            {f.label}
          </button>
        ))}
        <div style={{ flex: 1 }} />
        <button
          onClick={fetchData}
          style={{ padding: '3px 10px', borderRadius: 5, fontSize: 11, cursor: 'pointer', fontFamily: 'IBM Plex Mono, monospace', background: 'transparent', border: '1px solid var(--bd2)', color: 'var(--tx2)' }}
        >
          refresh
        </button>
      </div>

      {/* Ticket list */}
      <div style={{ flex: 1, overflowY: 'auto', padding: '8px 12px' }}>
        {loading ? (
          <div style={{ padding: 40, textAlign: 'center', color: 'var(--tx2)', fontSize: 12, fontFamily: 'IBM Plex Mono, monospace' }}>loading...</div>
        ) : filtered.length === 0 ? (
          <div style={{ padding: 40, textAlign: 'center', color: 'var(--tx2)', fontSize: 12, fontFamily: 'IBM Plex Mono, monospace' }}>
            {totalTickets === 0 ? 'no jira tickets synced yet — connect via n8n webhook' : 'no tickets match this filter'}
          </div>
        ) : (
          filtered.map(ticket => (
            <TicketCard
              key={ticket.id}
              ticket={ticket}
              expanded={expandedId === ticket.id}
              onToggle={() => setExpandedId(expandedId === ticket.id ? null : ticket.id)}
            />
          ))
        )}
      </div>
    </div>
  )
}

function TicketCard({ ticket, expanded, onToggle }: { ticket: JiraTicket; expanded: boolean; onToggle: () => void }) {
  const hasRisk = ticket.risk_level !== 'none'
  const labels: string[] = (() => { try { return JSON.parse(ticket.labels) } catch { return [] } })()
  const isOverdue = ticket.due_date && new Date(ticket.due_date) < new Date()

  return (
    <div
      onClick={onToggle}
      style={{
        background: 'var(--bg2)',
        border: '1px solid var(--bd)',
        borderLeft: hasRisk ? `3px solid ${RISK_COLORS[ticket.risk_level] || 'var(--bd)'}` : '1px solid var(--bd)',
        borderRadius: 8,
        padding: '10px 14px',
        marginBottom: 6,
        cursor: 'pointer',
        transition: '.15s',
      }}
    >
      {/* Header row */}
      <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 4 }}>
        <span style={{ fontSize: 11, fontFamily: 'IBM Plex Mono, monospace', color: 'var(--blue)', fontWeight: 600 }}>
          {ticket.jira_key}
        </span>
        <span style={{
          fontSize: 10, fontFamily: 'IBM Plex Mono, monospace', padding: '1px 6px', borderRadius: 4,
          background: `${STATUS_COLORS[ticket.status] || 'var(--tx2)'}20`,
          color: STATUS_COLORS[ticket.status] || 'var(--tx2)',
        }}>
          {ticket.status}
        </span>
        <span style={{
          fontSize: 10, fontFamily: 'IBM Plex Mono, monospace', padding: '1px 6px', borderRadius: 4,
          color: PRIORITY_COLORS[ticket.priority] || 'var(--tx2)',
        }}>
          {ticket.priority}
        </span>
        <div style={{ flex: 1 }} />
        {hasRisk && (
          <span style={{
            fontSize: 10, fontFamily: 'IBM Plex Mono, monospace', padding: '1px 6px', borderRadius: 4,
            background: `${RISK_COLORS[ticket.risk_level]}20`,
            color: RISK_COLORS[ticket.risk_level],
            fontWeight: 600,
          }}>
            risk: {ticket.risk_level}
          </span>
        )}
      </div>

      {/* Title */}
      <div style={{ fontSize: 13, color: 'var(--tx0)', marginBottom: 4, lineHeight: 1.4 }}>
        {ticket.title}
      </div>

      {/* Meta row */}
      <div style={{ display: 'flex', alignItems: 'center', gap: 10, fontSize: 11, color: 'var(--tx2)', fontFamily: 'IBM Plex Mono, monospace' }}>
        {ticket.assignee && <span>{ticket.assignee}</span>}
        {ticket.due_date && (
          <span style={{ color: isOverdue ? 'var(--red)' : 'var(--tx2)' }}>
            due {ticket.due_date}{isOverdue ? ' (overdue)' : ''}
          </span>
        )}
        {labels.length > 0 && labels.map(l => (
          <span key={l} style={{ padding: '0 4px', background: 'var(--bg3)', borderRadius: 3, fontSize: 10 }}>{l}</span>
        ))}
      </div>

      {/* Expanded details */}
      {expanded && (
        <div style={{ marginTop: 10, paddingTop: 10, borderTop: '1px solid var(--bd)' }}>
          {ticket.description && (
            <div style={{ fontSize: 12, color: 'var(--tx1)', lineHeight: 1.5, marginBottom: 8, whiteSpace: 'pre-wrap' }}>
              {ticket.description}
            </div>
          )}
          {hasRisk && ticket.risk_reason && (
            <div style={{
              fontSize: 11, fontFamily: 'IBM Plex Mono, monospace', padding: '6px 10px', borderRadius: 6,
              background: `${RISK_COLORS[ticket.risk_level]}10`,
              color: RISK_COLORS[ticket.risk_level],
              border: `1px solid ${RISK_COLORS[ticket.risk_level]}30`,
            }}>
              AI risk analysis: {ticket.risk_reason}
            </div>
          )}
          <div style={{ fontSize: 10, color: 'var(--tx2)', fontFamily: 'IBM Plex Mono, monospace', marginTop: 6 }}>
            synced {new Date(ticket.synced_at).toLocaleString()}
          </div>
        </div>
      )}
    </div>
  )
}
