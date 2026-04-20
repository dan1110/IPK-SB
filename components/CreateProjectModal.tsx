'use client'
import { useState, useEffect } from 'react'
import { MessageSquare, ClipboardList, GitBranch, Calendar, CheckCircle, Pin, Ruler, FileEdit, FolderOpen, Wrench, X, Check } from 'lucide-react'
import type { User } from '@/lib/types'

interface Props {
  onClose: () => void
  onCreated: () => void
}

const COLORS = ['#4f8ef7', '#3ecf8e', '#f5a623', '#a78bfa', '#f56565', '#38bdf8', '#fb7185']

const INTEGRATION_TYPES = [
  { value: 'slack',   label: 'Slack',         icon: MessageSquare },
  { value: 'jira',    label: 'Jira',          icon: ClipboardList },
  { value: 'github',  label: 'GitHub',        icon: GitBranch },
  { value: 'monday',  label: 'Monday',        icon: Calendar },
  { value: 'asana',   label: 'Asana',         icon: CheckCircle },
  { value: 'trello',  label: 'Trello',        icon: Pin },
  { value: 'linear',  label: 'Linear',        icon: Ruler },
  { value: 'notion',  label: 'Notion',        icon: FileEdit },
  { value: 'drive',   label: 'Google Drive',  icon: FolderOpen },
  { value: 'custom',  label: 'Custom',        icon: Wrench },
]

