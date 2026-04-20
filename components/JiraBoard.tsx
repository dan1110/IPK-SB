'use client'
import { useState, useEffect, useCallback } from 'react'
import { RefreshCw } from 'lucide-react'
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
  Medium: 'var(--color-accent)',
  Low: 'var(--green)',
  Lowest: 'var(--tx2)',
}

const STATUS_COLORS: Record<string, string> = {
  'To Do': 'var(--tx2)',
  'In Progress': 'var(--color-accent)',
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
      <div style={{ padding: 'var(--space-4) var(--space-5) var(--space-3)', borderBottom: '1px solid var(--color-border-default)', flexShrink: 0 }}>
        <div style={{ fontSize: 'var(--text-xs)', color: 'var(--tx2)', fontFamily: 'var(--font-mono)', marginBottom: 'var(--space-2-5)' }}>
          PROGRESS · {totalTickets} tickets
        </div>

        {totalTickets > 0 ? (
          <div style={{ display: 'flex', height: 'var(--space-2)', borderRadius: 'var(--radius-sm)', overflow: 'hidden', gap: 'var(--space-0-5)' }}>
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
                    borderRadius: 'var(--radius-xs)',
                    minWidth: 'var(--space-1)',
                    transition: `width var(--duration-fast) var(--ease-default)`,
                  }}
                />
              )
            })}
          </div>
        ) : (
          <div style={{ height: 'var(--space-2)', borderRadius: 'var(--radius-sm)', background: 'var(--bg3)' }} />
        )}

        {/* Status legend */}
        <div style={{ display: 'flex', gap: 'var(--space-3-5)', marginTop: 'var(--space-2)', flexWrap: 'wrap' }}>
          {stats.map(s => (
            <div key={s.status} style={{ display: 'flex', alignItems: 'center', gap: 'var(--space-1)', fontSize: 'var(--text-xs)', color: 'var(--tx1)', fontFamily: 'var(--font-mono)' }}>
              <div style={{ width: 'var(--space-2)', height: 'var(--space-2)', borderRadius: 'var(--radius-xs)', background: STATUS_COLORS[s.status] || 'var(--tx2)' }} />
              {s.status} ({s.count})
            </div>
          ))}
        </div>
      </div>

      {/* Filter bar */}
      <div style={{ padding: 'var(--space-2) var(--space-5)', display: 'flex', gap: 'var(--space-1)', borderBottom: '1px solid var(--color-border-default)', flexShrink: 0 }}>
        {FILTERS.map(f => (
          <button
            key={f.key}
            onClick={() => setFilter(f.key)}
            style={{
              padding: 'var(--space-0-5) var(--space-2-5)', borderRadius: 'var(--radius-md)', fontSize: 'var(--text-xs)', cursor: 'pointer',
              fontFamily: 'var(--font-mono)', transition: 'var(--duration-fast) var(--ease-default)', border: '1px solid',
              background: filter === f.key ? 'var(--blue-bg)' : 'transparent',
              color: filter === f.key ? 'var(--color-accent)' : 'var(--tx2)',
              borderColor: filter === f.key ? 'var(--blue-bd)' : 'transparent',
            }}
          >
            {f.label}
          </button>
        ))}
        <div style={{ flex: 1 }} />
        <button
          onClick={fetchData}
          style={{
            padding: 'var(--space-0-5) var(--space-2-5)', borderRadius: 'var(--radius-md)', fontSize: 'var(--text-xs)', cursor: 'pointer',
            fontFamily: 'var(--font-mono)', background: 'transparent', border: '1px solid var(--color-border-strong)', color: 'var(--tx2)',
            display: 'flex', alignItems: 'center', gap: 'var(--space-1)', transition: 'var(--duration-fast) var(--ease-default)',
          }}
        >
          <RefreshCw size={12} />
        </button>
      </div>

      {/* Ticket list */}
      <div style={{ flex: 1, overflowY: 'auto', padding: 'var(--space-2) var(--space-3)' }}>
        {loading ? (
          <div style={{ padding: 'var(--space-10)', textAlign: 'center', color: 'var(--tx2)', fontSize: 'var(--text-sm)', fontFamily: 'var(--font-mono)' }}>loading...</div>
        ) : filtered.length === 0 ? (
          <div style={{ padding: 'var(--space-10)', textAlign: 'center', color: 'var(--tx2)', fontSize: 'var(--text-sm)', fontFamily: 'var(--font-mono)' }}>
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
        border: '1px solid var(--color-border-default)',
        borderLeft: hasRisk ? `3px solid ${RISK_COLORS[ticket.risk_level] || 'var(--color-border-default)'}` : '1px solid var(--color-border-default)',
        borderRadius: 'var(--radius-lg)',
        padding: 'var(--space-2-5) var(--space-3-5)',
        marginBottom: 'var(--space-1-5)',
        cursor: 'pointer',
        transition: 'var(--duration-fast) var(--ease-default)',
      }}
    >
      {/* Header row */}
      <div style={{ display: 'flex', alignItems: 'center', gap: 'var(--space-2)', marginBottom: 'var(--space-1)' }}>
        <span style={{ fontSize: 'var(--text-xs)', fontFamily: 'var(--font-mono)', color: 'var(--color-accent)', fontWeight: 600 }}>
          {ticket.jira_key}
        </span>
        <span style={{
          fontSize: 'var(--text-xs)', fontFamily: 'var(--font-mono)', padding: 'var(--space-0-5) var(--space-1-5)', borderRadius: 'var(--radius-sm)',
          background: `${STATUS_COLORS[ticket.status] || 'var(--tx2)'}20`,
          color: STATUS_COLORS[ticket.status] || 'var(--tx2)',
        }}>
          {ticket.status}
        </span>
        <span style={{
          fontSize: 'var(--text-xs)', fontFamily: 'var(--font-mono)', padding: 'var(--space-0-5) var(--space-1-5)', borderRadius: 'var(--radius-sm)',
          color: PRIORITY_COLORS[ticket.priority] || 'var(--tx2)',
        }}>
          {ticket.priority}
        </span>
        <div style={{ flex: 1 }} />
        {hasRisk && (
          <span style={{
            fontSize: 'var(--text-xs)', fontFamily: 'var(--font-mono)', padding: 'var(--space-0-5) var(--space-1-5)', borderRadius: 'var(--radius-sm)',
            background: `${RISK_COLORS[ticket.risk_level]}20`,
            color: RISK_COLORS[ticket.risk_level],
            fontWeight: 600,
          }}>
            risk: {ticket.risk_level}
          </span>
        )}
      </div>

      {/* Title */}
      <div style={{ fontSize: 'var(--text-sm)', color: 'var(--tx0)', marginBottom: 'var(--space-1)', lineHeight: 1.4 }}>
        {ticket.title}
      </div>

      {/* Meta row */}
      <div style={{ display: 'flex', alignItems: 'center', gap: 'var(--space-2-5)', fontSize: 'var(--text-xs)', color: 'var(--tx2)', fontFamily: 'var(--font-mono)' }}>
        {ticket.assignee && <span>{ticket.assignee}</span>}
        {ticket.due_date && (
          <span style={{ color: isOverdue ? 'var(--red)' : 'var(--tx2)' }}>
            due {ticket.due_date}{isOverdue ? ' (overdue)' : ''}
          </span>
        )}
        {labels.length > 0 && labels.map(l => (
          <span key={l} style={{ padding: '0 var(--space-1)', background: 'var(--bg3)', borderRadius: 'var(--radius-xs)', fontSize: 'var(--text-xs)' }}>{l}</span>
        ))}
      </div>

      {/* Expanded details */}
      {expanded && (
        <div style={{ marginTop: 'var(--space-2-5)', paddingTop: 'var(--space-2-5)', borderTop: '1px solid var(--color-border-default)' }}>
          {ticket.description && (
            <div style={{ fontSize: 'var(--text-sm)', color: 'var(--tx1)', lineHeight: 1.5, marginBottom: 'var(--space-2)', whiteSpace: 'pre-wrap' }}>
              {ticket.description}
            </div>
          )}
          {hasRisk && ticket.risk_reason && (
            <div style={{
              fontSize: 'var(--text-xs)', fontFamily: 'var(--font-mono)', padding: 'var(--space-1-5) var(--space-2-5)', borderRadius: 'var(--radius-md)',
              background: `${RISK_COLORS[ticket.risk_level]}10`,
              color: RISK_COLORS[ticket.risk_level],
              border: `1px solid ${RISK_COLORS[ticket.risk_level]}30`,
            }}>
              AI risk analysis: {ticket.risk_reason}
            </div>
          )}
          <div style={{ fontSize: 'var(--text-xs)', color: 'var(--tx2)', fontFamily: 'var(--font-mono)', marginTop: 'var(--space-1-5)' }}>
            synced {new Date(ticket.synced_at).toLocaleString()}
          </div>
        </div>
      )}
    </div>
  )
}
