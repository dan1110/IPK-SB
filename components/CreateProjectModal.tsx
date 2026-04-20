'use client'
import { useState, useEffect } from 'react'
import type { User } from '@/lib/types'

interface Props {
  onClose: () => void
  onCreated: () => void
}

const COLORS = ['#4f8ef7', '#3ecf8e', '#f5a623', '#a78bfa', '#f56565', '#38bdf8', '#fb7185']

const INTEGRATION_TYPES = [
  { value: 'slack',   label: 'Slack',         icon: '💬' },
  { value: 'jira',    label: 'Jira',          icon: '📋' },
  { value: 'github',  label: 'GitHub',        icon: '🐙' },
  { value: 'monday',  label: 'Monday',        icon: '📅' },
  { value: 'asana',   label: 'Asana',         icon: '✅' },
  { value: 'trello',  label: 'Trello',        icon: '📌' },
  { value: 'linear',  label: 'Linear',        icon: '📐' },
  { value: 'notion',  label: 'Notion',        icon: '📝' },
  { value: 'drive',   label: 'Google Drive',  icon: '📁' },
  { value: 'custom',  label: 'Custom',        icon: '🔧' },
]

type Step = 'info' | 'tools' | 'members'

export default function CreateProjectModal({ onClose, onCreated }: Props) {
  // Step
  const [step, setStep] = useState<Step>('info')

  // Info
  const [name, setName] = useState('')
  const [color, setColor] = useState(COLORS[0])
  const [workspace, setWorkspace] = useState('')

  // Tools
  const [selectedTools, setSelectedTools] = useState<Set<string>>(new Set())
  const [toolLabels, setToolLabels] = useState<Record<string, string>>({})

  // Members
  const [allUsers, setAllUsers] = useState<User[]>([])
  const [selectedMembers, setSelectedMembers] = useState<{ userId: string; role: 'lead' | 'member' }[]>([])

  const [creating, setCreating] = useState(false)

  useEffect(() => {
    fetch('/api/users').then(r => r.json()).then(data => setAllUsers(Array.isArray(data) ? data : []))
  }, [])

  const availableUsers = allUsers.filter(u => u.role !== 'boss' && !selectedMembers.find(m => m.userId === u.id))

  function toggleTool(type: string) {
    const next = new Set(selectedTools)
    if (next.has(type)) next.delete(type)
    else next.add(type)
    setSelectedTools(next)
  }

  function addMember(userId: string) {
    setSelectedMembers([...selectedMembers, { userId, role: 'member' }])
  }

  function removeMember(userId: string) {
    setSelectedMembers(selectedMembers.filter(m => m.userId !== userId))
  }

  function setMemberRole(userId: string, role: 'lead' | 'member') {
    setSelectedMembers(selectedMembers.map(m => m.userId === userId ? { ...m, role } : m))
  }

  async function create() {
    if (!name.trim()) return
    setCreating(true)

    // 1. Create project
    const projRes = await fetch('/api/projects', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ name: name.trim(), color, slack_workspace: workspace.trim() || undefined }),
    })
    const project = await projRes.json()

    // 2. Add integrations
    for (const type of selectedTools) {
      await fetch('/api/integrations', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          project_id: project.id,
          type,
          label: toolLabels[type] || INTEGRATION_TYPES.find(t => t.value === type)?.label || type,
        }),
      })
    }

    // 3. Assign members
    for (const m of selectedMembers) {
      await fetch('/api/assignments', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ user_id: m.userId, project_id: project.id, role_in_project: m.role }),
      })
    }

    setCreating(false)
    onCreated()
    onClose()
  }

  const initials = (name: string) => name.split(' ').map(w => w[0]).join('').slice(0, 2).toUpperCase()

  const stepStyle = (s: Step): React.CSSProperties => ({
    padding: '6px 16px', borderRadius: 10, fontSize: 12, cursor: 'pointer', border: 'none',
    transition: 'all .15s', fontWeight: step === s ? 600 : 400,
    background: step === s ? 'var(--bg1)' : 'transparent',
    color: step === s ? 'var(--tx0)' : 'var(--tx2)',
    boxShadow: step === s ? 'var(--shadow-card)' : 'none',
  })

  return (
    <div style={{ position: 'fixed', inset: 0, zIndex: 100, display: 'flex', alignItems: 'center', justifyContent: 'center', background: 'rgba(0,0,0,.35)', backdropFilter: 'blur(8px)', WebkitBackdropFilter: 'blur(8px)' }} onClick={onClose}>
      <div onClick={e => e.stopPropagation()} className="animate-scale-in" style={{ width: 560, maxHeight: '80vh', background: 'var(--bg1)', border: 'none', borderRadius: 24, display: 'flex', flexDirection: 'column', overflow: 'hidden', boxShadow: 'var(--shadow-float)' }}>

        {/* Header */}
        <div style={{ padding: '22px 26px', display: 'flex', alignItems: 'center', justifyContent: 'space-between', flexShrink: 0 }}>
          <div style={{ fontSize: 18, fontWeight: 700, color: 'var(--tx0)', letterSpacing: '-0.02em' }}>New Project</div>
          <button onClick={onClose} style={{ background: 'var(--bg3)', border: 'none', color: 'var(--tx2)', cursor: 'pointer', fontSize: 14, width: 30, height: 30, borderRadius: 10, display: 'flex', alignItems: 'center', justifyContent: 'center', transition: 'all .15s' }}
            onMouseEnter={e => { e.currentTarget.style.background = 'var(--red-bg)'; e.currentTarget.style.color = 'var(--red)' }}
            onMouseLeave={e => { e.currentTarget.style.background = 'var(--bg3)'; e.currentTarget.style.color = 'var(--tx2)' }}
          >✕</button>
        </div>

        {/* Step tabs */}
        <div style={{ padding: '0 26px 16px', display: 'flex', gap: 4, flexShrink: 0 }}>
          <div style={{ display: 'flex', gap: 4, background: 'var(--bg3)', borderRadius: 12, padding: 3 }}>
            <button onClick={() => setStep('info')} style={stepStyle('info')}>1. Info</button>
            <button onClick={() => name.trim() && setStep('tools')} style={{ ...stepStyle('tools'), opacity: name.trim() ? 1 : 0.4 }}>2. Tools</button>
            <button onClick={() => name.trim() && setStep('members')} style={{ ...stepStyle('members'), opacity: name.trim() ? 1 : 0.4 }}>3. Members</button>
          </div>
        </div>

        {/* Content */}
        <div style={{ flex: 1, overflowY: 'auto', padding: '4px 26px 20px' }}>

          {/* Step 1: Info */}
          {step === 'info' && (
            <div style={{ display: 'flex', flexDirection: 'column', gap: 18 }}>
              <div>
                <label style={{ fontSize: 11, color: 'var(--tx2)', display: 'block', marginBottom: 8, fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.04em' }}>Project Name *</label>
                <input
                  autoFocus
                  value={name}
                  onChange={e => setName(e.target.value)}
                  placeholder="e.g. client-neopets"
                  style={{ width: '100%', background: 'var(--bg3)', border: 'none', borderRadius: 12, padding: '12px 16px', fontSize: 14, color: 'var(--tx0)', outline: 'none' }}
                />
              </div>
              <div>
                <label style={{ fontSize: 11, color: 'var(--tx2)', display: 'block', marginBottom: 8, fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.04em' }}>Color</label>
                <div style={{ display: 'flex', gap: 10 }}>
                  {COLORS.map(c => (
                    <div key={c} onClick={() => setColor(c)} style={{ width: 32, height: 32, borderRadius: 10, background: c, cursor: 'pointer', border: c === color ? '3px solid var(--tx0)' : '3px solid transparent', transition: 'all .15s' }} />
                  ))}
                </div>
              </div>
              <div>
                <label style={{ fontSize: 11, color: 'var(--tx2)', display: 'block', marginBottom: 8, fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.04em' }}>Slack Workspace (for n8n)</label>
                <input
                  value={workspace}
                  onChange={e => setWorkspace(e.target.value)}
                  placeholder="e.g. neopets.slack.com"
                  style={{ width: '100%', background: 'var(--bg3)', border: 'none', borderRadius: 12, padding: '12px 16px', fontSize: 13, color: 'var(--tx0)', outline: 'none' }}
                />
              </div>
            </div>
          )}

          {/* Step 2: Tools */}
          {step === 'tools' && (
            <div>
              <div style={{ fontSize: 12, color: 'var(--tx1)', marginBottom: 14, fontWeight: 500 }}>Select tools this project will use. You can add more later in project settings.</div>
              <div style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
                {INTEGRATION_TYPES.map(t => {
                  const selected = selectedTools.has(t.value)
                  return (
                    <div key={t.value} style={{
                      display: 'flex', alignItems: 'center', gap: 12, padding: '10px 14px',
                      background: selected ? 'var(--brand-bg)' : 'var(--bg2)',
                      border: 'none',
                      boxShadow: selected ? 'inset 0 0 0 1.5px var(--brand-bd)' : 'inset 0 0 0 1px var(--bd)',
                      borderRadius: 12, cursor: 'pointer', transition: 'all .15s',
                    }} onClick={() => toggleTool(t.value)}>
                      <span style={{ fontSize: 18 }}>{t.icon}</span>
                      <div style={{ flex: 1 }}>
                        {selected ? (
                          <input
                            value={toolLabels[t.value] ?? t.label}
                            onChange={e => { e.stopPropagation(); setToolLabels({ ...toolLabels, [t.value]: e.target.value }) }}
                            onClick={e => e.stopPropagation()}
                            style={{ background: 'var(--bg3)', border: '1px solid var(--bd)', borderRadius: 6, padding: '4px 10px', fontSize: 12, color: 'var(--tx0)', outline: 'none', width: '100%', transition: 'all .15s' }}
                            placeholder="display name"
                          />
                        ) : (
                          <span style={{ fontSize: 13, color: 'var(--tx1)', fontWeight: 500 }}>{t.label}</span>
                        )}
                      </div>
                      <div style={{
                        width: 22, height: 22, borderRadius: 6, border: `2px solid ${selected ? 'var(--brand)' : 'var(--bd2)'}`,
                        background: selected ? 'var(--brand)' : 'transparent',
                        display: 'flex', alignItems: 'center', justifyContent: 'center',
                        fontSize: 12, color: '#fff', flexShrink: 0, transition: 'all .15s',
                      }}>
                        {selected && '✓'}
                      </div>
                    </div>
                  )
                })}
              </div>
            </div>
          )}

          {/* Step 3: Members */}
          {step === 'members' && (
            <div>
              <div style={{ fontSize: 12, color: 'var(--tx1)', marginBottom: 14, fontWeight: 500 }}>Assign team members. You can add more later in project settings.</div>

              {/* Add dropdown */}
              {availableUsers.length > 0 && (
                <div style={{ display: 'flex', gap: 8, marginBottom: 16 }}>
                  <select
                    onChange={e => { if (e.target.value) { addMember(e.target.value); e.target.value = '' } }}
                    defaultValue=""
                    style={{ flex: 1, background: 'var(--bg3)', border: '1px solid var(--bd)', borderRadius: 10, padding: '8px 12px', fontSize: 12, color: 'var(--tx0)', outline: 'none', cursor: 'pointer' }}
                  >
                    <option value="">+ add member...</option>
                    {availableUsers.map(u => (
                      <option key={u.id} value={u.id}>{u.name}{u.title ? ` (${u.title})` : ''}</option>
                    ))}
                  </select>
                </div>
              )}

              {/* Selected members */}
              {selectedMembers.length === 0 && (
                <div style={{ textAlign: 'center', color: 'var(--tx2)', fontSize: 12, fontWeight: 500, marginTop: 30 }}>
                  no members selected yet
                </div>
              )}
              {selectedMembers.map(m => {
                const user = allUsers.find(u => u.id === m.userId)
                if (!user) return null
                return (
                  <div key={m.userId} style={{ display: 'flex', alignItems: 'center', gap: 10, padding: '10px 12px', background: 'var(--bg2)', border: 'none', boxShadow: 'inset 0 0 0 1px var(--bd)', borderRadius: 12, marginBottom: 6, transition: 'all .15s' }}>
                    <div style={{ width: 32, height: 32, borderRadius: 10, background: 'var(--purple-bg)', border: '1.5px solid var(--purple)', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 11, fontWeight: 700, color: 'var(--purple)', flexShrink: 0 }}>
                      {initials(user.name)}
                    </div>
                    <div style={{ flex: 1, minWidth: 0 }}>
                      <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
                        <span style={{ fontSize: 13, fontWeight: 600, color: 'var(--tx0)' }}>{user.name}</span>
                        {user.title && <span style={{ fontSize: 10, color: 'var(--brand)', background: 'var(--brand-bg)', padding: '2px 6px', borderRadius: 4, fontWeight: 600 }}>{user.title}</span>}
                      </div>
                      <div style={{ fontSize: 10, color: 'var(--tx2)', fontWeight: 500 }}>{user.email}</div>
                    </div>
                    <select
                      value={m.role}
                      onChange={e => setMemberRole(m.userId, e.target.value as 'lead' | 'member')}
                      style={{ background: 'var(--bg3)', border: '1px solid var(--bd)', borderRadius: 6, padding: '4px 8px', fontSize: 10, color: 'var(--tx0)', outline: 'none', cursor: 'pointer', fontWeight: 500 }}
                    >
                      <option value="member">member</option>
                      <option value="lead">lead</option>
                    </select>
                    <button onClick={() => removeMember(m.userId)} style={{ background: 'var(--bg3)', border: 'none', color: 'var(--tx2)', cursor: 'pointer', fontSize: 12, width: 24, height: 24, borderRadius: 6, display: 'flex', alignItems: 'center', justifyContent: 'center', transition: 'all .15s' }}
                      onMouseEnter={e => { e.currentTarget.style.background = 'var(--red-bg)'; e.currentTarget.style.color = 'var(--red)' }}
                      onMouseLeave={e => { e.currentTarget.style.background = 'var(--bg3)'; e.currentTarget.style.color = 'var(--tx2)' }}>✕</button>
                  </div>
                )
              })}
            </div>
          )}
        </div>

        {/* Footer */}
        <div style={{ padding: '16px 26px', display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexShrink: 0 }}>
          <div style={{ fontSize: 12, color: 'var(--tx2)' }}>
            {selectedTools.size > 0 && `${selectedTools.size} tool${selectedTools.size > 1 ? 's' : ''}`}
            {selectedTools.size > 0 && selectedMembers.length > 0 && ' · '}
            {selectedMembers.length > 0 && `${selectedMembers.length} member${selectedMembers.length > 1 ? 's' : ''}`}
          </div>
          <div style={{ display: 'flex', gap: 8 }}>
            {step !== 'info' && (
              <button onClick={() => setStep(step === 'members' ? 'tools' : 'info')} style={{ padding: '10px 20px', background: 'var(--bg3)', border: 'none', borderRadius: 12, fontSize: 13, color: 'var(--tx1)', cursor: 'pointer', fontWeight: 500 }}>
                Back
              </button>
            )}
            {step !== 'members' ? (
              <button
                onClick={() => setStep(step === 'info' ? 'tools' : 'members')}
                disabled={!name.trim()}
                style={{ padding: '10px 24px', background: 'var(--brand)', border: 'none', borderRadius: 12, fontSize: 13, color: '#fff', cursor: name.trim() ? 'pointer' : 'not-allowed', fontWeight: 600, opacity: name.trim() ? 1 : 0.4 }}
              >
                Next
              </button>
            ) : (
              <button
                onClick={create}
                disabled={creating || !name.trim()}
                style={{ padding: '10px 24px', background: 'var(--green)', border: 'none', borderRadius: 12, fontSize: 13, color: '#fff', cursor: 'pointer', fontWeight: 600 }}
              >
                {creating ? 'Creating...' : 'Create project'}
              </button>
            )}
          </div>
        </div>
      </div>
    </div>
  )
}
