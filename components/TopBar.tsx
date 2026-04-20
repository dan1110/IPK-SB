import { useMemo, useState, useEffect } from 'react'
import { MessageSquare, Sun, Moon } from 'lucide-react'
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
  boss: 'var(--color-danger)',
  lead: 'var(--color-warning)',
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
    if (canAssignPeople(currentRole)) list.push({ key: 'settings', label: 'Settings' })
    return list
  }, [project?.slack_workspace, project?.tool, currentRole])

  return (
    <div
      style={{
        height: 'var(--space-16)',
        display: 'flex',
        alignItems: 'center',
        padding: '0 var(--space-7)',
        gap: 'var(--space-4)',
        background: 'var(--color-bg-primary)',
        flexShrink: 0,
      }}
    >

      {/* Left: Title */}
      <div style={{ display: 'flex', alignItems: 'center', gap: 'var(--space-3)', flex: 1, minWidth: 0 }}>
        {viewMode !== 'project' ? (
          <span
            style={{
              fontSize: 'var(--text-xl)',
              fontWeight: 700,
              fontFamily: 'var(--font-sans)',
              color: 'var(--color-text-primary)',
              letterSpacing: '-0.02em',
            }}
          >
            {viewMode === 'dashboard' ? 'Hello, Steven' : 'User Management'}
          </span>
        ) : (
          <>
            {project && (
              <div
                style={{
                  width: 'var(--space-2-5)',
                  height: 'var(--space-2-5)',
                  borderRadius: 'var(--radius-full)',
                  background: project.color,
                  flexShrink: 0,
                }}
              />
            )}
            <span
              style={{
                fontSize: 'var(--text-xl)',
                fontWeight: 700,
                fontFamily: 'var(--font-sans)',
                color: 'var(--color-text-primary)',
                overflow: 'hidden',
                textOverflow: 'ellipsis',
                whiteSpace: 'nowrap',
                letterSpacing: '-0.02em',
              }}
            >
              {project?.name ?? 'Project Brain'}
            </span>
          </>
        )}
        <span
          style={{
            fontSize: 'var(--text-2xs)',
            padding: 'var(--space-1) var(--space-2-5)',
            borderRadius: 'var(--radius-lg)',
            fontWeight: 600,
            fontFamily: 'var(--font-sans)',
            letterSpacing: '0.03em',
            textTransform: 'uppercase',
            color: ROLE_COLORS[currentRole],
            background: ROLE_BG[currentRole],
          }}
        >
          {currentRole}
        </span>
      </div>

      {/* Center: Tabs */}
      <div
        style={{
          display: 'flex',
          gap: 'var(--space-1)',
          alignItems: 'center',
          background: 'var(--color-bg-tertiary)',
          borderRadius: 'var(--radius-lg)',
          padding: 'var(--space-0-5)',
        }}
      >
        {viewMode === 'project' && tabs.map(t => (
          <button
            key={t.key}
            onClick={() => onTab(t.key)}
            style={{
              display: 'flex',
              alignItems: 'center',
              gap: 'var(--space-1-5)',
              padding: 'var(--space-1-5) var(--space-4-5)',
              borderRadius: 'var(--radius-md)',
              fontSize: 'var(--text-sm)',
              fontWeight: 500,
              fontFamily: 'var(--font-sans)',
              cursor: 'pointer',
              border: 'none',
              transition: 'all .2s ease',
              background: activeTab === t.key ? 'var(--color-bg-primary)' : 'transparent',
              color: activeTab === t.key ? 'var(--color-text-primary)' : 'var(--color-text-tertiary)',
              boxShadow: activeTab === t.key ? 'var(--shadow-card)' : 'none',
            }}
          >
            {t.label}
            {t.key === 'slack' && pendingCount > 0 && (
              <span
                style={{
                  fontSize: 'var(--text-2xs)',
                  fontWeight: 700,
                  background: 'var(--color-danger)',
                  color: '#fff',
                  borderRadius: 'var(--radius-lg)',
                  padding: '1px var(--space-1-5)',
                  minWidth: 'var(--space-4-5)',
                  textAlign: 'center',
                }}
              >
                {pendingCount}
              </span>
            )}
            {t.key === 'tool' && (riskCount ?? 0) > 0 && (
              <span
                style={{
                  fontSize: 'var(--text-2xs)',
                  fontWeight: 700,
                  background: 'var(--color-warning)',
                  color: '#fff',
                  borderRadius: 'var(--radius-lg)',
                  padding: '1px var(--space-1-5)',
                  minWidth: 'var(--space-4-5)',
                  textAlign: 'center',
                }}
              >
                {riskCount}
              </span>
            )}
          </button>
        ))}

        {activeTab === 'knowledge' && onToggleChat && (
          <button
            onClick={onToggleChat}
            style={{
              display: 'flex',
              alignItems: 'center',
              gap: 'var(--space-1-5)',
              padding: 'var(--space-1-5) var(--space-4-5)',
              borderRadius: 'var(--radius-md)',
              fontSize: 'var(--text-sm)',
              fontWeight: 500,
              fontFamily: 'var(--font-sans)',
              cursor: 'pointer',
              border: 'none',
              transition: 'all .2s ease',
              background: chatOpen ? 'var(--color-bg-primary)' : 'transparent',
              color: chatOpen ? 'var(--color-text-primary)' : 'var(--color-text-tertiary)',
              boxShadow: chatOpen ? 'var(--shadow-card)' : 'none',
            }}
          >
            <MessageSquare size={14} /> Chat
          </button>
        )}
      </div>

      {/* Right: Theme toggle */}
      <button
        className="theme-toggle"
        onClick={() => {
          document.documentElement.classList.toggle('dark')
          const isNowDark = document.documentElement.classList.contains('dark')
          localStorage.setItem('theme', isNowDark ? 'dark' : 'light')
          setIsDark(isNowDark)
        }}
        style={{
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          width: 'var(--space-9-5)',
          height: 'var(--space-9-5)',
          borderRadius: 'var(--radius-md)',
          cursor: 'pointer',
          border: 'none',
          transition: 'all .2s ease',
          background: 'var(--color-bg-tertiary)',
          color: 'var(--color-text-tertiary)',
        }}
        title={`Switch to ${isDark ? 'light' : 'dark'} mode`}
      >
        {isDark ? <Sun size={17} /> : <Moon size={17} />}
      </button>

      <style>{`
        .theme-toggle:hover {
          color: var(--color-text-primary) !important;
        }
      `}</style>
    </div>
  )
}
