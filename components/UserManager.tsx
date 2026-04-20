'use client'
import { useState, useEffect, useCallback } from 'react'
import type { User, UserRole } from '@/lib/types'

const ROLE_COLORS: Record<string, { bg: string; color: string }> = {
  boss:     { bg: 'var(--red-bg)',    color: 'var(--red)' },
  lead:     { bg: 'var(--amber-bg)',  color: 'var(--amber)' },
  employee: { bg: 'var(--purple-bg)', color: 'var(--purple)' },
}

const TITLES = ['BE', 'FE', 'BA', 'QC', 'PM', 'Designer', 'DevOps', 'Fullstack', 'Mobile', 'Data', 'Other']

export default function UserManager() {
  const [users, setUsers] = useState<User[]>([])
  const [showAdd, setShowAdd] = useState(false)
  const [editingId, setEditingId] = useState<string | null>(null)
  const [form, setForm] = useState({ name: '', email: '', role: 'employee' as UserRole, title: '' })
  const [loading, setLoading] = useState(false)

  const load = useCallback(() => {
    fetch('/api/users').then(r => r.json()).then(data => setUsers(Array.isArray(data) ? data : []))
  }, [])

  useEffect(() => { load() }, [load])

  const resetForm = () => setForm({ name: '', email: '', role: 'employee', title: '' })

  async function createUser() {
    if (!form.name.trim() || !form.email.trim()) return
    setLoading(true)
    await fetch('/api/users', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(form),
    })
    resetForm()
    setShowAdd(false)
    setLoading(false)
    load()
  }

  async function updateUser(id: string) {
    setLoading(true)
    await fetch(`/api/users/${id}`, {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(form),
    })
    setEditingId(null)
    resetForm()
    setLoading(false)
    load()
  }

  async function deactivateUser(id: string, name: string) {
    if (!confirm(`Deactivate ${name}? They will lose access.`)) return
    await fetch(`/api/users/${id}`, { method: 'DELETE' })
    load()
  }

  function startEdit(user: User) {
    setEditingId(user.id)
    setForm({ name: user.name, email: user.email, role: user.role, title: user.title || '' })
    setShowAdd(false)
  }

  const initials = (name: string) => name.split(' ').map(w => w[0]).join('').slice(0, 2).toUpperCase()

  return (
    <div style={{ flex: 1, display: 'flex', flexDirection: 'column', overflow: 'hidden' }}>
      {/* Header */}
      <div style={{ padding: '14px 18px', borderBottom: '1px solid var(--bd)', display: 'flex', alignItems: 'center', justifyContent: 'space-between', flexShrink: 0 }}>
        <div>
          <div style={{ fontSize: 14, fontWeight: 600, color: 'var(--tx0)' }}>User Management</div>
          <div style={{ fontSize: 11, color: 'var(--tx2)', fontFamily: 'IBM Plex Mono, monospace', marginTop: 2 }}>
            {users.length} user{users.length !== 1 ? 's' : ''}
          </div>
        </div>
        {!showAdd && !editingId && (
          <button
            onClick={() => { setShowAdd(true); resetForm() }}
            style={{ padding: '6px 14px', background: 'var(--blue)', border: 'none', borderRadius: 6, fontSize: 12, color: '#fff', cursor: 'pointer', fontFamily: 'IBM Plex Mono, monospace', fontWeight: 500 }}
          >
            + add user
          </button>
        )}
      </div>

      {/* Add / Edit form */}
      {(showAdd || editingId) && (
        <div style={{ padding: '12px 18px', borderBottom: '1px solid var(--bd)', background: 'var(--bg2)' }}>
          <div style={{ fontSize: 11, color: 'var(--tx2)', fontFamily: 'IBM Plex Mono, monospace', marginBottom: 8 }}>
            {editingId ? 'EDIT USER' : 'NEW USER'}
          </div>
          <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap' }}>
            <input
              autoFocus
              value={form.name}
              onChange={e => setForm({ ...form, name: e.target.value })}
              placeholder="Full name"
              style={{ flex: 1, minWidth: 140, background: 'var(--bg3)', border: '1px solid var(--bd)', borderRadius: 6, padding: '6px 10px', fontSize: 12, color: 'var(--tx0)', outline: 'none' }}
            />
            <input
              value={form.email}
              onChange={e => setForm({ ...form, email: e.target.value })}
              placeholder="email@solidbytes.vn"
              style={{ flex: 1, minWidth: 180, background: 'var(--bg3)', border: '1px solid var(--bd)', borderRadius: 6, padding: '6px 10px', fontSize: 12, color: 'var(--tx0)', outline: 'none', fontFamily: 'IBM Plex Mono, monospace' }}
            />
          </div>
          <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap', marginTop: 8 }}>
            <div style={{ flex: 1, minWidth: 140 }}>
              <label style={{ fontSize: 10, color: 'var(--tx2)', fontFamily: 'IBM Plex Mono, monospace', display: 'block', marginBottom: 3 }}>Position</label>
              <div style={{ display: 'flex', gap: 4, flexWrap: 'wrap' }}>
                {TITLES.map(t => (
                  <button
                    key={t}
                    onClick={() => setForm({ ...form, title: t })}
                    style={{
                      padding: '4px 10px', borderRadius: 5, fontSize: 11, cursor: 'pointer', border: '1px solid',
                      fontFamily: 'IBM Plex Mono, monospace', transition: '.15s',
                      background: form.title === t ? 'var(--blue-bg)' : 'var(--bg3)',
                      color: form.title === t ? 'var(--blue)' : 'var(--tx1)',
                      borderColor: form.title === t ? 'var(--blue-bd)' : 'var(--bd)',
                    }}
                  >
                    {t}
                  </button>
                ))}
              </div>
            </div>
          </div>
          <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap', marginTop: 8 }}>
            <div>
              <label style={{ fontSize: 10, color: 'var(--tx2)', fontFamily: 'IBM Plex Mono, monospace', display: 'block', marginBottom: 3 }}>System Role (permissions)</label>
              <select
                value={form.role}
                onChange={e => setForm({ ...form, role: e.target.value as UserRole })}
                style={{ background: 'var(--bg3)', border: '1px solid var(--bd)', borderRadius: 6, padding: '6px 10px', fontSize: 12, color: 'var(--tx0)', outline: 'none', fontFamily: 'IBM Plex Mono, monospace', cursor: 'pointer' }}
              >
                <option value="employee">employee</option>
                <option value="lead">lead</option>
                <option value="boss">boss</option>
              </select>
            </div>
          </div>
          <div style={{ display: 'flex', gap: 6, marginTop: 10 }}>
            <button
              onClick={() => editingId ? updateUser(editingId) : createUser()}
              disabled={loading || !form.name.trim() || !form.email.trim()}
              style={{ padding: '6px 16px', background: 'var(--blue)', border: 'none', borderRadius: 6, fontSize: 12, color: '#fff', cursor: 'pointer', fontFamily: 'IBM Plex Mono, monospace', opacity: form.name.trim() && form.email.trim() ? 1 : 0.5 }}
            >
              {loading ? '...' : editingId ? 'save' : 'create'}
            </button>
            <button
              onClick={() => { setShowAdd(false); setEditingId(null); resetForm() }}
              style={{ padding: '6px 12px', background: 'transparent', border: '1px solid var(--bd)', borderRadius: 6, fontSize: 12, color: 'var(--tx1)', cursor: 'pointer' }}
            >
              cancel
            </button>
          </div>
        </div>
      )}

      {/* User list */}
      <div style={{ flex: 1, overflowY: 'auto', padding: '8px 12px' }}>
        {users.map(user => {
          const rc = ROLE_COLORS[user.role] || ROLE_COLORS.employee
          return (
            <div
              key={user.id}
              style={{ display: 'flex', alignItems: 'center', gap: 10, padding: '10px 12px', background: 'var(--bg2)', border: '1px solid var(--bd)', borderRadius: 8, marginBottom: 6 }}
            >
              <div style={{ width: 36, height: 36, borderRadius: '50%', background: rc.bg, border: `1px solid ${rc.color}`, display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 12, fontWeight: 600, color: rc.color, flexShrink: 0 }}>
                {initials(user.name)}
              </div>
              <div style={{ flex: 1, minWidth: 0 }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
                  <span style={{ fontSize: 13, fontWeight: 500, color: 'var(--tx0)' }}>{user.name}</span>
                  {user.title && (
                    <span style={{ fontSize: 10, fontFamily: 'IBM Plex Mono, monospace', color: 'var(--blue)', background: 'var(--blue-bg)', padding: '1px 6px', borderRadius: 3, border: '1px solid var(--blue-bd)' }}>
                      {user.title}
                    </span>
                  )}
                </div>
                <div style={{ fontSize: 11, color: 'var(--tx2)', fontFamily: 'IBM Plex Mono, monospace' }}>{user.email}</div>
              </div>
              <span style={{ padding: '3px 10px', borderRadius: 4, fontSize: 10, fontFamily: 'IBM Plex Mono, monospace', fontWeight: 500, background: rc.bg, color: rc.color, border: `1px solid ${rc.color}33` }}>
                {user.role}
              </span>
              <div style={{ display: 'flex', gap: 4 }}>
                <button
                  onClick={() => startEdit(user)}
                  style={{ background: 'transparent', border: '1px solid var(--bd)', borderRadius: 4, color: 'var(--tx2)', cursor: 'pointer', fontSize: 11, padding: '3px 8px', fontFamily: 'IBM Plex Mono, monospace' }}
                  onMouseEnter={e => (e.currentTarget.style.color = 'var(--blue)')}
                  onMouseLeave={e => (e.currentTarget.style.color = 'var(--tx2)')}
                >
                  edit
                </button>
                {user.role !== 'boss' && (
                  <button
                    onClick={() => deactivateUser(user.id, user.name)}
                    style={{ background: 'transparent', border: '1px solid var(--bd)', borderRadius: 4, color: 'var(--tx2)', cursor: 'pointer', fontSize: 11, padding: '3px 8px', fontFamily: 'IBM Plex Mono, monospace' }}
                    onMouseEnter={e => (e.currentTarget.style.color = 'var(--red)')}
                    onMouseLeave={e => (e.currentTarget.style.color = 'var(--tx2)')}
                  >
                    deactivate
                  </button>
                )}
              </div>
            </div>
          )
        })}
      </div>
    </div>
  )
}
