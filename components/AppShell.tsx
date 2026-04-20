'use client'
import { useState, useEffect, useRef, useCallback } from 'react'
import Sidebar from './Sidebar'
import TopBar from './TopBar'
import SlackFeed from './SlackFeed'
import ReplyPanel from './ReplyPanel'
import SourcesPanel from './SourcesPanel'
import ChatModule from './ChatModule'
import JiraBoard from './JiraBoard'
import ProjectSettings from './ProjectSettings'
import UserManager from './UserManager'
import BossDashboard from './BossDashboard'
import { useRole } from '@/lib/role-context'
import { canAssignPeople, canManageUsers } from '@/lib/permissions'
import type { Project, SlackMessage, GithubRepo } from '@/lib/types'

export type TabKey = 'knowledge' | 'slack' | 'tool' | 'settings'
export type ViewMode = 'project' | 'dashboard' | 'users'

export default function AppShell() {
  const { currentUser, currentRole, loading: roleLoading } = useRole()
  const [projects, setProjects] = useState<(Project & { pending_count: number })[]>([])
  const [activeProjectId, setActiveProjectId] = useState<string | null>(null)
  const [activeTab, setActiveTab] = useState<TabKey>('knowledge')
  const [viewMode, setViewMode] = useState<ViewMode>('project')
  const [selectedMsg, setSelectedMsg] = useState<SlackMessage | null>(null)
  const [slackRefresh, setSlackRefresh] = useState(0)
  const [jiraRiskCount, setJiraRiskCount] = useState(0)

  // Chat panel: collapsible + resizable
  const [chatOpen, setChatOpen] = useState(true)
  const [chatWidth, setChatWidth] = useState(60) // percentage
  const dragging = useRef(false)
  const containerRef = useRef<HTMLDivElement>(null)

  // Initialize theme
  useEffect(() => {
    const isDark = localStorage.getItem('theme') === 'dark' || (!('theme' in localStorage) && window.matchMedia('(prefers-color-scheme: dark)').matches)
    if (isDark) document.documentElement.classList.add('dark')
    else document.documentElement.classList.remove('dark')
  }, [])

  useEffect(() => {
    const headers: Record<string, string> = {}
    if (currentUser) headers['x-user-id'] = currentUser.id
    fetch('/api/projects', { headers })
      .then(r => r.json())
      .then(data => {
        setProjects(data)
        if (data.length > 0 && !activeProjectId) setActiveProjectId(data[0].id)
      })
  }, [slackRefresh, currentUser?.id])

  // Fetch jira risk count for active project
  useEffect(() => {
    if (!activeProjectId) return
    fetch(`/api/jira?project_id=${activeProjectId}`)
      .then(r => r.json())
      .then(data => setJiraRiskCount(data.riskCount || 0))
      .catch(() => setJiraRiskCount(0))
  }, [activeProjectId, slackRefresh])

  const activeProject = projects.find(p => p.id === activeProjectId) || null
  const refreshProjects = () => setSlackRefresh(n => n + 1)

  // Drag to resize
  const onMouseDown = useCallback(() => {
    dragging.current = true
    document.body.style.cursor = 'col-resize'
    document.body.style.userSelect = 'none'
  }, [])

  useEffect(() => {
    const onMouseMove = (e: MouseEvent) => {
      if (!dragging.current || !containerRef.current) return
      const rect = containerRef.current.getBoundingClientRect()
      const x = e.clientX - rect.left
      const pct = 100 - (x / rect.width) * 100
      setChatWidth(Math.min(80, Math.max(25, pct)))
    }
    const onMouseUp = () => {
      if (dragging.current) {
        dragging.current = false
        document.body.style.cursor = ''
        document.body.style.userSelect = ''
      }
    }
    window.addEventListener('mousemove', onMouseMove)
    window.addEventListener('mouseup', onMouseUp)
    return () => {
      window.removeEventListener('mousemove', onMouseMove)
      window.removeEventListener('mouseup', onMouseUp)
    }
  }, [])

  return (
    <div style={{ display: 'flex', height: '100vh', background: 'var(--color-bg-base)', overflow: 'hidden', fontFamily: 'var(--font-sans)' }}>
      <Sidebar
        projects={projects}
        activeProjectId={activeProjectId}
        onSelect={id => { setActiveProjectId(id); setActiveTab('knowledge'); setSelectedMsg(null); setViewMode('project') }}
        onProjectsChange={refreshProjects}
        viewMode={viewMode}
        onViewMode={setViewMode}
      />

      <div style={{ flex: 1, display: 'flex', flexDirection: 'column', overflow: 'hidden', minWidth: 0 }}>
        <TopBar
          project={activeProject}
          activeTab={activeTab}
          onTab={setActiveTab}
          pendingCount={activeProject?.pending_count ?? 0}
          riskCount={jiraRiskCount}
          chatOpen={chatOpen}
          onToggleChat={() => setChatOpen(o => !o)}
          viewMode={viewMode}
          currentRole={currentRole}
        />

        <div ref={containerRef} style={{ flex: 1, display: 'flex', overflow: 'hidden', position: 'relative' }}>
          {/* Dashboard view */}
          {viewMode === 'dashboard' && (
            <BossDashboard onNavigateProject={(id) => { setActiveProjectId(id); setActiveTab('slack'); setViewMode('project') }} />
          )}

          {/* User management view */}
          {viewMode === 'users' && canManageUsers(currentRole) && (
            <UserManager />
          )}

          {/* Knowledge tab: Sources left + Chat right (resizable + collapsible) */}
          {viewMode === 'project' && activeTab === 'knowledge' && activeProject && (
            <>
              {/* Sources panel — expands to fill when chat is closed */}
              <div style={{ flex: chatOpen ? `0 0 ${100 - chatWidth}%` : '1 1 100%', minWidth: 260, display: 'flex', overflow: 'hidden', transition: dragging.current ? 'none' : 'flex .2s ease' }}>
                <SourcesPanel projectId={activeProject.id} />
              </div>

              {/* Drag handle */}
              {chatOpen && (
                <div
                  onMouseDown={onMouseDown}
                  style={{
                    width: 4, cursor: 'col-resize', background: 'var(--color-border-default)', flexShrink: 0,
                    position: 'relative', zIndex: 2, transition: 'all .2s ease',
                    borderRadius: 'var(--radius-sm)',
                  }}
                  onMouseEnter={e => { e.currentTarget.style.background = 'var(--color-accent)'; e.currentTarget.style.width = '5px' }}
                  onMouseLeave={e => { if (!dragging.current) { e.currentTarget.style.background = 'var(--color-border-default)'; e.currentTarget.style.width = '4px' } }}
                />
              )}

              {/* Chat panel */}
              {chatOpen && (
                <div style={{ flex: `0 0 ${chatWidth}%`, display: 'flex', overflow: 'hidden', transition: dragging.current ? 'none' : 'flex .2s ease' }}>
                  <ChatModule projectId={activeProject.id} projectName={activeProject.name} />
                </div>
              )}

            </>
          )}

          {/* Slack feed tab */}
          {viewMode === 'project' && activeTab === 'slack' && activeProject && (
            <>
              <SlackFeed
                projectId={activeProject.id}
                selectedMsgId={selectedMsg?.id ?? null}
                onSelect={setSelectedMsg}
                onCountChange={refreshProjects}
              />
              <ReplyPanel
                message={selectedMsg}
                projectId={activeProject.id}
                currentRole={currentRole}
                currentUserId={currentUser?.id ?? ''}
                onStatusChange={(msg) => {
                  setSelectedMsg(msg)
                  refreshProjects()
                }}
              />
            </>
          )}

          {/* Tool tab (jira/monday/etc.) */}
          {viewMode === 'project' && activeTab === 'tool' && activeProject && (
            <JiraBoard projectId={activeProject.id} onRiskCountChange={setJiraRiskCount} />
          )}

          {/* Settings tab (boss only) */}
          {viewMode === 'project' && activeTab === 'settings' && activeProject && (
            <ProjectSettings project={activeProject} onProjectChange={refreshProjects} />
          )}

          {viewMode === 'project' && !activeProject && (
            <div style={{ flex: 1, display: 'flex', alignItems: 'center', justifyContent: 'center', color: 'var(--color-text-tertiary)', fontSize: 'var(--text-sm)', fontWeight: 500 }}>
              select a project to begin
            </div>
          )}
        </div>

        {/* n8n Status Bar */}
        {activeProject && (
          <IntegrationStatusBar project={activeProject} jiraRiskCount={jiraRiskCount} />
        )}
      </div>
    </div>
  )
}