export default function CreateProjectModal({ onClose, onCreated }: Props) {
  // Info
  const [name, setName] = useState('')
  const [color, setColor] = useState(COLORS[0])

  // Tools
  const [selectedTools, setSelectedTools] = useState<Set<string>>(new Set())
  const [toolLabels, setToolLabels] = useState<Record<string, string>>({})
  const [isDropdownOpen, setIsDropdownOpen] = useState(false)

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
      body: JSON.stringify({ name: name.trim(), color }),
    })
    const project = await projRes.json()

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

  return (
    <div style={{ position: 'fixed', inset: 0, zIndex: 100, display: 'flex', alignItems: 'center', justifyContent: 'center', background: 'rgba(0,0,0,.35)', backdropFilter: 'blur(8px)', WebkitBackdropFilter: 'blur(8px)' }} onClick={onClose}>
      <div onClick={e => e.stopPropagation()} className="animate-scale-in" style={{ width: 640, maxHeight: '90vh', background: 'var(--bg1)', border: 'none', borderRadius: 'var(--radius-xl)', display: 'flex', flexDirection: 'column', overflow: 'hidden', boxShadow: 'var(--shadow-float)' }}>

        {/* Header */}
        <div style={{ padding: 'var(--space-4) var(--space-6)', display: 'flex', alignItems: 'center', justifyContent: 'space-between', flexShrink: 0, borderBottom: '1px solid var(--bd)' }}>
          <div style={{ fontSize: 'var(--text-lg)', fontWeight: 700, color: 'var(--tx0)', letterSpacing: 'var(--tracking-tight)' }}>New Project</div>
          <button onClick={onClose} className="close-btn" style={{ background: 'var(--bg3)', border: 'none', color: 'var(--tx2)', cursor: 'pointer', width: 30, height: 30, borderRadius: 'var(--radius-lg)', display: 'flex', alignItems: 'center', justifyContent: 'center', transition: 'all var(--duration-fast) var(--ease-default)' }}>
            <X size={16} />
          </button>
        </div>

        {/* Content */}
        <div style={{ flex: 1, overflowY: 'auto', padding: 'var(--space-6)', display: 'flex', flexDirection: 'column', gap: 'var(--space-6)' }}>

          {/* Info Section */}
          <div style={{ display: 'flex', flexDirection: 'column', gap: 'var(--space-4)' }}>
            <div>
              <label style={{ fontSize: 'var(--text-xs)', color: 'var(--tx2)', display: 'block', marginBottom: 'var(--space-2)', fontWeight: 700, textTransform: 'uppercase', letterSpacing: 'var(--tracking-wide)' }}>Project Name *</label>
              <input
                autoFocus
                value={name}
                onChange={e => setName(e.target.value)}
                placeholder="e.g. client-neopets"
                style={{ width: '100%', background: 'var(--bg3)', border: 'none', borderRadius: 'var(--radius-xl)', padding: 'var(--space-3) var(--space-4)', fontSize: 'var(--text-base)', color: 'var(--tx0)', outline: 'none' }}
              />
            </div>
            
            <div style={{ display: 'grid', gridTemplateColumns: '1fr', gap: 'var(--space-6)' }}>
              <div>
                <label style={{ fontSize: 'var(--text-xs)', color: 'var(--tx2)', display: 'block', marginBottom: 'var(--space-2)', fontWeight: 700, textTransform: 'uppercase', letterSpacing: 'var(--tracking-wide)' }}>Color</label>
                <div style={{ display: 'flex', gap: 'var(--space-1)', background: 'var(--bg3)', padding: 'var(--space-1)', borderRadius: 'var(--radius-lg)' }}>
                  {COLORS.map(c => (
                    <div key={c} onClick={() => setColor(c)} style={{ flex: 1, aspectRatio: '1', borderRadius: 'var(--radius-md)', background: c, cursor: 'pointer', border: c === color ? '2px solid var(--bg3)' : '2px solid transparent', boxShadow: c === color ? '0 0 0 2px var(--tx0)' : 'none', transition: 'all var(--duration-fast) var(--ease-default)' }} />
                  ))}
                </div>
              </div>
            </div>
          </div>

          <div style={{ height: 1, background: 'var(--bd)', margin: 'var(--space-2) 0' }} />

          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 'var(--space-8)' }}>
            {/* Tools Section */}
            <div style={{ display: 'flex', flexDirection: 'column' }}>
              <label style={{ fontSize: 'var(--text-sm)', color: 'var(--tx0)', display: 'block', marginBottom: 'var(--space-1)', fontWeight: 600 }}>Tools</label>
              <div style={{ fontSize: 'var(--text-xs)', color: 'var(--tx2)', marginBottom: 'var(--space-4)' }}>Select tools this project will use.</div>
              {/* Tool Selection Dropdown */}
              {/* Tool Selection Custom Dropdown */}
              <div style={{ position: 'relative', marginBottom: 'var(--space-3)' }}>
                <div
                  onClick={() => setIsDropdownOpen(!isDropdownOpen)}
                  style={{ width: '100%', background: 'var(--bg3)', border: '1px solid var(--bd)', borderRadius: 'var(--radius-lg)', padding: 'var(--space-2) var(--space-3)', fontSize: 'var(--text-sm)', color: 'var(--tx0)', cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'space-between', transition: 'var(--duration-fast)' }}
                >
                  <span style={{ fontSize: 'var(--text-xs)', fontWeight: 500, color: 'var(--tx1)' }}>+ Add app or tool...</span>
                  <span style={{ fontSize: '10px', color: 'var(--tx2)' }}>▼</span>
                </div>
                
                {isDropdownOpen && (
                  <div style={{ position: 'absolute', top: 'calc(100% + 4px)', left: 0, right: 0, background: 'var(--bg2)', border: '1px solid var(--bd)', borderRadius: 'var(--radius-lg)', padding: 'var(--space-1)', zIndex: 10, boxShadow: 'var(--shadow-float)', maxHeight: 200, overflowY: 'auto' }}>
                    {INTEGRATION_TYPES.filter(t => !selectedTools.has(t.value)).map(t => (
                      <div
                        key={t.value}
                        onClick={() => { 
                          const next = new Set(selectedTools); next.add(t.value); setSelectedTools(next); 
                          setIsDropdownOpen(false) 
                        }}
                        style={{ padding: 'var(--space-2) var(--space-3)', display: 'flex', alignItems: 'center', gap: 'var(--space-3)', cursor: 'pointer', borderRadius: 'var(--radius-md)', transition: 'background var(--duration-fast)' }}
                        onMouseEnter={e => e.currentTarget.style.background = 'var(--bg3)'}
                        onMouseLeave={e => e.currentTarget.style.background = 'transparent'}
                      >
                        <t.icon size={14} color="var(--brand)" />
                        <span style={{ fontSize: 'var(--text-sm)', color: 'var(--tx0)', fontWeight: 500 }}>{t.label}</span>
                      </div>
                    ))}
                  </div>
                )}
              </div>

              {/* Selected Tools List */}
              <div style={{ display: 'flex', flexDirection: 'column', gap: 'var(--space-1)', flex: 1, overflowY: 'auto', paddingRight: 'var(--space-2)' }}>
                {selectedTools.size === 0 && (
                  <div style={{ textAlign: 'center', color: 'var(--tx2)', fontSize: 'var(--text-xs)', fontWeight: 500, padding: 'var(--space-4) 0', background: 'var(--bg2)', borderRadius: 'var(--radius-lg)', border: '1px dashed var(--bd)' }}>
                    No tools selected yet
                  </div>
                )}
                {Array.from(selectedTools).map(type => {
                  const t = INTEGRATION_TYPES.find(x => x.value === type)
                  if (!t) return null
                  const IconComponent = t.icon
                  return (
                    <div key={t.value} style={{
                      display: 'flex', alignItems: 'center', gap: 'var(--space-3)', padding: 'var(--space-2) var(--space-3)',
                      background: 'var(--bg2)',
                      border: 'none',
                      borderRadius: 'var(--radius-lg)', transition: 'all var(--duration-fast) var(--ease-default)',
                      boxShadow: 'inset 0 0 0 1px var(--bd)'
                    }}>
                      <span style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', color: 'var(--tx1)' }}><IconComponent size={14} /></span>
                      <div style={{ flex: 1 }}>
                        <input
                          value={toolLabels[t.value] ?? ''}
                          onChange={e => setToolLabels({ ...toolLabels, [t.value]: e.target.value })}
                          placeholder={`Configure ${t.label}... (e.g. Workspace URL)`}
                          style={{ width: '100%', background: 'var(--bg3)', border: 'none', borderRadius: 'var(--radius-md)', padding: '4px var(--space-2)', fontSize: 'var(--text-xs)', color: 'var(--tx0)', outline: 'none' }}
                        />
                      </div>
                      <button onClick={() => {
                        const next = new Set(selectedTools)
                        next.delete(t.value)
                        setSelectedTools(next)
                      }} className="close-btn" style={{ background: 'transparent', border: 'none', color: 'var(--tx2)', cursor: 'pointer', width: 24, height: 24, borderRadius: 'var(--radius-md)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                        <X size={14} />
                      </button>
                    </div>
                  )
                })}
              </div>
            </div>

            {/* Members Section */}
            <div style={{ display: 'flex', flexDirection: 'column' }}>
              <label style={{ fontSize: 'var(--text-sm)', color: 'var(--tx0)', display: 'block', marginBottom: 'var(--space-1)', fontWeight: 600 }}>Members</label>
              <div style={{ fontSize: 'var(--text-xs)', color: 'var(--tx2)', marginBottom: 'var(--space-4)' }}>Assign team members to this project.</div>
              
              {availableUsers.length > 0 && (
                <div style={{ display: 'flex', gap: 'var(--space-2)', marginBottom: 'var(--space-3)' }}>
                  <select
                    onChange={e => { if (e.target.value) { addMember(e.target.value); e.target.value = '' } }}
                    defaultValue=""
                    style={{ flex: 1, background: 'var(--bg3)', border: '1px solid var(--bd)', borderRadius: 'var(--radius-lg)', padding: 'var(--space-2) var(--space-3)', fontSize: 'var(--text-xs)', color: 'var(--tx0)', outline: 'none', cursor: 'pointer', transition: 'all var(--duration-fast) var(--ease-default)' }}
                  >
                    <option value="">+ Add member...</option>
                    {availableUsers.map(u => (
                      <option key={u.id} value={u.id}>{u.name}{u.title ? ` (${u.title})` : ''}</option>
                    ))}
                  </select>
                </div>
              )}

              <div style={{ display: 'flex', flexDirection: 'column', gap: 'var(--space-1)', flex: 1, overflowY: 'auto' }}>
                {selectedMembers.length === 0 && (
                  <div style={{ textAlign: 'center', color: 'var(--tx2)', fontSize: 'var(--text-xs)', fontWeight: 500, padding: 'var(--space-4) 0', background: 'var(--bg2)', borderRadius: 'var(--radius-lg)', border: '1px dashed var(--bd)' }}>
                    No members selected yet
                  </div>
                )}
                {selectedMembers.map(m => {
                  const user = allUsers.find(u => u.id === m.userId)
                  if (!user) return null
                  return (
                    <div key={m.userId} style={{ display: 'flex', alignItems: 'center', gap: 'var(--space-2)', padding: 'var(--space-2) var(--space-3)', background: 'var(--bg2)', borderRadius: 'var(--radius-lg)', boxShadow: 'inset 0 0 0 1px var(--bd)', transition: 'all var(--duration-fast) var(--ease-default)' }}>
                      <div style={{ width: 24, height: 24, borderRadius: 'var(--radius-md)', background: 'var(--purple-bg)', border: '1.5px solid var(--purple)', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 9, fontWeight: 800, color: 'var(--purple)', flexShrink: 0 }}>
                        {initials(user.name)}
                      </div>
                      <div style={{ flex: 1, minWidth: 0, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                        <div style={{ fontSize: 'var(--text-sm)', fontWeight: 600, color: 'var(--tx0)' }}>{user.name}</div>
                      </div>
                      <select
                        value={m.role}
                        onChange={e => setMemberRole(m.userId, e.target.value as 'lead' | 'member')}
                        style={{ background: 'var(--bg3)', border: '1px solid var(--bd)', borderRadius: 'var(--radius-md)', padding: '2px var(--space-1)', fontSize: 11, color: 'var(--tx0)', outline: 'none', cursor: 'pointer', fontWeight: 600 }}
                      >
                        <option value="member">Member</option>
                        <option value="lead">Lead</option>
                      </select>
                      <button onClick={() => removeMember(m.userId)} className="close-btn" style={{ background: 'transparent', border: 'none', color: 'var(--tx2)', cursor: 'pointer', width: 24, height: 24, borderRadius: 'var(--radius-md)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                        <X size={14} />
                      </button>
                    </div>
                  )
                })}
              </div>
            </div>
          </div>
        </div>

        {/* Footer */}
        <div style={{ padding: 'var(--space-4) var(--space-6)', display: 'flex', justifyContent: 'flex-end', borderTop: '1px solid var(--bd)', flexShrink: 0, background: 'var(--bg2)' }}>
          <div style={{ display: 'flex', gap: 'var(--space-3)' }}>
            <button onClick={onClose} style={{ padding: 'var(--space-2) var(--space-5)', background: 'transparent', border: 'none', borderRadius: 'var(--radius-lg)', fontSize: 'var(--text-sm)', color: 'var(--tx1)', cursor: 'pointer', fontWeight: 600 }}>
              Cancel
            </button>
            <button
              onClick={create}
              disabled={creating || !name.trim()}
              style={{ padding: 'var(--space-2) var(--space-6)', background: 'var(--brand)', border: 'none', borderRadius: 'var(--radius-lg)', fontSize: 'var(--text-sm)', color: '#fff', cursor: name.trim() ? 'pointer' : 'not-allowed', fontWeight: 600, opacity: name.trim() ? 1 : 0.4, transition: 'all var(--duration-fast) var(--ease-default)' }}
            >
              {creating ? 'Creating...' : 'Create Project'}
            </button>
          </div>
        </div>
      </div>
    </div>
  )
}
