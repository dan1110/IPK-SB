import { useState, useEffect, useCallback } from 'react'
import { Check, X, ExternalLink, Activity, Clock, Flag, MessageCircle, FolderKanban, Users } from 'lucide-react'
import type { SlackMessage } from '@/lib/types'

interface Overview {
  pending: number
  flagged: number
  replied: number
  totalMessages: number
  projectCount: number
  userCount: number
}

interface ProjectStat {
  id: string
  name: string
  color: string
  slack_workspace: string | null
  pending: number
  flagged: number
  replied: number
  total: number
  members: number
}

interface ActivityEntry {
  id: string
  user_name: string
  user_title: string
  action: string
  target_type: string
  project_name: string | null
  project_color: string | null
  created_at: string
}

interface FlaggedMsg extends SlackMessage {
  project_name: string
  project_color: string
}

interface Props {
  onNavigateProject: (projectId: string) => void
}

export default function BossDashboard({ onNavigateProject }: Props) {
  const [overview, setOverview] = useState<Overview | null>(null)
  const [projects, setProjects] = useState<ProjectStat[]>([])
  const [flagged, setFlagged] = useState<FlaggedMsg[]>([])
  const [activity, setActivity] = useState<ActivityEntry[]>([])
  const [loading, setLoading] = useState(true)

  const load = useCallback(() => {
    fetch('/api/dashboard')
      .then(r => r.json())
      .then(data => {
        setOverview(data.overview)
        setProjects(data.projects || [])
        setFlagged(data.flagged || [])
        setActivity(data.activity || [])
        setLoading(false)
      })
      .catch(() => setLoading(false))
  }, [])

  useEffect(() => { load() }, [load])

  async function approveMsg(id: string) {
    await fetch(`/api/slack-feed/${id}`, { method: 'PATCH', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ action: 'approved' }) })
    load()
  }

  async function rejectMsg(id: string) {
    await fetch(`/api/slack-feed/${id}`, { method: 'PATCH', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ action: 'pending' }) })
    load()
  }

  function timeAgo(ts: string) {
    const diff = Date.now() - new Date(ts).getTime()
    const m = Math.floor(diff / 60000)
    if (m < 1) return 'just now'
    if (m < 60) return `${m}m ago`
    const h = Math.floor(m / 60)
    if (h < 24) return `${h}h ago`
    return `${Math.floor(h / 24)}d ago`
  }

  if (loading) return (
    <div style={{ flex: 1, display: 'flex', alignItems: 'center', justifyContent: 'center', color: 'var(--tx2)', fontSize: 'var(--text-base)' }}>
      loading dashboard...
    </div>
  )

  return (
    <div style={{ flex: 1, overflowY: 'auto', padding: 'var(--space-6) var(--space-8)' }}>

      {/* KPI Stats — horizontal row with icon circles like reference */}
      <div style={{ display: 'flex', gap: 'var(--space-5)', marginBottom: 'var(--space-6)', background: 'var(--bg1)', borderRadius: 'var(--radius-xl)', padding: 'var(--space-6) var(--space-8)', boxShadow: 'var(--shadow-card)' }}>
        <StatCard icon={<Clock size={20} />} label="Pending" value={overview?.pending ?? 0} color="var(--amber)" delta={null} />
        <div style={{ width: 1, background: 'var(--bg3)', flexShrink: 0 }} />
        <StatCard icon={<Flag size={20} />} label="Flagged" value={overview?.flagged ?? 0} color="var(--red)" delta={null} />
        <div style={{ width: 1, background: 'var(--bg3)', flexShrink: 0 }} />
        <StatCard icon={<MessageCircle size={20} />} label="Replied" value={overview?.replied ?? 0} color="var(--green)" delta={null} />
        <div style={{ width: 1, background: 'var(--bg3)', flexShrink: 0 }} />
        <StatCard icon={<FolderKanban size={20} />} label="Projects" value={overview?.projectCount ?? 0} color="var(--brand)" delta={null} />
        <div style={{ width: 1, background: 'var(--bg3)', flexShrink: 0 }} />
        <StatCard icon={<Users size={20} />} label="Team" value={overview?.userCount ?? 0} color="var(--purple)" delta={null} />
      </div>

      <div style={{ display: 'grid', gridTemplateColumns: flagged.length > 0 ? '1fr 1fr' : '1fr', gap: 'var(--space-5)', marginBottom: 'var(--space-6)' }}>

        {/* Flagged queue */}
        {flagged.length > 0 && (
          <div style={{ background: 'var(--bg1)', borderRadius: 'var(--radius-xl)', overflow: 'hidden', boxShadow: 'var(--shadow-card)' }}>
            <div style={{ padding: 'var(--space-5) var(--space-6)', display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
              <span style={{ fontSize: 'var(--text-lg)', fontWeight: 700, color: 'var(--tx0)' }}>Flagged for Review</span>
              <span style={{ fontSize: 'var(--text-sm)', fontWeight: 700, color: 'var(--red)', background: 'var(--red-bg)', padding: 'var(--space-1) var(--space-3)', borderRadius: 'var(--radius-lg)' }}>{flagged.length}</span>
            </div>
            <div style={{ maxHeight: 380, overflowY: 'auto' }}>
              {flagged.map(msg => (
                <div key={msg.id} style={{ padding: 'var(--space-4) var(--space-6)', borderTop: '1px solid var(--bg3)' }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: 'var(--space-2)', marginBottom: 'var(--space-2)' }}>
                    <div style={{ width: 'var(--space-2)', height: 'var(--space-2)', borderRadius: 'var(--radius-full)', background: msg.project_color, flexShrink: 0 }} />
                    <span style={{ fontSize: 'var(--text-sm)', color: 'var(--tx2)', fontWeight: 500 }}>{msg.project_name}</span>
                    <span style={{ marginLeft: 'auto', fontSize: 'var(--text-xs)', color: 'var(--tx2)' }}>{timeAgo(msg.pulled_at)}</span>
                  </div>
                  <div style={{ fontSize: 'var(--text-base)', fontWeight: 600, color: 'var(--tx0)', marginBottom: 'var(--space-1)' }}>{msg.from_name} <span style={{ color: 'var(--tx2)', fontWeight: 400, fontSize: 'var(--text-sm)' }}>{msg.channel}</span></div>
                  <div style={{ fontSize: 'var(--text-sm)', color: 'var(--tx1)', lineHeight: 1.55, display: '-webkit-box', WebkitLineClamp: 2, WebkitBoxOrient: 'vertical', overflow: 'hidden', marginBottom: 'var(--space-3)' }}>{msg.message}</div>
                  {msg.flagged_by && <div style={{ fontSize: 'var(--text-xs)', color: 'var(--amber)', fontWeight: 600, marginBottom: 'var(--space-3)' }}>flagged by employee</div>}
                  <div style={{ display: 'flex', gap: 'var(--space-2)' }}>
                    <button onClick={() => approveMsg(msg.id)} style={{ display: 'flex', alignItems: 'center', gap: 'var(--space-1-5)', padding: 'var(--space-2) var(--space-4)', background: 'var(--green)', border: 'none', borderRadius: 'var(--radius-lg)', fontSize: 'var(--text-sm)', fontWeight: 600, color: '#fff', cursor: 'pointer', transition: `all var(--duration-normal) var(--ease-default)` }}>
                      <Check size={14} /> Approve
                    </button>
                    <button onClick={() => rejectMsg(msg.id)} style={{ display: 'flex', alignItems: 'center', gap: 'var(--space-1-5)', padding: 'var(--space-2) var(--space-4)', background: 'var(--bg3)', border: 'none', borderRadius: 'var(--radius-lg)', fontSize: 'var(--text-sm)', fontWeight: 500, color: 'var(--tx1)', cursor: 'pointer', transition: `all var(--duration-normal) var(--ease-default)` }}>
                      <X size={14} /> Reject
                    </button>
                    <button onClick={() => onNavigateProject(msg.project_id)} style={{ display: 'flex', alignItems: 'center', gap: 'var(--space-1-5)', padding: 'var(--space-2) var(--space-4)', background: 'var(--brand-bg)', border: 'none', borderRadius: 'var(--radius-lg)', fontSize: 'var(--text-sm)', fontWeight: 600, color: 'var(--brand)', cursor: 'pointer', transition: `all var(--duration-normal) var(--ease-default)`, marginLeft: 'auto' }}>
                      <ExternalLink size={14} /> Open
                    </button>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Recent activity */}
        <div style={{ background: 'var(--bg1)', borderRadius: 'var(--radius-xl)', overflow: 'hidden', boxShadow: 'var(--shadow-card)' }}>
          <div style={{ padding: 'var(--space-5) var(--space-6)', display: 'flex', alignItems: 'center', gap: 'var(--space-3)' }}>
            <Activity size={18} color="var(--brand)" />
            <span style={{ fontSize: 'var(--text-lg)', fontWeight: 700, color: 'var(--tx0)' }}>Activity</span>
          </div>
          <div style={{ maxHeight: 380, overflowY: 'auto' }}>
            {activity.length === 0 && (
              <div style={{ padding: 'var(--space-12) var(--space-6)', textAlign: 'center', color: 'var(--tx2)', fontSize: 'var(--text-sm)' }}>no activity yet</div>
            )}
            {activity.map(a => (
              <div key={a.id} style={{ padding: 'var(--space-3) var(--space-6)', borderTop: '1px solid var(--bg3)', display: 'flex', alignItems: 'center', gap: 'var(--space-3)' }}>
                <div style={{ width: 'var(--space-8)', height: 'var(--space-8)', borderRadius: 'var(--radius-lg)', background: 'var(--bg3)', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 'var(--text-xs)', fontWeight: 700, color: 'var(--tx1)', flexShrink: 0 }}>
                  {a.user_name?.split(' ').map((w: string) => w[0]).join('').slice(0, 2).toUpperCase()}
                </div>
                <div style={{ flex: 1, minWidth: 0 }}>
                  <div style={{ fontSize: 'var(--text-sm)', color: 'var(--tx0)' }}>
                    <span style={{ fontWeight: 600 }}>{a.user_name}</span>
                    <span style={{ color: 'var(--tx2)' }}> {a.action}</span>
                  </div>
                  {a.project_name && (
                    <div style={{ display: 'flex', alignItems: 'center', gap: 'var(--space-1-5)', marginTop: 'var(--space-0-5)' }}>
                      <div style={{ width: 'var(--space-1-5)', height: 'var(--space-1-5)', borderRadius: 'var(--radius-full)', background: a.project_color || 'var(--tx2)' }} />
                      <span style={{ fontSize: 'var(--text-xs)', color: 'var(--tx2)' }}>{a.project_name}</span>
                    </div>
                  )}
                </div>
                <span style={{ fontSize: 'var(--text-xs)', color: 'var(--tx2)', flexShrink: 0 }}>{timeAgo(a.created_at)}</span>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* Projects overview */}
      <div style={{ marginBottom: 'var(--space-6)' }}>
        <div style={{ fontSize: 'var(--text-lg)', fontWeight: 700, color: 'var(--tx0)', marginBottom: 'var(--space-4)', letterSpacing: 'var(--tracking-tight)' }}>Projects Overview</div>
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(280px, 1fr))', gap: 'var(--space-4)' }}>
          {projects.map(p => {
            const total = p.pending + p.flagged + p.replied
            return (
              <div
                key={p.id}
                onClick={() => onNavigateProject(p.id)}
                style={{ background: 'var(--bg1)', borderRadius: 'var(--radius-xl)', padding: 'var(--space-6)', cursor: 'pointer', transition: `box-shadow var(--duration-normal) var(--ease-default)`, boxShadow: 'var(--shadow-card)' }}
                onMouseEnter={e => { e.currentTarget.style.boxShadow = 'var(--shadow-card-hover)' }}
                onMouseLeave={e => { e.currentTarget.style.boxShadow = 'var(--shadow-card)' }}
              >
                <div style={{ display: 'flex', alignItems: 'center', gap: 'var(--space-3)', marginBottom: 'var(--space-4)' }}>
                  <div style={{ width: 'var(--space-10)', height: 'var(--space-10)', borderRadius: 'var(--radius-xl)', background: p.color + '18', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
                    <div style={{ width: 'var(--space-3)', height: 'var(--space-3)', borderRadius: 'var(--radius-full)', background: p.color }} />
                  </div>
                  <div style={{ flex: 1 }}>
                    <span style={{ fontSize: 'var(--text-md)', fontWeight: 700, color: 'var(--tx0)', display: 'block', letterSpacing: 'var(--tracking-normal)' }}>{p.name}</span>
                    {p.members > 0 && <span style={{ fontSize: 'var(--text-xs)', color: 'var(--tx2)' }}>{p.members} members</span>}
                  </div>
                </div>

                {total > 0 ? (
                  <>
                    <div style={{ display: 'flex', height: 'var(--space-1-5)', borderRadius: 'var(--radius-full)', overflow: 'hidden', background: 'var(--bg3)', marginBottom: 'var(--space-3)' }}>
                      {p.replied > 0 && <div style={{ width: `${(p.replied / total) * 100}%`, background: 'var(--green)', transition: `width var(--duration-normal) var(--ease-default)` }} />}
                      {p.pending > 0 && <div style={{ width: `${(p.pending / total) * 100}%`, background: 'var(--amber)', transition: `width var(--duration-normal) var(--ease-default)` }} />}
                      {p.flagged > 0 && <div style={{ width: `${(p.flagged / total) * 100}%`, background: 'var(--red)', transition: `width var(--duration-normal) var(--ease-default)` }} />}
                    </div>
                    <div style={{ display: 'flex', gap: 'var(--space-4)', fontSize: 'var(--text-sm)', fontWeight: 600 }}>
                      {p.pending > 0 && <span style={{ color: 'var(--amber)' }}>{p.pending} pending</span>}
                      {p.flagged > 0 && <span style={{ color: 'var(--red)' }}>{p.flagged} flagged</span>}
                      {p.replied > 0 && <span style={{ color: 'var(--green)' }}>{p.replied} replied</span>}
                    </div>
                  </>
                ) : (
                  <div style={{ fontSize: 'var(--text-sm)', color: 'var(--tx2)' }}>{p.slack_workspace ? 'no messages yet' : 'no slack connected'}</div>
                )}
              </div>
            )
          })}
        </div>
      </div>
    </div>
  )
}

function StatCard({ icon, label, value, color, delta }: { icon: React.ReactNode; label: string; value: number; color: string; delta: string | null }) {
  return (
    <div style={{ flex: 1, display: 'flex', alignItems: 'center', gap: 'var(--space-3)' }}>
      <div style={{ width: 'var(--space-12)', height: 'var(--space-12)', borderRadius: 'var(--radius-xl)', background: color + '12', display: 'flex', alignItems: 'center', justifyContent: 'center', color, flexShrink: 0 }}>
        {icon}
      </div>
      <div>
        <div style={{ fontSize: 'var(--text-sm)', color: 'var(--tx2)', fontWeight: 500, marginBottom: 'var(--space-0-5)' }}>{label}</div>
        <div style={{ fontSize: 'var(--text-2xl)', fontWeight: 800, color: 'var(--tx0)', letterSpacing: 'var(--tracking-tight)', lineHeight: 1 }}>{value}</div>
      </div>
    </div>
  )
}
