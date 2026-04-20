import { useMemo, useState, useEffect } from 'react'
import { MessageSquare, Sun, Moon, Settings } from 'lucide-react'
import { canAssignPeople } from '@/lib/permissions'
import type { Project, UserRole } from '@/lib/types'
import type { TabKey, ViewMode } from './AppShell'

interface Props {
  project: (Project & { pending_count: number }) | null
  activeTab: TabKey
  onTab: (t: TabKey) => void
  pendingCount: number
  riskCount?: number
  chatOpen?: boolean
  onToggleChat?: () => void
  viewMode: ViewMode
  currentRole: UserRole
}

const ROLE_COLORS: Record<UserRole, string> = {
  boss: 'var(--red)',
  lead: 'var(--amber)',
  employee: 'var(--purple)',
}

const ROLE_BG: Record<UserRole, string> = {
  boss: 'var(--red-bg)',
  lead: 'var(--amber-bg)',
  employee: 'var(--purple-bg)',
}

export default function TopBar({ project, activeTab, onTab, pendingCount, riskCount, chatOpen, onToggleChat, viewMode, currentRole }: Props) {
  const [isDark, setIsDark] = useState(false)

  useEffect(() => {
    setIsDark(document.documentElement.classList.contains('dark'))
    const observer = new MutationObserver(() => setIsDark(document.documentElement.classList.contains('dark')))
    observer.observe(document.documentElement, { attributes: true, attributeFilter: ['class'] })
    return () => observer.disconnect()
  }, [])

  const tabs = useMemo(() => {
    const list: { key: TabKey; label: string }[] = [
      { key: 'knowledge', label: 'Knowledge' },
    ]
    if (project?.slack_workspace) list.push({ key: 'slack', label: 'Slack Feed' })
    if (project?.tool && project.tool !== 'none') list.push({ key: 'tool', label: project.tool })
    return list
  }, [project?.slack_workspace, project?.tool, currentRole])

  return (
    <div style={{
      height: 64, display: 'flex', alignItems: 'center',
      padding: '0 var(--space-6)', gap: 'var(--space-4)',
      background: 'var(--bg1)', flexShrink: 0,
    }}>

      {/* Left: Title */}
      <div style={{ display: 'flex', alignItems: 'center', gap: 'var(--space-3)', flex: 1, minWidth: 0 }}>
        {viewMode !== 'project' ? (
          <span style={{
            fontSize: 'var(--text-xl)', fontWeight: 700,
            color: 'var(--tx0)', letterSpacing: 'var(--tracking-tight)',
          }}>
            {viewMode === 'dashboard' ? 'Hello, Steven' : 'User Management'}
          </span>
        ) : (
          <>
            {project && <div style={{ width: 10, height: 10, borderRadius: 'var(--radius-full)', background: project.color, flexShrink: 0 }} />}
            <span style={{
              fontSize: 'var(--text-xl)', fontWeight: 700, color: 'var(--tx0)',
              overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap',
              letterSpacing: 'var(--tracking-tight)',
            }}>
              {project?.name ?? 'Project Brain'}
            </span>
          </>
        )}
        <span style={{
          fontSize: 'var(--text-xs)', padding: 'var(--space-1) var(--space-2)',
          borderRadius: 'var(--radius-lg)', fontWeight: 600,
          letterSpacing: 'var(--tracking-wide)', textTransform: 'uppercase',
          color: ROLE_COLORS[currentRole], background: ROLE_BG[currentRole],
        }}>
          {currentRole}
        </span>
      </div>

      {/* Center: Tabs */}
      <div style={{
        display: 'flex', gap: 'var(--space-1)', alignItems: 'center',
        background: 'var(--bg3)', borderRadius: 'var(--radius-lg)', padding: 3,
      }}>
        {viewMode === 'project' && tabs.map(t => (
          <button
            key={t.key}
            onClick={() => onTab(t.key)}
            style={{
              display: 'flex', alignItems: 'center', gap: 'var(--space-1-5)',
              padding: 'var(--space-2) var(--space-4)', borderRadius: 'var(--radius-md)',
              fontSize: 'var(--text-sm)', fontWeight: 500, cursor: 'pointer', border: 'none',
              transition: 'all var(--duration-fast) var(--ease-default)',
              fontFamily: 'var(--font-sans)',
              background: activeTab === t.key ? 'var(--bg1)' : 'transparent',
              color: activeTab === t.key ? 'var(--tx0)' : 'var(--tx2)',
              boxShadow: activeTab === t.key ? 'var(--shadow-xs)' : 'none',
            }}
          >
            {t.label}
            {t.key === 'slack' && pendingCount > 0 && (
              <span style={{
                fontSize: 'var(--text-xs)', fontWeight: 700,
                background: 'var(--red)', color: '#fff',
                borderRadius: 'var(--radius-lg)', padding: '1px var(--space-1-5)',
                minWidth: 18, textAlign: 'center',
              }}>{pendingCount}</span>
            )}
            {t.key === 'tool' && (riskCount ?? 0) > 0 && (
              <span style={{
                fontSize: 'var(--text-xs)', fontWeight: 700,
                background: 'var(--amber)', color: '#fff',
                borderRadius: 'var(--radius-lg)', padding: '1px var(--space-1-5)',
                minWidth: 18, textAlign: 'center',
              }}>{riskCount}</span>
            )}
          </button>
        ))}

        {activeTab === 'knowledge' && onToggleChat && (
          <button
            onClick={onToggleChat}
            style={{
              display: 'flex', alignItems: 'center', gap: 'var(--space-1-5)',
              padding: 'var(--space-2) var(--space-4)', borderRadius: 'var(--radius-md)',
              fontSize: 'var(--text-sm)', fontWeight: 500, cursor: 'pointer', border: 'none',
              transition: 'all var(--duration-fast) var(--ease-default)',
              fontFamily: 'var(--font-sans)',
              background: chatOpen ? 'var(--bg1)' : 'transparent',
              color: chatOpen ? 'var(--tx0)' : 'var(--tx2)',
              boxShadow: chatOpen ? 'var(--shadow-xs)' : 'none',
            }}
          >
            <MessageSquare size={14} /> Chat
          </button>
        )}
      </div>

      {/* Right: Actions */}
      <div style={{ display: 'flex', alignItems: 'center', gap: 'var(--space-2)' }}>
        {viewMode === 'project' && canAssignPeople(currentRole) && (
          <button
            className="theme-toggle"
            onClick={() => onTab('settings')}
            style={{
              display: 'flex', alignItems: 'center', justifyContent: 'center',
              width: 38, height: 38, borderRadius: 'var(--radius-md)',
              cursor: 'pointer', border: 'none',
              transition: 'all var(--duration-fast) var(--ease-default)',
              background: activeTab === 'settings' ? 'var(--bg2)' : 'var(--bg3)',
              color: activeTab === 'settings' ? 'var(--tx0)' : 'var(--tx2)',
            }}
            title="Project Settings"
          >
            <Settings size={17} />
          </button>
        )}

        <button
          className="theme-toggle"
          onClick={() => {
            document.documentElement.classList.toggle('dark')
            const isNowDark = document.documentElement.classList.contains('dark')
            localStorage.setItem('theme', isNowDark ? 'dark' : 'light')
            setIsDark(isNowDark)
          }}
          style={{
            display: 'flex', alignItems: 'center', justifyContent: 'center',
            width: 38, height: 38, borderRadius: 'var(--radius-md)',
            cursor: 'pointer', border: 'none',
            transition: 'all var(--duration-fast) var(--ease-default)',
            background: 'var(--bg3)', color: 'var(--tx2)',
          }}
          title={`Switch to ${isDark ? 'light' : 'dark'} mode`}
        >
          {isDark ? <Sun size={17} /> : <Moon size={17} />}
        </button>
      </div>

      <style>{`
        .theme-toggle:hover {
          color: var(--tx0) !important;
        }
      `}</style>
    </div>
  )
}
