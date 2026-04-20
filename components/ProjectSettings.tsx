'use client'
import { useState, useEffect, useCallback } from 'react'
import type { Project, ProjectIntegration } from '@/lib/types'
import TeamManager from './TeamManager'

interface Props {
  project: Project
  onProjectChange: () => void
}

const INTEGRATION_TYPES = [
  { value: 'slack',   label: 'Slack',    icon: '💬', fields: ['workspace_id', 'channel_filter'] },
  { value: 'jira',    label: 'Jira',     icon: '📋', fields: ['base_url', 'project_key', 'api_token'] },
  { value: 'github',  label: 'GitHub',   icon: '🐙', fields: ['repo_url', 'access_token'] },
  { value: 'monday',  label: 'Monday',   icon: '📅', fields: ['board_id', 'api_key'] },
  { value: 'asana',   label: 'Asana',    icon: '✅', fields: ['project_gid', 'access_token'] },
  { value: 'trello',  label: 'Trello',   icon: '📌', fields: ['board_id', 'api_key'] },
  { value: 'linear',  label: 'Linear',   icon: '📐', fields: ['team_id', 'api_key'] },
  { value: 'notion',  label: 'Notion',   icon: '📝', fields: ['database_id', 'api_key'] },
  { value: 'drive',   label: 'Google Drive', icon: '📁', fields: ['folder_id', 'service_account'] },
  { value: 'custom',  label: 'Custom',   icon: '🔧', fields: ['endpoint', 'api_key'] },
]

type Tab = 'integrations' | 'team' | 'general'