function IntegrationStatusBar({ project, jiraRiskCount }: { project: Project & { pending_count: number }; jiraRiskCount: number }) {
  const [githubRepos, setGithubRepos] = useState<GithubRepo[]>([])
  const [jiraCount, setJiraCount] = useState(0)

  useEffect(() => {
    fetch(`/api/github?project_id=${project.id}`)
      .then(r => r.json())
      .then(data => setGithubRepos(Array.isArray(data) ? data : []))
      .catch(() => setGithubRepos([]))
    fetch(`/api/jira?project_id=${project.id}`)
      .then(r => r.json())
      .then(data => setJiraCount(data.tickets?.length || 0))
      .catch(() => setJiraCount(0))
  }, [project.id])

  const hasSlack = !!project.slack_workspace
  const hasJira = jiraCount > 0
  const hasGithub = githubRepos.length > 0

  if (!hasSlack && !hasJira && !hasGithub) return null

  const parts: string[] = []
  if (hasSlack) parts.push(`slack · ${project.slack_workspace}`)
  const toolName = project.tool && project.tool !== 'none' ? project.tool : 'jira'
  if (hasJira) parts.push(`${toolName} · ${jiraCount} tickets${jiraRiskCount > 0 ? ` · ${jiraRiskCount} risks` : ''}`)
  if (hasGithub) parts.push(`github · ${githubRepos.length} repo${githubRepos.length > 1 ? 's' : ''}`)

  return (
    <div style={{ padding: 'var(--space-2) var(--space-8)', background: 'var(--color-bg-raised)', display: 'flex', alignItems: 'center', gap: 'var(--space-3)', fontSize: 'var(--text-xs)', fontWeight: 500, color: 'var(--color-text-tertiary)', flexShrink: 0 }}>
      <span style={{ width: 7, height: 7, borderRadius: 'var(--radius-full)', background: 'var(--color-success)', display: 'inline-block', boxShadow: '0 0 8px var(--color-success)' }} className="animate-pulse-dot" />
      <span style={{ color: 'var(--color-success)', fontWeight: 600 }}>n8n connected</span>
      <span style={{ color: 'var(--color-border-strong)' }}>·</span>
      {parts.join(' · ')}
    </div>
  )
}
