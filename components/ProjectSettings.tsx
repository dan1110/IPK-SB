'use client'
import { useState, useEffect, useCallback } from 'react'
import { MessageSquare, ClipboardList, GitBranch, Calendar, CheckCircle, Pin, Ruler, FileText, FolderOpen, Wrench, Plug, X } from 'lucide-react'
import type { Project, ProjectIntegration } from '@/lib/types'
import TeamManager from './TeamManager'
import ConfirmModal from './ConfirmModal'

interface Props {
  project: Project
  onProjectChange: () => void
}

const INTEGRATION_TYPES = [
  { value: 'slack',   label: 'Slack',    Icon: MessageSquare, fields: ['workspace_id', 'channel_filter'] },
  { value: 'jira',    label: 'Jira',     Icon: ClipboardList, fields: ['base_url', 'project_key', 'api_token'] },
  { value: 'github',  label: 'GitHub',   Icon: GitBranch, fields: ['repo_url', 'access_token'] },
  { value: 'monday',  label: 'Monday',   Icon: Calendar, fields: ['board_id', 'api_key'] },
  { value: 'asana',   label: 'Asana',    Icon: CheckCircle, fields: ['project_gid', 'access_token'] },
  { value: 'trello',  label: 'Trello',   Icon: Pin, fields: ['board_id', 'api_key'] },
  { value: 'linear',  label: 'Linear',   Icon: Ruler, fields: ['team_id', 'api_key'] },
  { value: 'notion',  label: 'Notion',   Icon: FileText, fields: ['database_id', 'api_key'] },
  { value: 'drive',   label: 'Google Drive', Icon: FolderOpen, fields: ['folder_id', 'service_account'] },
  { value: 'custom',  label: 'Custom',   Icon: Wrench, fields: ['endpoint', 'api_key'] },
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

  const [deleteIntegId, setDeleteIntegId] = useState<string | null>(null)
  const [deleting, setDeleting] = useState(false)
  const [isDropdownOpen, setIsDropdownOpen] = useState(false)

  const loadIntegrations = useCallback(() => {
    fetch(`/api/integrations?project_id=${project.id}`)
      .then(r => r.json())
      .then(data => setIntegrations(Array.isArray(data) ? data : []))
  }, [project.id])

  useEffect(() => { loadIntegrations() }, [loadIntegrations])
  useEffect(() => { setEditName(project.name) }, [project])

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

  async function removeIntegration() {
    if (!deleteIntegId) return
    setDeleting(true)
    await fetch(`/api/integrations/${deleteIntegId}`, { method: 'DELETE' })
    setDeleting(false)
    setDeleteIntegId(null)
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
      body: JSON.stringify({ name: editName }),
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
        padding: 'var(--space-1-5) var(--space-4)', borderRadius: 'var(--radius-lg)', fontSize: 'var(--text-sm)', cursor: 'pointer', border: 'none',
        fontWeight: tab === key ? 600 : 500, transition: 'var(--duration-fast) var(--ease-default)',
        background: tab === key ? 'var(--bg2)' : 'transparent',
        color: tab === key ? 'var(--tx0)' : 'var(--tx2)',
        boxShadow: tab === key ? 'var(--shadow-sm)' : 'none',
      }}
    >
      {label}
    </button>
  )

  return (
    <div style={{ flex: 1, display: 'flex', flexDirection: 'column', overflow: 'hidden', background: 'var(--bg1)' }}>
      {/* Sub-tabs */}
      <div style={{ padding: 'var(--space-3) var(--space-4)', borderBottom: '1px solid var(--bd)', display: 'flex', gap: 'var(--space-2)', flexShrink: 0, background: 'var(--bg1)' }}>
        {tabBtn('general', 'General')}
        {tabBtn('integrations', 'Integrations')}
        {tabBtn('team', 'Team Members')}
      </div>

      {/* General tab */}
      {tab === 'general' && (
        <div className="animate-fade-in" style={{ padding: 'var(--space-6)', flex: 1, overflowY: 'auto' }}>
          <div style={{ fontSize: 'var(--text-xl)', fontWeight: 700, color: 'var(--tx0)', marginBottom: 'var(--space-6)', letterSpacing: 'var(--tracking-tight)' }}>General Settings</div>
          <div style={{ display: 'flex', flexDirection: 'column', gap: 'var(--space-5)', maxWidth: 500 }}>
            <div>
              <label style={{ fontSize: 'var(--text-xs)', color: 'var(--tx2)', display: 'block', marginBottom: 'var(--space-2)', fontWeight: 700, textTransform: 'uppercase', letterSpacing: 'var(--tracking-wide)' }}>Project Name</label>
              <input
                value={editName}
                onChange={e => setEditName(e.target.value)}
                style={{ width: '100%', background: 'var(--bg3)', border: '1px solid var(--bd)', borderRadius: 'var(--radius-xl)', padding: 'var(--space-3) var(--space-4)', fontSize: 'var(--text-base)', color: 'var(--tx0)', outline: 'none' }}
              />
            </div>
            <button
              onClick={saveGeneral}
              disabled={loading}
              style={{ alignSelf: 'flex-start', padding: 'var(--space-2-5) var(--space-6)', background: 'var(--brand)', border: 'none', borderRadius: 'var(--radius-lg)', fontSize: 'var(--text-sm)', color: '#fff', cursor: 'pointer', fontWeight: 600, transition: 'all var(--duration-fast)', opacity: loading ? 0.7 : 1 }}
            >
              {loading ? 'Saving...' : 'Save Changes'}
            </button>
          </div>
        </div>
      )}

      {/* Integrations tab */}
      {tab === 'integrations' && (
        <div className="animate-fade-in" style={{ flex: 1, display: 'flex', flexDirection: 'column', overflow: 'hidden' }}>
          <div style={{ padding: 'var(--space-5) var(--space-6) var(--space-4)', display: 'flex', alignItems: 'center', justifyContent: 'space-between', flexShrink: 0 }}>
            <div>
              <div style={{ fontSize: 'var(--text-xl)', fontWeight: 700, color: 'var(--tx0)', letterSpacing: 'var(--tracking-tight)' }}>Integrations</div>
              <div style={{ fontSize: 'var(--text-sm)', color: 'var(--tx2)', marginTop: 'var(--space-1)', fontWeight: 500 }}>
                {integrations.length} {integrations.length === 1 ? 'integration' : 'integrations'} connected. Connect tools natively or via n8n.
              </div>
            </div>
            {!showAdd && (
              <button
                onClick={() => setShowAdd(true)}
                style={{ padding: 'var(--space-2-5) var(--space-5)', background: 'var(--brand)', border: 'none', borderRadius: 'var(--radius-lg)', fontSize: 'var(--text-sm)', color: '#fff', cursor: 'pointer', fontWeight: 600, transition: 'all var(--duration-fast)' }}
              >
                + Add Integration
              </button>
            )}
          </div>

          {/* Add integration form */}
          {showAdd && (
            <div className="animate-fade-in" style={{ padding: '0 var(--space-6)', flexShrink: 0, marginBottom: 'var(--space-6)' }}>
              <div style={{ background: 'var(--bg2)', padding: 'var(--space-5)', borderRadius: 'var(--radius-2xl)', border: '1px solid var(--bd)', boxShadow: 'var(--shadow-sm)' }}>
                <div style={{ fontSize: 'var(--text-sm)', color: 'var(--tx1)', fontWeight: 600, marginBottom: 'var(--space-4)' }}>Configure New Integration</div>

                <div style={{ display: 'grid', gap: 'var(--space-4)' }}>
                  {/* Select integration type */}
                  <div>
                    <label style={{ fontSize: 'var(--text-xs)', color: 'var(--tx2)', display: 'block', marginBottom: 'var(--space-2)', fontWeight: 700, textTransform: 'uppercase', letterSpacing: 'var(--tracking-wide)' }}>Type</label>
                    <div style={{ position: 'relative' }}>
                      <div
                        onClick={() => setIsDropdownOpen(!isDropdownOpen)}
                        style={{ width: '100%', background: 'var(--bg3)', border: '1px solid var(--bd)', borderRadius: 'var(--radius-xl)', padding: 'var(--space-2-5) var(--space-4)', fontSize: 'var(--text-sm)', color: 'var(--tx0)', cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}
                      >
                        {addType ? (
                          <div style={{ display: 'flex', alignItems: 'center', gap: 'var(--space-2)' }}>
                            {(() => { const SelType = INTEGRATION_TYPES.find(t => t.value === addType); return SelType ? <><SelType.Icon size={16} /> {SelType.label}</> : 'Choose an app or tool...' })()}
                          </div>
                        ) : 'Choose an app or tool...'}
                        <span style={{ fontSize: '10px', color: 'var(--tx2)' }}>▼</span>
                      </div>
                      
                      {isDropdownOpen && (
                        <div style={{ position: 'absolute', top: 'calc(100% + 4px)', left: 0, right: 0, background: 'var(--bg2)', border: '1px solid var(--bd)', borderRadius: 'var(--radius-xl)', padding: 'var(--space-1)', zIndex: 10, boxShadow: 'var(--shadow-float)', maxHeight: 200, overflowY: 'auto' }}>
                          {INTEGRATION_TYPES.filter(t => !usedTypes.has(t.value)).map(t => (
                            <div
                              key={t.value}
                              onClick={() => { setAddType(t.value); setAddConfig({}); setIsDropdownOpen(false) }}
                              style={{ padding: 'var(--space-2) var(--space-4)', display: 'flex', alignItems: 'center', gap: 'var(--space-3)', cursor: 'pointer', borderRadius: 'var(--radius-lg)', transition: 'background var(--duration-fast)' }}
                              onMouseEnter={e => e.currentTarget.style.background = 'var(--bg3)'}
                              onMouseLeave={e => e.currentTarget.style.background = 'transparent'}
                            >
                              <t.Icon size={16} color="var(--brand)" />
                              <span style={{ fontSize: 'var(--text-sm)', color: 'var(--tx0)', fontWeight: 600 }}>{t.label}</span>
                            </div>
                          ))}
                        </div>
                      )}
                    </div>
                  </div>

                  {/* Config fields shown once type is selected */}
                  {selectedType && (
                    <div style={{ display: 'flex', flexDirection: 'column', gap: 'var(--space-4)', marginTop: 'var(--space-2)', borderTop: '1px solid var(--bd)', paddingTop: 'var(--space-4)' }}>
                      {selectedType.fields.map(field => (
                        <div key={field}>
                          <label style={{ fontSize: 'var(--text-xs)', color: 'var(--tx2)', display: 'block', marginBottom: 'var(--space-2)', fontWeight: 700, textTransform: 'uppercase', letterSpacing: 'var(--tracking-wide)' }}>
                            {field.replace(/_/g, ' ')}
                          </label>
                          <input
                            value={addConfig[field] || ''}
                            onChange={e => setAddConfig({ ...addConfig, [field]: e.target.value })}
                            placeholder={`Enter ${field.replace(/_/g, ' ')}`}
                            style={{ width: '100%', background: 'var(--bg3)', border: '1px solid var(--bd)', borderRadius: 'var(--radius-xl)', padding: 'var(--space-2-5) var(--space-4)', fontSize: 'var(--text-sm)', color: 'var(--tx0)', outline: 'none' }}
                          />
                        </div>
                      ))}
                      <div>
                        <label style={{ fontSize: 'var(--text-xs)', color: 'var(--tx2)', display: 'block', marginBottom: 'var(--space-2)', fontWeight: 700, textTransform: 'uppercase', letterSpacing: 'var(--tracking-wide)' }}>
                          n8n Webhook URL (optional)
                        </label>
                        <input
                          value={addWebhook}
                          onChange={e => setAddWebhook(e.target.value)}
                          placeholder="https://your-n8n-instance.com/webhook/..."
                          style={{ width: '100%', background: 'var(--bg3)', border: '1px solid var(--bd)', borderRadius: 'var(--radius-xl)', padding: 'var(--space-2-5) var(--space-4)', fontSize: 'var(--text-sm)', color: 'var(--tx0)', outline: 'none' }}
                        />
                      </div>
                    </div>
                  )}
                </div>

                <div style={{ display: 'flex', gap: 'var(--space-3)', marginTop: 'var(--space-6)', paddingTop: 'var(--space-4)', borderTop: '1px solid var(--bd)' }}>
                  <button
                    onClick={addIntegration}
                    disabled={loading || !addType}
                    style={{ padding: 'var(--space-2) var(--space-6)', background: 'var(--brand)', border: 'none', borderRadius: 'var(--radius-lg)', fontSize: 'var(--text-sm)', color: '#fff', cursor: addType ? 'pointer' : 'not-allowed', fontWeight: 600, opacity: addType ? 1 : 0.5, transition: 'all var(--duration-fast)' }}
                  >
                    {loading ? 'Adding...' : 'Add Integration'}
                  </button>
                  <button
                    onClick={() => { setShowAdd(false); setAddType(''); setAddConfig({}) }}
                    style={{ padding: 'var(--space-2) var(--space-5)', background: 'var(--bg3)', border: 'none', borderRadius: 'var(--radius-lg)', fontSize: 'var(--text-sm)', color: 'var(--tx0)', cursor: 'pointer', fontWeight: 600, transition: 'all var(--duration-fast)' }}
                  >
                    Cancel
                  </button>
                </div>
              </div>
            </div>
          )}

          {/* Integration list */}
          <div style={{ flex: 1, overflowY: 'auto', padding: '0 var(--space-6) var(--space-6)' }}>
            {integrations.length === 0 && !showAdd && (
              <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', gap: 'var(--space-4)', color: 'var(--tx2)', marginTop: 'var(--space-16)' }}>
                <div style={{ background: 'var(--bg2)', padding: 'var(--space-5)', borderRadius: 'var(--radius-full)', border: '1px solid var(--bd)' }}>
                  <Plug size={32} color="var(--tx2)" />
                </div>
                <div style={{ textAlign: 'center' }}>
                  <div style={{ fontSize: 'var(--text-base)', fontWeight: 600, color: 'var(--tx0)', marginBottom: 'var(--space-1)' }}>No integrations connected</div>
                  <div style={{ fontSize: 'var(--text-sm)', color: 'var(--tx2)' }}>Connect Jira, GitHub, Notion, and more to synchronize context.</div>
                </div>
                <button
                  onClick={() => setShowAdd(true)}
                  style={{ padding: 'var(--space-2) var(--space-5)', background: 'var(--bg3)', border: '1px solid var(--bd)', borderRadius: 'var(--radius-lg)', fontSize: 'var(--text-sm)', color: 'var(--tx0)', cursor: 'pointer', fontWeight: 600, marginTop: 'var(--space-2)', transition: 'all var(--duration-fast)' }}
                >
                  Add your first integration
                </button>
              </div>
            )}
            
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(360px, 1fr))', gap: 'var(--space-4)' }}>
              {integrations.map(integ => {
                const typeInfo = INTEGRATION_TYPES.find(t => t.value === integ.type)
                let config: Record<string, string> = {}
                try { config = JSON.parse(integ.config) } catch {}
                const configEntries = Object.entries(config).filter(([, v]) => v)
                const TypeIcon = typeInfo?.Icon || Wrench

                return (
                  <div
                    key={integ.id}
                    style={{
                      padding: 'var(--space-5)', background: 'var(--bg2)', border: '1px solid var(--bd)', borderRadius: 'var(--radius-2xl)',
                      opacity: integ.active ? 1 : 0.6, transition: 'all var(--duration-default)',
                      boxShadow: 'var(--shadow-sm)',
                      display: 'flex', flexDirection: 'column'
                    }}
                  >
                    <div style={{ display: 'flex', alignItems: 'center', gap: 'var(--space-4)', marginBottom: 'var(--space-4)' }}>
                      <div style={{ width: 44, height: 44, background: integ.active ? 'var(--brand-bg)' : 'var(--bg3)', border: integ.active ? '1px solid var(--brand-bd)' : '1px solid var(--bd)', borderRadius: 'var(--radius-xl)', display: 'flex', alignItems: 'center', justifyContent: 'center', color: integ.active ? 'var(--brand)' : 'var(--tx2)', flexShrink: 0 }}>
                        <TypeIcon size={20} />
                      </div>
                      <div style={{ flex: 1, minWidth: 0 }}>
                        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                          <span style={{ fontSize: 'var(--text-base)', fontWeight: 600, color: 'var(--tx0)' }}>{integ.label || integ.type}</span>
                          <span style={{ fontSize: 'var(--text-xs)', color: integ.active ? 'var(--green)' : 'var(--tx2)', fontWeight: 700, background: integ.active ? 'var(--green-bg)' : 'var(--bg3)', padding: 'var(--space-1) var(--space-2)', borderRadius: 'var(--radius-md)' }}>
                            {integ.active ? 'ACTIVE' : 'DISABLED'}
                          </span>
                        </div>
                      </div>
                    </div>

                    <div style={{ flex: 1, background: 'var(--bg1)', padding: 'var(--space-4)', borderRadius: 'var(--radius-xl)', border: '1px solid var(--bd)', fontSize: 'var(--text-xs)', display: 'flex', flexDirection: 'column', gap: 'var(--space-2)' }}>
                      {configEntries.length > 0 ? configEntries.map(([k, v]) => (
                        <div key={k} style={{ display: 'flex', flexDirection: 'column', gap: 2 }}>
                          <span style={{ color: 'var(--tx2)', fontWeight: 600, textTransform: 'uppercase', letterSpacing: '0.04em' }}>{k.replace(/_/g, ' ')}</span>
                          <span style={{ color: 'var(--tx0)', fontFamily: 'var(--font-mono)', wordBreak: 'break-all' }}>{v}</span>
                        </div>
                      )) : (
                        <span style={{ color: 'var(--tx2)', fontStyle: 'italic' }}>No custom configuration.</span>
                      )}
                      {integ.n8n_webhook_url && (
                        <div style={{ display: 'flex', flexDirection: 'column', gap: 2, marginTop: 'var(--space-2)' }}>
                          <span style={{ color: 'var(--tx2)', fontWeight: 600, textTransform: 'uppercase', letterSpacing: '0.04em' }}>Webhook URL</span>
                          <span style={{ color: 'var(--tx0)', fontFamily: 'var(--font-mono)', wordBreak: 'break-all' }}>{integ.n8n_webhook_url}</span>
                        </div>
                      )}
                    </div>

                    <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'flex-end', gap: 'var(--space-2)', marginTop: 'var(--space-4)', paddingTop: 'var(--space-4)', borderTop: '1px solid var(--bd)' }}>
                      <button
                        onClick={() => toggleIntegration(integ.id, !integ.active)}
                        style={{ padding: 'var(--space-1-5) var(--space-3)', background: 'var(--bg3)', border: 'none', borderRadius: 'var(--radius-md)', color: 'var(--tx1)', cursor: 'pointer', fontSize: 'var(--text-xs)', fontWeight: 600 }}
                      >
                        {integ.active ? 'Disable' : 'Enable'}
                      </button>
                      <button
                        onClick={() => setDeleteIntegId(integ.id)}
                        style={{ padding: 'var(--space-1-5) var(--space-3)', background: 'transparent', border: 'none', borderRadius: 'var(--radius-md)', color: 'var(--red)', cursor: 'pointer', fontSize: 'var(--text-xs)', fontWeight: 600 }}
                      >
                        Remove
                      </button>
                    </div>
                  </div>
                )
              })}
            </div>
          </div>
          {deleteIntegId && (
            <ConfirmModal
              title="Remove Integration"
              message="Are you sure you want to remove this integration? This action cannot be undone."
              confirmText={deleting ? "Removing..." : "Remove"}
              onConfirm={removeIntegration}
              onCancel={() => setDeleteIntegId(null)}
              danger={true}
            />
          )}
        </div>
      )}

      {/* Team tab */}
      {tab === 'team' && (
        <TeamManager projectId={project.id} />
      )}
    </div>
  )
}
