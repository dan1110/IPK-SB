'use client'
import { useState, useEffect, useCallback } from 'react'
import { X } from 'lucide-react'
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
      <div style={{ padding: 'var(--space-3) var(--space-4)', borderBottom: '1px solid var(--color-border-default)', display: 'flex', alignItems: 'center', justifyContent: 'space-between', flexShrink: 0 }}>
        <div>
          <div style={{ fontSize: 'var(--text-base)', fontWeight: 600, color: 'var(--tx0)' }}>User Management</div>
          <div style={{ fontSize: 'var(--text-xs)', color: 'var(--tx2)', fontFamily: 'var(--font-mono)', marginTop: 'var(--space-0-5)' }}>
            {users.length} user{users.length !== 1 ? 's' : ''}
          </div>
        </div>
        {!showAdd && !editingId && (
          <button
            onClick={() => { setShowAdd(true); resetForm() }}
            style={{ padding: 'var(--space-1-5) var(--space-3)', background: 'var(--blue)', border: 'none', borderRadius: 'var(--radius-md)', fontSize: 'var(--text-sm)', color: '#fff', cursor: 'pointer', fontFamily: 'var(--font-mono)', fontWeight: 500 }}
          >
            + add user
          </button>
        )}
      </div>

      {/* Add / Edit form */}
      {(showAdd || editingId) && (
        <div style={{ padding: 'var(--space-3) var(--space-4)', borderBottom: '1px solid var(--color-border-default)', background: 'var(--bg2)' }}>
          <div style={{ fontSize: 'var(--text-xs)', color: 'var(--tx2)', fontFamily: 'var(--font-mono)', marginBottom: 'var(--space-2)', letterSpacing: 'var(--tracking-wide)' }}>
            {editingId ? 'EDIT USER' : 'NEW USER'}
          </div>
          <div style={{ display: 'flex', gap: 'var(--space-2)', flexWrap: 'wrap' }}>
            <input
              autoFocus
              value={form.name}
              onChange={e => setForm({ ...form, name: e.target.value })}
              placeholder="Full name"
              style={{ flex: 1, minWidth: 140, background: 'var(--bg3)', border: '1px solid var(--color-border-default)', borderRadius: 'var(--radius-md)', padding: 'var(--space-1-5) var(--space-2)', fontSize: 'var(--text-sm)', color: 'var(--tx0)', outline: 'none' }}
            />
            <input
              value={form.email}
              onChange={e => setForm({ ...form, email: e.target.value })}
              placeholder="email@solidbytes.vn"
              style={{ flex: 1, minWidth: 180, background: 'var(--bg3)', border: '1px solid var(--color-border-default)', borderRadius: 'var(--radius-md)', padding: 'var(--space-1-5) var(--space-2)', fontSize: 'var(--text-sm)', color: 'var(--tx0)', outline: 'none', fontFamily: 'var(--font-mono)' }}
            />
          </div>
          <div style={{ display: 'flex', gap: 'var(--space-2)', flexWrap: 'wrap', marginTop: 'var(--space-2)' }}>
            <div style={{ flex: 1, minWidth: 140 }}>
              <label style={{ fontSize: 10, color: 'var(--tx2)', fontFamily: 'var(--font-mono)', display: 'block', marginBottom: 'var(--space-0-5)' }}>Position</label>
              <div style={{ display: 'flex', gap: 'var(--space-1)', flexWrap: 'wrap' }}>
                {TITLES.map(t => (
                  <button
                    key={t}
                    onClick={() => setForm({ ...form, title: t })}
                    style={{
                      padding: 'var(--space-1) var(--space-2)', borderRadius: 'var(--radius-md)', fontSize: 'var(--text-xs)', cursor: 'pointer', border: '1px solid',
                      fontFamily: 'var(--font-mono)', transition: 'var(--duration-fast) var(--ease-default)',
                      background: form.title === t ? 'var(--blue-bg)' : 'var(--bg3)',
                      color: form.title === t ? 'var(--blue)' : 'var(--tx1)',
                      borderColor: form.title === t ? 'var(--blue-bd)' : 'var(--color-border-default)',
                    }}
                  >
                    {t}
                  </button>
                ))}
              </div>
            </div>
          </div>
          <div style={{ display: 'flex', gap: 'var(--space-2)', flexWrap: 'wrap', marginTop: 'var(--space-2)' }}>
            <div>
              <label style={{ fontSize: 10, color: 'var(--tx2)', fontFamily: 'var(--font-mono)', display: 'block', marginBottom: 'var(--space-0-5)' }}>System Role (permissions)</label>
              <select
                value={form.role}
                onChange={e => setForm({ ...form, role: e.target.value as UserRole })}
                style={{ background: 'var(--bg3)', border: '1px solid var(--color-border-default)', borderRadius: 'var(--radius-md)', padding: 'var(--space-1-5) var(--space-2)', fontSize: 'var(--text-sm)', color: 'var(--tx0)', outline: 'none', fontFamily: 'var(--font-mono)', cursor: 'pointer' }}
              >
                <option value="employee">employee</option>
                <option value="lead">lead</option>
                <option value="boss">boss</option>
              </select>
            </div>
          </div>
          <div style={{ display: 'flex', gap: 'var(--space-1-5)', marginTop: 'var(--space-2)' }}>
            <button
              onClick={() => editingId ? updateUser(editingId) : createUser()}
              disabled={loading || !form.name.trim() || !form.email.trim()}
              style={{ padding: 'var(--space-1-5) var(--space-4)', background: 'var(--blue)', border: 'none', borderRadius: 'var(--radius-md)', fontSize: 'var(--text-sm)', color: '#fff', cursor: 'pointer', fontFamily: 'var(--font-mono)', opacity: form.name.trim() && form.email.trim() ? 1 : 0.5 }}
            >
              {loading ? '...' : editingId ? 'save' : 'create'}
            </button>
            <button
              onClick={() => { setShowAdd(false); setEditingId(null); resetForm() }}
              style={{ padding: 'var(--space-1-5) var(--space-3)', background: 'transparent', border: '1px solid var(--color-border-default)', borderRadius: 'var(--radius-md)', fontSize: 'var(--text-sm)', color: 'var(--tx1)', cursor: 'pointer' }}
            >
              cancel
            </button>
          </div>
        </div>
      )}

      {/* User list */}
      <div style={{ flex: 1, overflowY: 'auto', padding: 'var(--space-2) var(--space-3)' }}>
        {users.map(user => {
          const rc = ROLE_COLORS[user.role] || ROLE_COLORS.employee
          return (
            <div
              key={user.id}
              style={{ display: 'flex', alignItems: 'center', gap: 'var(--space-2)', padding: 'var(--space-2) var(--space-3)', background: 'var(--bg2)', border: '1px solid var(--color-border-default)', borderRadius: 'var(--radius-lg)', marginBottom: 'var(--space-1-5)' }}
            >
              <div style={{ width: 36, height: 36, borderRadius: 'var(--radius-full)', background: rc.bg, border: `1px solid ${rc.color}`, display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 'var(--text-sm)', fontWeight: 600, color: rc.color, flexShrink: 0 }}>
                {initials(user.name)}
              </div>
              <div style={{ flex: 1, minWidth: 0 }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: 'var(--space-1-5)' }}>
                  <span style={{ fontSize: 'var(--text-sm)', fontWeight: 500, color: 'var(--tx0)' }}>{user.name}</span>
                  {user.title && (
                    <span style={{ fontSize: 10, fontFamily: 'var(--font-mono)', color: 'var(--blue)', background: 'var(--blue-bg)', padding: '1px var(--space-1-5)', borderRadius: 'var(--radius-sm)', border: '1px solid var(--blue-bd)' }}>
                      {user.title}
                    </span>
                  )}
                </div>
                <div style={{ fontSize: 'var(--text-xs)', color: 'var(--tx2)', fontFamily: 'var(--font-mono)' }}>{user.email}</div>
              </div>
              <span style={{ padding: 'var(--space-0-5) var(--space-2)', borderRadius: 'var(--radius-sm)', fontSize: 10, fontFamily: 'var(--font-mono)', fontWeight: 500, background: rc.bg, color: rc.color, border: `1px solid ${rc.color}33` }}>
                {user.role}
              </span>
              <div style={{ display: 'flex', gap: 'var(--space-1)' }}>
                <button
                  onClick={() => startEdit(user)}
                  className="hover-blue"
                  style={{ background: 'transparent', border: '1px solid var(--color-border-default)', borderRadius: 'var(--radius-sm)', color: 'var(--tx2)', cursor: 'pointer', fontSize: 'var(--text-xs)', padding: 'var(--space-0-5) var(--space-2)', fontFamily: 'var(--font-mono)', transition: 'var(--duration-fast) var(--ease-default)' }}
                >
                  edit
                </button>
                {user.role !== 'boss' && (
                  <button
                    onClick={() => deactivateUser(user.id, user.name)}
                    className="hover-red"
                    style={{ background: 'transparent', border: '1px solid var(--color-border-default)', borderRadius: 'var(--radius-sm)', color: 'var(--tx2)', cursor: 'pointer', fontSize: 'var(--text-xs)', padding: 'var(--space-0-5) var(--space-2)', fontFamily: 'var(--font-mono)', transition: 'var(--duration-fast) var(--ease-default)' }}
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