export default function ProjectSettings({ project, onProjectChange }: Props) {
  const [tab, setTab] = useState<Tab>('integrations')
  const [integrations, setIntegrations] = useState<ProjectIntegration[]>([])
  const [showAdd, setShowAdd] = useState(false)
  const [addType, setAddType] = useState('')
  const [addWebhook, setAddWebhook] = useState('')
  const [addConfig, setAddConfig] = useState<Record<string, string>>({})
  const [loading, setLoading] = useState(false)
  const [editName, setEditName] = useState(project.name)
  const [editWorkspace, setEditWorkspace] = useState(project.slack_workspace || '')

  const loadIntegrations = useCallback(() => {
    fetch(`/api/integrations?project_id=${project.id}`)
      .then(r => r.json())
      .then(data => setIntegrations(Array.isArray(data) ? data : []))
  }, [project.id])

  useEffect(() => { loadIntegrations() }, [loadIntegrations])
  useEffect(() => { setEditName(project.name); setEditWorkspace(project.slack_workspace || '') }, [project])

  async function addIntegration() {
    if (!addType) return
    setLoading(true)
    await fetch('/api/integrations', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        project_id: project.id,
        type: addType,
        label: INTEGRATION_TYPES.find(t => t.value === addType)?.label || addType,
        config: addConfig,
        n8n_webhook_url: addWebhook,
      }),
    })
    setAddType('')
    setAddWebhook('')
    setAddConfig({})
    setShowAdd(false)
    setLoading(false)
    loadIntegrations()
  }

  async function removeIntegration(id: string) {
    await fetch(`/api/integrations/${id}`, { method: 'DELETE' })
    loadIntegrations()
  }

  async function toggleIntegration(id: string, active: boolean) {
    await fetch(`/api/integrations/${id}`, {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ active }),
    })
    loadIntegrations()
  }

  async function saveGeneral() {
    setLoading(true)
    await fetch(`/api/projects/${project.id}`, {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ name: editName, slack_workspace: editWorkspace || null }),
    })
    setLoading(false)
    onProjectChange()
  }

  const selectedType = INTEGRATION_TYPES.find(t => t.value === addType)
  const usedTypes = new Set(integrations.map(i => i.type))

  const tabBtn = (key: Tab, label: string) => (
    <button
      key={key}
      onClick={() => setTab(key)}
      style={{
        padding: '6px 14px', borderRadius: 6, fontSize: 12, cursor: 'pointer', border: '1px solid',
        fontFamily: 'IBM Plex Mono, monospace', transition: '.15s',
        background: tab === key ? 'var(--blue-bg)' : 'transparent',
        color: tab === key ? 'var(--blue)' : 'var(--tx1)',
        borderColor: tab === key ? 'var(--blue-bd)' : 'transparent',
      }}
    >
      {label}
    </button>
  )

  return (
    <div style={{ flex: 1, display: 'flex', flexDirection: 'column', overflow: 'hidden' }}>
      {/* Sub-tabs */}
      <div style={{ padding: '10px 18px', borderBottom: '1px solid var(--bd)', display: 'flex', gap: 4, flexShrink: 0 }}>
        {tabBtn('general', 'general')}
        {tabBtn('integrations', 'integrations')}
        {tabBtn('team', 'team')}
      </div>

      {/* General tab */}
      {tab === 'general' && (
        <div style={{ padding: '18px', flex: 1, overflowY: 'auto' }}>
          <div style={{ fontSize: 14, fontWeight: 600, color: 'var(--tx0)', marginBottom: 14 }}>Project Settings</div>
          <div style={{ display: 'flex', flexDirection: 'column', gap: 12, maxWidth: 500 }}>
            <div>
              <label style={{ fontSize: 11, color: 'var(--tx2)', fontFamily: 'IBM Plex Mono, monospace', display: 'block', marginBottom: 4 }}>Project Name</label>
              <input
                value={editName}
                onChange={e => setEditName(e.target.value)}
                style={{ width: '100%', background: 'var(--bg3)', border: '1px solid var(--bd)', borderRadius: 6, padding: '8px 12px', fontSize: 13, color: 'var(--tx0)', outline: 'none' }}
              />
            </div>
            <div>
              <label style={{ fontSize: 11, color: 'var(--tx2)', fontFamily: 'IBM Plex Mono, monospace', display: 'block', marginBottom: 4 }}>Slack Workspace ID (for n8n)</label>
              <input
                value={editWorkspace}
                onChange={e => setEditWorkspace(e.target.value)}
                placeholder="e.g. neopets.slack.com"
                style={{ width: '100%', background: 'var(--bg3)', border: '1px solid var(--bd)', borderRadius: 6, padding: '8px 12px', fontSize: 12, color: 'var(--tx0)', outline: 'none', fontFamily: 'IBM Plex Mono, monospace' }}
              />
            </div>
            <button
              onClick={saveGeneral}
              disabled={loading}
              style={{ alignSelf: 'flex-start', padding: '8px 20px', background: 'var(--blue)', border: 'none', borderRadius: 6, fontSize: 12, color: '#fff', cursor: 'pointer', fontFamily: 'IBM Plex Mono, monospace', fontWeight: 500 }}
            >
              {loading ? 'saving...' : 'save changes'}
            </button>
          </div>
        </div>
      )}

      {/* Integrations tab */}
      {tab === 'integrations' && (
        <div style={{ flex: 1, display: 'flex', flexDirection: 'column', overflow: 'hidden' }}>
          <div style={{ padding: '14px 18px', display: 'flex', alignItems: 'center', justifyContent: 'space-between', flexShrink: 0 }}>
            <div>
              <div style={{ fontSize: 14, fontWeight: 600, color: 'var(--tx0)' }}>Integrations</div>
              <div style={{ fontSize: 11, color: 'var(--tx2)', fontFamily: 'IBM Plex Mono, monospace', marginTop: 2 }}>
                {integrations.length} configured
              </div>
            </div>
            {!showAdd && (
              <button
                onClick={() => setShowAdd(true)}
                style={{ padding: '6px 14px', background: 'var(--blue)', border: 'none', borderRadius: 6, fontSize: 12, color: '#fff', cursor: 'pointer', fontFamily: 'IBM Plex Mono, monospace', fontWeight: 500 }}
              >
                + add integration
              </button>
            )}
          </div>

          {/* Add integration form */}
          {showAdd && (
            <div style={{ padding: '12px 18px', borderBottom: '1px solid var(--bd)', background: 'var(--bg2)' }}>
              <div style={{ fontSize: 11, color: 'var(--tx2)', fontFamily: 'IBM Plex Mono, monospace', marginBottom: 8 }}>NEW INTEGRATION</div>

              {/* Type selector as grid */}
              <div style={{ display: 'flex', gap: 6, flexWrap: 'wrap', marginBottom: 10 }}>
                {INTEGRATION_TYPES.filter(t => !usedTypes.has(t.value)).map(t => (
                  <button
                    key={t.value}
                    onClick={() => { setAddType(t.value); setAddConfig({}) }}
                    style={{
                      padding: '6px 12px', borderRadius: 6, fontSize: 11, cursor: 'pointer', border: '1px solid',
                      fontFamily: 'IBM Plex Mono, monospace', transition: '.15s',
                      background: addType === t.value ? 'var(--blue-bg)' : 'var(--bg3)',
                      color: addType === t.value ? 'var(--blue)' : 'var(--tx1)',
                      borderColor: addType === t.value ? 'var(--blue-bd)' : 'var(--bd)',
                    }}
                  >
                    {t.icon} {t.label}
                  </button>
                ))}
              </div>

              {/* Config fields */}
              {selectedType && (
                <div style={{ display: 'flex', flexDirection: 'column', gap: 6, marginBottom: 10 }}>
                  {selectedType.fields.map(field => (
                    <input
                      key={field}
                      value={addConfig[field] || ''}
                      onChange={e => setAddConfig({ ...addConfig, [field]: e.target.value })}
                      placeholder={field.replace(/_/g, ' ')}
                      style={{ width: '100%', background: 'var(--bg3)', border: '1px solid var(--bd)', borderRadius: 6, padding: '6px 10px', fontSize: 11, color: 'var(--tx0)', outline: 'none', fontFamily: 'IBM Plex Mono, monospace' }}
                    />
                  ))}
                  <input
                    value={addWebhook}
                    onChange={e => setAddWebhook(e.target.value)}
                    placeholder="n8n webhook URL (optional)"
                    style={{ width: '100%', background: 'var(--bg3)', border: '1px solid var(--bd)', borderRadius: 6, padding: '6px 10px', fontSize: 11, color: 'var(--tx0)', outline: 'none', fontFamily: 'IBM Plex Mono, monospace' }}
                  />
                </div>
              )}

              <div style={{ display: 'flex', gap: 6 }}>
                <button
                  onClick={addIntegration}
                  disabled={loading || !addType}
                  style={{ padding: '6px 16px', background: 'var(--blue)', border: 'none', borderRadius: 6, fontSize: 12, color: '#fff', cursor: addType ? 'pointer' : 'not-allowed', fontFamily: 'IBM Plex Mono, monospace', opacity: addType ? 1 : 0.5 }}
                >
                  {loading ? '...' : 'add'}
                </button>
                <button
                  onClick={() => { setShowAdd(false); setAddType(''); setAddConfig({}) }}
                  style={{ padding: '6px 12px', background: 'transparent', border: '1px solid var(--bd)', borderRadius: 6, fontSize: 12, color: 'var(--tx1)', cursor: 'pointer' }}
                >
                  cancel
                </button>
              </div>
            </div>
          )}

          {/* Integration list */}
          <div style={{ flex: 1, overflowY: 'auto', padding: '8px 12px' }}>
            {integrations.length === 0 && !showAdd && (
              <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', gap: 8, color: 'var(--tx2)', marginTop: 60 }}>
                <div style={{ fontSize: 28 }}>🔌</div>
                <span style={{ fontSize: 12, fontFamily: 'IBM Plex Mono, monospace' }}>no integrations</span>
                <span style={{ fontSize: 11 }}>add Slack, Jira, GitHub, etc.</span>
              </div>
            )}
            {integrations.map(integ => {
              const typeInfo = INTEGRATION_TYPES.find(t => t.value === integ.type)
              let config: Record<string, string> = {}
              try { config = JSON.parse(integ.config) } catch {}
              const configEntries = Object.entries(config).filter(([, v]) => v)

              return (
                <div
                  key={integ.id}
                  style={{
                    padding: '10px 12px', background: 'var(--bg2)', border: '1px solid var(--bd)', borderRadius: 8, marginBottom: 6,
                    opacity: integ.active ? 1 : 0.5,
                    borderLeft: `3px solid ${integ.active ? 'var(--green)' : 'var(--tx2)'}`,
                  }}
                >
                  <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                    <span style={{ fontSize: 16 }}>{typeInfo?.icon || '🔧'}</span>
                    <div style={{ flex: 1, minWidth: 0 }}>
                      <div style={{ fontSize: 13, fontWeight: 500, color: 'var(--tx0)' }}>{integ.label || integ.type}</div>
                      {integ.n8n_webhook_url && (
                        <div style={{ fontSize: 10, color: 'var(--tx2)', fontFamily: 'IBM Plex Mono, monospace', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                          webhook: {integ.n8n_webhook_url}
                        </div>
                      )}
                    </div>
                    <span style={{ fontSize: 10, fontFamily: 'IBM Plex Mono, monospace', color: integ.active ? 'var(--green)' : 'var(--tx2)' }}>
                      {integ.active ? 'active' : 'disabled'}
                    </span>
                    <button
                      onClick={() => toggleIntegration(integ.id, !integ.active)}
                      style={{ background: 'transparent', border: '1px solid var(--bd)', borderRadius: 4, color: 'var(--tx2)', cursor: 'pointer', fontSize: 10, padding: '3px 8px', fontFamily: 'IBM Plex Mono, monospace' }}
                    >
                      {integ.active ? 'disable' : 'enable'}
                    </button>
                    <button
                      onClick={() => removeIntegration(integ.id)}
                      style={{ background: 'transparent', border: 'none', color: 'var(--tx2)', cursor: 'pointer', fontSize: 13, padding: '2px 4px' }}
                      onMouseEnter={e => (e.currentTarget.style.color = 'var(--red)')}
                      onMouseLeave={e => (e.currentTarget.style.color = 'var(--tx2)')}
                      title="Remove"
                    >
                      ✕
                    </button>
                  </div>
                  {configEntries.length > 0 && (
                    <div style={{ marginTop: 6, display: 'flex', gap: 6, flexWrap: 'wrap' }}>
                      {configEntries.map(([k, v]) => (
                        <span key={k} style={{ fontSize: 10, fontFamily: 'IBM Plex Mono, monospace', color: 'var(--tx2)', background: 'var(--bg3)', padding: '2px 6px', borderRadius: 4 }}>
                          {k}: {v}
                        </span>
                      ))}
                    </div>
                  )}
                </div>
              )
            })}
          </div>
        </div>
      )}

      {/* Team tab */}
      {tab === 'team' && (
        <TeamManager projectId={project.id} />
      )}
    </div>
  )
}
