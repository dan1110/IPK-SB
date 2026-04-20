'use client'
import { useState, useEffect } from 'react'
import { useRole } from '@/lib/role-context'
import { canCreateProject, canDeleteProject, canViewDashboard, canManageUsers } from '@/lib/permissions'
import CreateProjectModal from './CreateProjectModal'
import { LayoutDashboard, Users, Plus, Settings, Code, Trash2, FolderKanban, X } from 'lucide-react'
import type { Project, GithubRepo } from '@/lib/types'
import type { ViewMode } from './AppShell'

interface Props {
  projects: (Project & { pending_count: number })[]
  activeProjectId: string | null
  onSelect: (id: string) => void
  onProjectsChange: () => void
  viewMode: ViewMode
  onViewMode: (mode: ViewMode) => void
}

/* ── Shared inline-hover helper ── */
function useHover() {
  const [hovered, setHovered] = useState(false)
  const bind = { onMouseEnter: () => setHovered(true), onMouseLeave: () => setHovered(false) }
  return [hovered, bind] as const
}

export default function Sidebar({ projects, activeProjectId, onSelect, onProjectsChange, viewMode, onViewMode }: Props) {
  const { currentUser, currentRole, users, switchUser } = useRole()
  const [showNew, setShowNew] = useState(false)

  return (
    <div style={{
      width: 250, minWidth: 250,
      background: 'var(--bg1)',
      display: 'flex', flexDirection: 'column',
      overflow: 'hidden',
      borderRadius: 0,
      padding: 0,
      fontFamily: 'var(--font-sans)',
    }}>

      {/* Logo */}
      <div style={{ padding: 'var(--space-6) var(--space-6) var(--space-5)', display: 'flex', alignItems: 'center', gap: 'var(--space-3)' }}>
        <div style={{
          width: 38, height: 38,
          background: 'var(--brand-gradient)',
          borderRadius: 'var(--radius-xl)',
          display: 'flex', alignItems: 'center', justifyContent: 'center',
          fontSize: 'var(--text-md)', fontWeight: 800, color: '#fff', flexShrink: 0,
        }}>PB</div>
        <div>
          <div style={{ fontSize: 'var(--text-base)', fontWeight: 800, color: 'var(--tx0)', letterSpacing: 'var(--tracking-tight)' }}>Project Brain</div>
        </div>
      </div>

      {/* Main nav */}
      <div style={{ padding: '0 var(--space-3)' }}>
        {canViewDashboard(currentRole) && (
          <>
            <NavItem
              icon={<LayoutDashboard size={18} />}
              label="Home"
              active={viewMode === 'dashboard'}
              onClick={() => onViewMode('dashboard')}
            />
            {canManageUsers(currentRole) && (
              <NavItem
                icon={<Users size={18} />}
                label="Team"
                active={viewMode === 'users'}
                onClick={() => onViewMode('users')}
              />
            )}
          </>
        )}
        <NavItem
          icon={<FolderKanban size={18} />}
          label="Projects"
          active={viewMode === 'project'}
          onClick={() => {}}
          badge={canCreateProject(currentRole) ? (
            <AddProjectBadge onClick={() => setShowNew(true)} />
          ) : undefined}
        />
      </div>

      {/* Project list */}
      <div style={{ flex: 1, overflowY: 'auto', padding: 'var(--space-1) var(--space-3) var(--space-2)', marginTop: 'var(--space-1)' }}>
        {projects.map(p => (
          <SidebarProject key={p.id} project={p} active={p.id === activeProjectId && viewMode === 'project'} onSelect={id => { onSelect(id); onViewMode('project') }} onDelete={onProjectsChange} showDelete={canDeleteProject(currentRole)} />
        ))}
      </div>

      {/* GitHub repos */}
      {activeProjectId && (
        <div style={{ padding: '0 var(--space-3) var(--space-2)' }}>
          <GithubRepos projectId={activeProjectId} />
        </div>
      )}

      {/* Bottom nav */}
      <div style={{ padding: '0 var(--space-3) var(--space-2)' }}>
        <NavItem icon={<Settings size={18} />} label="Settings" active={false} onClick={() => {}} />
      </div>

      {/* User footer */}
      <div style={{ padding: 'var(--space-4) var(--space-5)', borderTop: '1px solid var(--bg3)' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 'var(--space-2)' }}>
          <div style={{
            width: 36, height: 36, borderRadius: 'var(--radius-xl)',
            background: currentRole === 'boss' ? 'var(--red-bg)' : currentRole === 'lead' ? 'var(--amber-bg)' : 'var(--purple-bg)',
            display: 'flex', alignItems: 'center', justifyContent: 'center',
            fontSize: 'var(--text-xs)', fontWeight: 700,
            color: currentRole === 'boss' ? 'var(--red)' : currentRole === 'lead' ? 'var(--amber)' : 'var(--purple)',
            flexShrink: 0,
          }}>
            {currentUser?.name?.split(' ').map(w => w[0]).join('').slice(0, 2).toUpperCase() || '??'}
          </div>
          <div style={{ flex: 1, minWidth: 0 }}>
            <div style={{ fontSize: 'var(--text-sm)', color: 'var(--tx0)', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap', fontWeight: 600 }}>{currentUser?.name || 'Loading...'}</div>
            <div style={{ fontSize: 'var(--text-xs)', color: 'var(--tx2)', fontWeight: 500 }}>{currentRole}</div>
          </div>
        </div>
        {users.length > 1 && (
          <select
            value={currentUser?.id || ''}
            onChange={e => switchUser(e.target.value)}
            style={{
              width: '100%', marginTop: 'var(--space-2)',
              background: 'var(--bg3)', border: 'none',
              borderRadius: 'var(--radius-lg)',
              padding: 'var(--space-1-5) var(--space-2)',
              fontSize: 'var(--text-xs)', color: 'var(--tx0)',
              fontFamily: 'var(--font-sans)',
              outline: 'none', cursor: 'pointer',
            }}
          >
            {users.map(u => (
              <option key={u.id} value={u.id}>{u.name} ({u.role})</option>
            ))}
          </select>
        )}
      </div>

      {showNew && <CreateProjectModal onClose={() => setShowNew(false)} onCreated={onProjectsChange} />}
    </div>
  )
}

/* ── Add-project badge with CSS-clean hover ── */
function AddProjectBadge({ onClick }: { onClick: () => void }) {
  const [hovered, bind] = useHover()
  return (
    <span
      onClick={(e) => { e.stopPropagation(); onClick() }}
      {...bind}
      style={{
        width: 22, height: 22,
        borderRadius: 'var(--radius-md)',
        background: hovered ? 'var(--brand-bg)' : 'var(--bg3)',
        display: 'flex', alignItems: 'center', justifyContent: 'center',
        cursor: 'pointer',
        transition: `all var(--duration-normal) var(--ease-default)`,
        color: hovered ? 'var(--brand)' : 'var(--tx2)',
      }}
    >
      <Plus size={14} />
    </span>
  )
}

function NavItem({ icon, label, active, onClick, badge }: { icon: React.ReactNode; label: string; active: boolean; onClick: () => void; badge?: React.ReactNode }) {
  const [hovered, bind] = useHover()
  return (
    <div
      onClick={onClick}
      {...bind}
      style={{
        display: 'flex', alignItems: 'center', gap: 'var(--space-3)',
        padding: 'var(--space-2) var(--space-3)',
        borderRadius: 'var(--radius-lg)',
        cursor: 'pointer',
        transition: `all var(--duration-normal) var(--ease-default)`,
        background: active ? 'var(--bg3)' : hovered ? 'var(--bg2)' : 'transparent',
        color: active ? 'var(--tx0)' : hovered ? 'var(--tx0)' : 'var(--tx2)',
        fontWeight: active ? 600 : 500,
        fontSize: 'var(--text-base)',
        marginBottom: 'var(--space-0-5)',
      }}
    >
      {icon}
      <span style={{ flex: 1 }}>{label}</span>
      {badge}
    </div>
  )
}

function SidebarProject({ project, active, onSelect, onDelete, showDelete = true }: { project: Project & { pending_count: number }; active: boolean; onSelect: (id: string) => void; onDelete: () => void; showDelete?: boolean }) {
  const [hover, setHover] = useState(false)

  async function del(e: React.MouseEvent) {
    e.stopPropagation()
    if (!confirm(`Delete ${project.name}?`)) return
    await fetch(`/api/projects/${project.id}`, { method: 'DELETE' })
    onDelete()
  }

  return (
    <div
      onClick={() => onSelect(project.id)}
      onMouseEnter={() => setHover(true)}
      onMouseLeave={() => setHover(false)}
      style={{
        display: 'flex', alignItems: 'center', gap: 'var(--space-2)',
        padding: 'var(--space-2) var(--space-3)',
        borderRadius: 'var(--radius-lg)',
        cursor: 'pointer',
        marginBottom: 'var(--space-0-5)',
        background: active ? 'var(--bg3)' : hover ? 'var(--bg2)' : 'transparent',
        transition: `all var(--duration-normal) var(--ease-default)`,
      }}
    >
      <div style={{ width: 8, height: 8, borderRadius: 'var(--radius-full)', background: project.color, flexShrink: 0 }} />
      <div style={{ flex: 1, minWidth: 0 }}>
        <span style={{ fontSize: 'var(--text-sm)', fontWeight: active ? 600 : 400, color: active ? 'var(--tx0)' : 'var(--tx1)', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap', display: 'block' }}>{project.name}</span>
      </div>
      {project.pending_count > 0 && (
        <span style={{
          fontSize: 'var(--text-xs)',
          background: 'var(--red)', color: '#fff',
          borderRadius: 'var(--radius-lg)',
          padding: 'var(--space-0-5) var(--space-1-5)',
          fontWeight: 700, minWidth: 20, textAlign: 'center',
          lineHeight: 'var(--leading-xs)',
        }}>{project.pending_count}</span>
      )}
      {hover && showDelete && (
        <span onClick={del} style={{ color: 'var(--tx2)', padding: 'var(--space-0-5)', cursor: 'pointer', transition: `var(--duration-fast) var(--ease-default)` }} title="Delete">
          <Trash2 size={13} />
        </span>
      )}
    </div>
  )
}

function GithubRepos({ projectId }: { projectId: string }) {
  const [repos, setRepos] = useState<GithubRepo[]>([])
  const [showAdd, setShowAdd] = useState(false)
  const [repoUrl, setRepoUrl] = useState('')
  const [adding, setAdding] = useState(false)

  useEffect(() => {
    fetch(`/api/github?project_id=${projectId}`)
      .then(r => r.json())
      .then(data => setRepos(Array.isArray(data) ? data : []))
      .catch(() => setRepos([]))
  }, [projectId])

  async function addRepo() {
    if (!repoUrl.trim()) return
    setAdding(true)
    await fetch('/api/github', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ project_id: projectId, repo_url: repoUrl.trim() }) })
    setRepoUrl(''); setShowAdd(false); setAdding(false)
    const data = await fetch(`/api/github?project_id=${projectId}`).then(r => r.json())
    setRepos(Array.isArray(data) ? data : [])
  }

  async function removeRepo(id: string) {
    await fetch(`/api/github/${id}`, { method: 'DELETE' })
    setRepos(repos.filter(r => r.id !== id))
  }

  const shortName = (url: string) => { const m = url.match(/github\.com\/([^/]+\/[^/]+)/); return m ? m[1] : url }

  if (repos.length === 0 && !showAdd) return null

  return (
    <div>
      {repos.map(r => (
        <div key={r.id} style={{ display: 'flex', alignItems: 'center', gap: 'var(--space-2)', padding: 'var(--space-1-5) var(--space-3)', borderRadius: 'var(--radius-lg)', fontSize: 'var(--text-xs)', color: 'var(--tx2)' }}>
          <Code size={13} />
          <span style={{ flex: 1, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }} title={r.repo_url}>{shortName(r.repo_url)}</span>
          {r.last_synced && <span style={{ fontSize: 9, color: 'var(--green)', fontWeight: 600 }}>synced</span>}
          <span onClick={() => removeRepo(r.id)} style={{ color: 'var(--tx2)', cursor: 'pointer', padding: 'var(--space-0-5)' }}><Trash2 size={12} /></span>
        </div>
      ))}
      {showAdd ? (
        <div style={{ padding: 'var(--space-1) var(--space-2)' }}>
          <input
            autoFocus value={repoUrl}
            onChange={e => setRepoUrl(e.target.value)}
            onKeyDown={e => { if (e.key === 'Enter') addRepo(); if (e.key === 'Escape') setShowAdd(false) }}
            placeholder="github.com/org/repo"
            style={{
              width: '100%', background: 'var(--bg3)', border: 'none',
              borderRadius: 'var(--radius-lg)',
              padding: 'var(--space-1-5) var(--space-2)',
              fontSize: 'var(--text-xs)', color: 'var(--tx0)',
              fontFamily: 'var(--font-sans)',
              outline: 'none',
            }}
          />
          <div style={{ display: 'flex', gap: 'var(--space-1)', marginTop: 'var(--space-1-5)' }}>
            <button onClick={addRepo} disabled={adding} style={{
              flex: 1, padding: 'var(--space-1)',
              background: 'var(--brand)', border: 'none',
              borderRadius: 'var(--radius-md)',
              fontSize: 'var(--text-xs)', color: '#fff',
              fontFamily: 'var(--font-sans)',
              cursor: 'pointer', fontWeight: 600,
            }}>{adding ? '...' : 'Add'}</button>
            <button onClick={() => setShowAdd(false)} style={{
              padding: 'var(--space-1) var(--space-2)',
              background: 'var(--bg3)', border: 'none',
              borderRadius: 'var(--radius-md)',
              fontSize: 'var(--text-xs)', color: 'var(--tx2)',
              cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center',
            }}><X size={12} /></button>
          </div>
        </div>
      ) : (
        <AddRepoButton onClick={() => setShowAdd(true)} />
      )}
    </div>
  )
}

/* ── "Add repo" link with hover ── */
function AddRepoButton({ onClick }: { onClick: () => void }) {
  const [hovered, bind] = useHover()
  return (
    <div
      onClick={onClick}
      {...bind}
      style={{
        display: 'flex', alignItems: 'center', gap: 'var(--space-2)',
        padding: 'var(--space-1-5) var(--space-3)',
        borderRadius: 'var(--radius-lg)',
        cursor: 'pointer',
        color: hovered ? 'var(--brand)' : 'var(--tx2)',
        fontSize: 'var(--text-xs)',
        transition: `all var(--duration-normal) var(--ease-default)`,
      }}
    >
      <Plus size={13} /> Add repo
    </div>
  )
}
