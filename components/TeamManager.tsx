'use client'
import { useState, useEffect, useCallback } from 'react'
import type { User, ProjectAssignment, UserRole } from '@/lib/types'

interface Props {
  projectId: string
}

const ROLE_COLORS: Record<string, { bg: string; color: string; bd: string }> = {
  boss:     { bg: 'var(--red-bg)',    color: 'var(--red)',    bd: 'var(--red-bd)' },
  lead:     { bg: 'var(--amber-bg)',  color: 'var(--amber)',  bd: 'var(--amber-bd)' },
  employee: { bg: 'var(--purple-bg)', color: 'var(--purple)', bd: 'var(--purple)' },
  member:   { bg: 'var(--blue-bg)',   color: 'var(--blue)',   bd: 'var(--blue-bd)' },
}

const TITLES = ['BE', 'FE', 'BA', 'QC', 'PM', 'Designer', 'DevOps', 'Fullstack', 'Mobile', 'Data', 'Other']

type AddMode = 'select' | 'create'

export default function TeamManager({ projectId }: Props) {
  const [assignments, setAssignments] = useState<(ProjectAssignment & { user_name: string; user_role: UserRole; title?: string })[]>([])
  const [allUsers, setAllUsers] = useState<User[]>([])
  const [showAdd, setShowAdd] = useState(false)
  const [addMode, setAddMode] = useState<AddMode>('select')
  const [selectedUserId, setSelectedUserId] = useState('')
  const [selectedRole, setSelectedRole] = useState<'lead' | 'member'>('member')
  // New user form
  const [newName, setNewName] = useState('')
  const [newEmail, setNewEmail] = useState('')
  const [newTitle, setNewTitle] = useState('')
  const [loading, setLoading] = useState(false)

  const load = useCallback(() => {
    fetch(`/api/assignments?project_id=${projectId}`)
      .then(r => r.json())
      .then(data => setAssignments(Array.isArray(data) ? data : []))
    fetch('/api/users')
      .then(r => r.json())
      .then(data => setAllUsers(Array.isArray(data) ? data : []))
  }, [projectId])

  useEffect(() => { load() }, [load])

  const assignedUserIds = new Set(assignments.map(a => a.user_id))
  const availableUsers = allUsers.filter(u => !assignedUserIds.has(u.id) && u.role !== 'boss')

  async function assign() {
    if (!selectedUserId) return
    setLoading(true)
    await fetch('/api/assignments', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ user_id: selectedUserId, project_id: projectId, role_in_project: selectedRole }),
    })
    resetAdd()
    load()
  }

  async function createAndAssign() {
    if (!newName.trim() || !newEmail.trim()) return
    setLoading(true)
    // Create user
    const res = await fetch('/api/users', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ name: newName.trim(), email: newEmail.trim(), role: 'employee', title: newTitle }),
    })
    const newUser = await res.json()
    if (newUser.error) { alert(newUser.error); setLoading(false); return }
    // Assign to project
    await fetch('/api/assignments', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ user_id: newUser.id, project_id: projectId, role_in_project: selectedRole }),
    })
    resetAdd()
    load()
  }

  function resetAdd() {
    setShowAdd(false)
    setSelectedUserId('')
    setSelectedRole('member')
    setAddMode('select')
    setNewName('')
    setNewEmail('')
    setNewTitle('')
    setLoading(false)
  }

  async function remove(userId: string) {
    await fetch(`/api/assignments?user_id=${userId}&project_id=${projectId}`, { method: 'DELETE' })
    load()
  }

  const initials = (name: string) => name.split(' ').map(w => w[0]).join('').slice(0, 2).toUpperCase()

  return (
    <div style={{ flex: 1, display: 'flex', flexDirection: 'column', overflow: 'hidden' }}>
      {/* Header */}
      <div style={{ padding: '14px 18px', borderBottom: '1px solid var(--bd)', display: 'flex', alignItems: 'center', justifyContent: 'space-between', flexShrink: 0 }}>
        <div>
          <div style={{ fontSize: 14, fontWeight: 600, color: 'var(--tx0)' }}>Team Management</div>
          <div style={{ fontSize: 11, color: 'var(--tx2)', fontFamily: 'IBM Plex Mono, monospace', marginTop: 2 }}>
            {assignments.length} member{assignments.length !== 1 ? 's' : ''} assigned
          </div>
        </div>
        {!showAdd && (
          <button
            onClick={() => setShowAdd(true)}
            style={{ padding: '6px 14px', background: 'var(--blue)', border: 'none', borderRadius: 6, fontSize: 12, color: '#fff', cursor: 'pointer', fontFamily: 'IBM Plex Mono, monospace', fontWeight: 500 }}
          >
            + add member
          </button>
        )}
      </div>

      {/* Add member form */}
      {showAdd && (
        <div style={{ padding: '12px 18px', borderBottom: '1px solid var(--bd)', background: 'var(--bg2)' }}>
          {/* Mode toggle */}
          <div style={{ display: 'flex', gap: 4, marginBottom: 10 }}>
            <button onClick={() => setAddMode('select')} style={{
              padding: '4px 12px', borderRadius: 5, fontSize: 11, cursor: 'pointer', border: '1px solid',
              fontFamily: 'IBM Plex Mono, monospace',
              background: addMode === 'select' ? 'var(--blue-bg)' : 'var(--bg3)',
              color: addMode === 'select' ? 'var(--blue)' : 'var(--tx1)',
              borderColor: addMode === 'select' ? 'var(--blue-bd)' : 'var(--bd)',
            }}>existing user</button>
            <button onClick={() => setAddMode('create')} style={{
              padding: '4px 12px', borderRadius: 5, fontSize: 11, cursor: 'pointer', border: '1px solid',
              fontFamily: 'IBM Plex Mono, monospace',
              background: addMode === 'create' ? 'var(--green-bg)' : 'var(--bg3)',
              color: addMode === 'create' ? 'var(--green)' : 'var(--tx1)',
              borderColor: addMode === 'create' ? 'var(--green-bd)' : 'var(--bd)',
            }}>+ new employee</button>
          </div>

          {addMode === 'select' ? (
            /* Select existing user */
            <div style={{ display: 'flex', gap: 8 }}>
              <select
                value={selectedUserId}
                onChange={e => setSelectedUserId(e.target.value)}
                style={{ flex: 1, background: 'var(--bg3)', border: '1px solid var(--bd)', borderRadius: 6, padding: '6px 10px', fontSize: 12, color: 'var(--tx0)', outline: 'none', cursor: 'pointer' }}
              >
                <option value="">select employee...</option>
                {availableUsers.map(u => (
                  <option key={u.id} value={u.id}>{u.name}{u.title ? ` (${u.title})` : ''} — {u.role}</option>
                ))}
              </select>
              <select
                value={selectedRole}
                onChange={e => setSelectedRole(e.target.value as 'lead' | 'member')}
                style={{ width: 100, background: 'var(--bg3)', border: '1px solid var(--bd)', borderRadius: 6, padding: '6px 10px', fontSize: 12, color: 'var(--tx0)', outline: 'none', fontFamily: 'IBM Plex Mono, monospace', cursor: 'pointer' }}
              >
                <option value="member">member</option>
                <option value="lead">lead</option>
              </select>
            </div>
          ) : (
            /* Create new user */
            <>
              <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap' }}>
                <input
                  autoFocus
                  value={newName}
                  onChange={e => setNewName(e.target.value)}
                  placeholder="Full name"
                  style={{ flex: 1, minWidth: 140, background: 'var(--bg3)', border: '1px solid var(--bd)', borderRadius: 6, padding: '6px 10px', fontSize: 12, color: 'var(--tx0)', outline: 'none' }}
                />
                <input
                  value={newEmail}
                  onChange={e => setNewEmail(e.target.value)}
                  placeholder="email@solidbytes.vn"
                  style={{ flex: 1, minWidth: 180, background: 'var(--bg3)', border: '1px solid var(--bd)', borderRadius: 6, padding: '6px 10px', fontSize: 12, color: 'var(--tx0)', outline: 'none', fontFamily: 'IBM Plex Mono, monospace' }}
                />
                <select
                  value={selectedRole}
                  onChange={e => setSelectedRole(e.target.value as 'lead' | 'member')}
                  style={{ width: 100, background: 'var(--bg3)', border: '1px solid var(--bd)', borderRadius: 6, padding: '6px 10px', fontSize: 12, color: 'var(--tx0)', outline: 'none', fontFamily: 'IBM Plex Mono, monospace', cursor: 'pointer' }}
                >
                  <option value="member">member</option>
                  <option value="lead">lead</option>
                </select>
              </div>
              <div style={{ marginTop: 8 }}>
                <label style={{ fontSize: 10, color: 'var(--tx2)', fontFamily: 'IBM Plex Mono, monospace', display: 'block', marginBottom: 3 }}>Position</label>
                <div style={{ display: 'flex', gap: 4, flexWrap: 'wrap' }}>
                  {TITLES.map(t => (
                    <button
                      key={t}
                      onClick={() => setNewTitle(newTitle === t ? '' : t)}
                      style={{
                        padding: '3px 8px', borderRadius: 4, fontSize: 10, cursor: 'pointer', border: '1px solid',
                        fontFamily: 'IBM Plex Mono, monospace',
                        background: newTitle === t ? 'var(--blue-bg)' : 'var(--bg3)',
                        color: newTitle === t ? 'var(--blue)' : 'var(--tx1)',
                        borderColor: newTitle === t ? 'var(--blue-bd)' : 'var(--bd)',
                      }}
                    >
                      {t}
                    </button>
                  ))}
                </div>
              </div>
            </>
          )}

          <div style={{ display: 'flex', gap: 6, marginTop: 10 }}>
            <button
              onClick={addMode === 'select' ? assign : createAndAssign}
              disabled={loading || (addMode === 'select' ? !selectedUserId : !newName.trim() || !newEmail.trim())}
              style={{
                padding: '6px 16px', border: 'none', borderRadius: 6, fontSize: 12, color: '#fff', cursor: 'pointer',
                fontFamily: 'IBM Plex Mono, monospace',
                background: addMode === 'select' ? 'var(--blue)' : 'var(--green)',
                opacity: (addMode === 'select' ? selectedUserId : newName.trim() && newEmail.trim()) ? 1 : 0.5,
              }}
            >
              {loading ? '...' : addMode === 'select' ? 'assign' : 'create & assign'}
            </button>
            <button
              onClick={resetAdd}
              style={{ padding: '6px 12px', background: 'transparent', border: '1px solid var(--bd)', borderRadius: 6, fontSize: 12, color: 'var(--tx1)', cursor: 'pointer' }}
            >
              cancel
            </button>
          </div>
        </div>
      )}

      {/* Team list */}
      <div style={{ flex: 1, overflowY: 'auto', padding: '8px 12px' }}>
        {assignments.length === 0 && !showAdd && (
          <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', gap: 8, color: 'var(--tx2)', marginTop: 60 }}>
            <div style={{ fontSize: 28 }}>👥</div>
            <span style={{ fontSize: 12, fontFamily: 'IBM Plex Mono, monospace' }}>no members assigned</span>
            <span style={{ fontSize: 11, color: 'var(--tx2)' }}>click "+ add member" to assign employees</span>
          </div>
        )}
        {assignments.map(a => {
          const rc = ROLE_COLORS[a.role_in_project] || ROLE_COLORS.member
          const urc = ROLE_COLORS[a.user_role || 'employee']
          const user = allUsers.find(u => u.id === a.user_id)
          return (
            <div
              key={a.id}
              style={{ display: 'flex', alignItems: 'center', gap: 10, padding: '10px 12px', background: 'var(--bg2)', border: '1px solid var(--bd)', borderRadius: 8, marginBottom: 6 }}
            >
              <div style={{ width: 32, height: 32, borderRadius: '50%', background: urc.bg, border: `1px solid ${urc.color}`, display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 11, fontWeight: 600, color: urc.color, flexShrink: 0 }}>
                {initials(a.user_name || '??')}
              </div>
              <div style={{ flex: 1, minWidth: 0 }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
                  <span style={{ fontSize: 13, fontWeight: 500, color: 'var(--tx0)' }}>{a.user_name}</span>
                  {user?.title && (
                    <span style={{ fontSize: 10, fontFamily: 'IBM Plex Mono, monospace', color: 'var(--blue)', background: 'var(--blue-bg)', padding: '1px 6px', borderRadius: 3, border: '1px solid var(--blue-bd)' }}>
                      {user.title}
                    </span>
                  )}
                </div>
                <div style={{ fontSize: 11, color: 'var(--tx2)', fontFamily: 'IBM Plex Mono, monospace' }}>{a.email}</div>
              </div>
              <span style={{ padding: '2px 8px', borderRadius: 4, fontSize: 10, fontFamily: 'IBM Plex Mono, monospace', fontWeight: 500, background: rc.bg, color: rc.color, border: `1px solid ${rc.bd}` }}>
                {a.role_in_project}
              </span>
              <button
                onClick={() => remove(a.user_id)}
                style={{ background: 'transparent', border: 'none', color: 'var(--tx2)', cursor: 'pointer', fontSize: 13, padding: '2px 4px', transition: '.15s' }}
                onMouseEnter={e => (e.currentTarget.style.color = 'var(--red)')}
                onMouseLeave={e => (e.currentTarget.style.color = 'var(--tx2)')}
                title="Remove from project"
              >
                ✕
              </button>
            </div>
          )
        })}
      </div>
    </div>
  )
}
