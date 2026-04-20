'use client'
import { useState, useEffect, useCallback, useRef } from 'react'
import { FileText, Mic, MessageSquare, PenLine, FolderOpen, Upload, Link, Film } from 'lucide-react'
import type { KnowledgePage, Meeting } from '@/lib/types'
import ConfirmModal from './ConfirmModal'

type SourceType = 'all' | 'document' | 'meeting' | 'slack'

interface Source {
  id: string
  type: 'document' | 'meeting' | 'slack'
  title: string
  subtitle: string
  date: string
  // Original data
  knowledge?: KnowledgePage
  meeting?: Meeting
}

const ICONS: Record<string, React.ReactNode> = {
  document: <FileText size={18} />,
  meeting: <Mic size={18} />,
  slack: <MessageSquare size={18} />,
}

export default function SourcesPanel({ projectId }: { projectId: string }) {
  const [pages, setPages] = useState<KnowledgePage[]>([])
  const [meetings, setMeetings] = useState<Meeting[]>([])
  const [expanded, setExpanded] = useState<string | null>(null)
  const [filter, setFilter] = useState<SourceType>('all')
  const [searchQ, setSearchQ] = useState('')

  // Add source state
  const [showAdd, setShowAdd] = useState(false)
  const [addMode, setAddMode] = useState<'text' | 'video' | 'paste' | 'drive' | 'file'>('paste')

  // Drive link
  const [driveUrl, setDriveUrl] = useState('')
  const [driveTitle, setDriveTitle] = useState('')

  // Upload text (AI process)
  const [uploadText, setUploadText] = useState('')
  const [uploading, setUploading] = useState(false)
  const [uploadResult, setUploadResult] = useState('')

  // New page (paste)
  const [pasteTitle, setPasteTitle] = useState('')
  const [pasteContent, setPasteContent] = useState('')

  // File upload (PDF/txt)
  const [selectedDocFile, setSelectedDocFile] = useState<File | null>(null)
  const docFileRef = useRef<HTMLInputElement>(null)

  // Video upload
  const [manualTitle, setManualTitle] = useState('')
  const [selectedFile, setSelectedFile] = useState<File | null>(null)
  const [dragOver, setDragOver] = useState(false)
  const [uploadProgress, setUploadProgress] = useState('')
  const [processing, setProcessing] = useState(false)
  const fileRef = useRef<HTMLInputElement>(null)

  // Editing knowledge page
  const [editing, setEditing] = useState<string | null>(null)
  const [editTitle, setEditTitle] = useState('')
  const [editContent, setEditContent] = useState('')

  // Translation cache: sourceId → translated text
  const [translations, setTranslations] = useState<Record<string, string>>({})
  const [translating, setTranslating] = useState<string | null>(null)
  const [showTranslation, setShowTranslation] = useState<Record<string, boolean>>({})

  const loadPages = useCallback(() => {
    const url = searchQ
      ? `/api/knowledge?project_id=${projectId}&q=${encodeURIComponent(searchQ)}`
      : `/api/knowledge?project_id=${projectId}`
    fetch(url).then(r => r.json()).then(setPages)
  }, [projectId, searchQ])

  const loadMeetings = useCallback(() => {
    fetch(`/api/meetings?project_id=${projectId}`).then(r => r.json()).then(setMeetings)
  }, [projectId])

  useEffect(() => { loadPages() }, [loadPages])
  useEffect(() => { loadMeetings() }, [loadMeetings])

  const reload = () => { loadPages(); loadMeetings() }

  // Build unified source list
  const sources: Source[] = [
    ...pages.map(p => ({
      id: `k-${p.id}`,
      type: (p.source === 'slack' ? 'slack' : p.source === 'meeting' ? 'meeting' : 'document') as Source['type'],
      title: p.title,
      subtitle: p.source,
      date: p.updated_at,
      knowledge: p,
    })),
    ...meetings.map(m => ({
      id: `m-${m.id}`,
      type: 'meeting' as const,
      title: m.title,
      subtitle: `${m.date} · ${m.duration_minutes ? m.duration_minutes + 'm' : 'no duration'} · ${m.uploaded_by}`,
      date: m.created_at,
      meeting: m,
    })),
  ]
    .filter(s => filter === 'all' || s.type === filter)
    .sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime())

  // Actions
  const [deleteData, setDeleteData] = useState<{ id: string, type: 'knowledge' | 'meeting' } | null>(null)
  const [deletingItem, setDeletingItem] = useState(false)

  async function performDelete() {
    if (!deleteData) return
    setDeletingItem(true)
    if (deleteData.type === 'knowledge') {
      await fetch(`/api/knowledge/${deleteData.id}`, { method: 'DELETE' })
    } else {
      await fetch(`/api/meetings/${deleteData.id}`, { method: 'DELETE' })
    }
    setDeletingItem(false)
    setDeleteData(null)
    reload()
  }

  function deleteKnowledge(id: string) { setDeleteData({ id, type: 'knowledge' }) }
  function deleteMeeting(id: string) { setDeleteData({ id, type: 'meeting' }) }

  async function saveEdit(id: string) {
    await fetch(`/api/knowledge/${id}`, { method: 'PUT', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ title: editTitle, content: editContent }) })
    setEditing(null); reload()
  }

  async function processUploadText() {
    if (!uploadText.trim()) return
    setUploading(true); setUploadResult('')
    const res = await fetch('/api/upload', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ project_id: projectId, content: uploadText }) })
    const data = await res.json()
    setUploadResult(`${data.summary} (${data.creates} created, ${data.updates} updated)`)
    setUploadText(''); setUploading(false); reload()
  }

  async function submitDocFile() {
    if (!selectedDocFile) return
    setUploading(true); setUploadResult('')
    const form = new FormData()
    form.append('file', selectedDocFile)
    form.append('project_id', projectId)
    const res = await fetch('/api/upload/file', { method: 'POST', body: form })
    const data = await res.json()
    if (res.ok) {
      setUploadResult(`${data.summary} (${data.creates} created, ${data.updates} updated) — ${data.filename}`)
      setSelectedDocFile(null); setShowAdd(false); reload()
    } else {
      setUploadResult(`Error: ${data.error}`)
    }
    setUploading(false)
  }

  async function createPastePage() {
    if (!pasteTitle.trim()) return
    await fetch('/api/knowledge', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ project_id: projectId, title: pasteTitle.trim(), content: pasteContent }) })
    setPasteTitle(''); setPasteContent(''); setShowAdd(false); reload()
  }

  async function submitVideo() {
    if (!selectedFile) return
    setProcessing(true); setUploadResult(''); setUploadProgress('uploading video...')
    const form = new FormData()
    form.append('file', selectedFile)
    form.append('project_id', projectId)
    form.append('uploaded_by', 'steven')
    if (manualTitle) form.append('title', manualTitle)
    form.append('language', 'en-US')

    const stages = [
      'uploading video...',
      'extracting audio...',
      'transcribing...',
      'processing with AI...'
    ]
    let stageIdx = 0
    let isDone = false
    const initialMeetingCount = meetings.length

    // Simulated progress stages & polling
    const progressInterval = setInterval(async () => {
      if (isDone) return

      // Advance stages up to the last one
      stageIdx = Math.min(stageIdx + 1, stages.length - 1)
      setUploadProgress(stages[stageIdx])

      try {
        // Poll backend to check if meeting was successfully created while POST is still pending
        const r = await fetch(`/api/meetings?project_id=${projectId}`)
        if (r.ok) {
          const data = await r.json()
          if (data.length > initialMeetingCount) {
             isDone = true
             clearInterval(progressInterval)
             setUploadResult('Meeting created!')
             setSelectedFile(null); setManualTitle(''); setShowAdd(false);
             setProcessing(false); setUploadProgress('')
             reload()
          }
        }
      } catch (e) { /* ignore */ }
    }, 4000)

    try {
      const res = await fetch('/api/upload/video', { method: 'POST', body: form })
      const data = await res.json()

      if (!isDone) {
        isDone = true
        clearInterval(progressInterval)
        if (res.ok) {
          setUploadResult(`Meeting saved — ${data.duration_minutes ? data.duration_minutes + ' min · ' : ''}${data.knowledge_updated} knowledge pages updated`)
          setSelectedFile(null); setManualTitle(''); setShowAdd(false); reload()
        } else {
          setUploadResult(`Error: ${data.error}`)
        }
      }
    } catch (e) {
      if (!isDone) {
        setUploadResult(`Error during upload.`)
      }
    } finally {
      if (!isDone) {
        isDone = true
        clearInterval(progressInterval)
        setProcessing(false)
        setUploadProgress('')
      }
    }
  }

  async function translateText(sourceId: string, text: string) {
    if (translations[sourceId]) {
      setShowTranslation(prev => ({ ...prev, [sourceId]: !prev[sourceId] }))
      return
    }
    setTranslating(sourceId)
    try {
      const res = await fetch('/api/translate', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ text }),
      })
      const data = await res.json()
      if (data.translated) {
        setTranslations(prev => ({ ...prev, [sourceId]: data.translated }))
        setShowTranslation(prev => ({ ...prev, [sourceId]: true }))
      }
    } catch { /* ignore */ }
    setTranslating(null)
  }

  async function submitDrive() {
    if (!driveUrl.trim()) return
    setProcessing(true); setUploadResult(''); setUploadProgress('downloading from Drive...')
    const res = await fetch('/api/upload/drive', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ url: driveUrl, project_id: projectId, title: driveTitle || undefined, uploaded_by: 'steven', language: 'en-US' }),
    })
    const data = await res.json()
    if (res.ok) {
      setUploadResult(`Meeting saved — ${data.duration_minutes ? data.duration_minutes + ' min · ' : ''}${data.file_size_mb}MB · ${data.knowledge_updated} knowledge pages updated`)
      setDriveUrl(''); setDriveTitle(''); setShowAdd(false); reload()
    } else {
      setUploadResult(`Error: ${data.error}`)
    }
    setProcessing(false); setUploadProgress('')
  }

  function onDrop(e: React.DragEvent) {
    e.preventDefault(); setDragOver(false)
    const f = e.dataTransfer.files[0]
    if (f && f.name.match(/\.(mp4|webm|mov|mp3|wav|flac|m4a)$/i)) setSelectedFile(f)
  }

  function timeAgo(ts: string) {
    const diff = Date.now() - new Date(ts).getTime()
    const h = Math.floor(diff / 3600000)
    if (h < 1) return 'just now'
    if (h < 24) return `${h}h ago`
    return `${Math.floor(h / 24)}d ago`
  }

  const sourceCount = sources.length

  return (
    <div style={{ width: '100%', display: 'flex', flexDirection: 'column', overflow: 'hidden' }}>
      {/* Header */}
      <div style={{ padding: 'var(--space-5) var(--space-6) var(--space-4)', flexShrink: 0 }}>
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 'var(--space-4)' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 'var(--space-3)' }}>
            <span style={{ fontSize: 'var(--text-xl)', fontWeight: 700, color: 'var(--tx0)', letterSpacing: 'var(--tracking-tight)' }}>Sources</span>
            <span style={{ fontSize: 'var(--text-xs)', color: 'var(--tx2)', fontWeight: 600, background: 'var(--bg3)', padding: 'var(--space-1) var(--space-2)', borderRadius: 'var(--radius-lg)' }}>{sourceCount}</span>
          </div>
          <button
            onClick={() => setShowAdd(s => !s)}
            style={{
              padding: 'var(--space-2) var(--space-5)', borderRadius: 'var(--radius-xl)', fontSize: 'var(--text-sm)', cursor: 'pointer', border: 'none',
              transition: 'all var(--duration-fast) var(--ease-default)', fontWeight: 600,
              background: showAdd ? 'var(--bg3)' : 'var(--brand)', color: showAdd ? 'var(--tx1)' : '#fff',
            }}
          >
            + Add source
          </button>
        </div>

        {/* Search */}
        <input
          value={searchQ} onChange={e => setSearchQ(e.target.value)}
          placeholder="Search sources..."
          style={{ width: '100%', background: 'var(--bg3)', border: '1px solid var(--bd)', borderRadius: 'var(--radius-xl)', padding: 'var(--space-3) var(--space-4)', fontSize: 'var(--text-sm)', color: 'var(--tx0)', outline: 'none', marginBottom: 'var(--space-3)', transition: 'all var(--duration-fast)' }}
        />

        {/* Filter chips */}
        <div style={{ display: 'flex', gap: 'var(--space-2)' }}>
          {([
            { key: 'all', label: 'All', icon: null },
            { key: 'document', label: 'Docs', icon: <FileText size={14} style={{ marginRight: 'var(--space-2)' }} /> },
            { key: 'meeting', label: 'Meetings', icon: <Mic size={14} style={{ marginRight: 'var(--space-2)' }} /> },
            { key: 'slack', label: 'Slack', icon: <MessageSquare size={14} style={{ marginRight: 'var(--space-2)' }} /> },
          ] as { key: SourceType; label: string; icon: React.ReactNode }[]).map(f => (
            <button
              key={f.key}
              onClick={() => setFilter(f.key)}
              style={{
                padding: 'var(--space-2) var(--space-4)', borderRadius: 'var(--radius-lg)', fontSize: 'var(--text-sm)', cursor: 'pointer', 
                border: filter === f.key ? '1px solid var(--bd2)' : '1px solid transparent',
                transition: 'all var(--duration-fast) var(--ease-default)', fontWeight: filter === f.key ? 600 : 500,
                background: filter === f.key ? 'var(--bg1)' : 'transparent',
                color: filter === f.key ? 'var(--tx0)' : 'var(--tx2)',
                boxShadow: filter === f.key ? 'var(--shadow-card)' : 'none',
                display: 'flex', alignItems: 'center',
              }}
            >
              {f.icon}{f.label}
            </button>
          ))}
        </div>
      </div>

      {/* Add source panel */}
      {showAdd && (
        <div className="animate-fade-in" style={{ padding: 'var(--space-4) var(--space-6)', flexShrink: 0 }}>
          <div style={{ background: 'var(--bg2)', borderRadius: 'var(--radius-2xl)', padding: 'var(--space-5)', border: '1px solid var(--bd)' }}>
            {/* Mode tabs */}
            <div style={{ display: 'flex', gap: 'var(--space-2)', marginBottom: 'var(--space-5)', borderBottom: '1px solid var(--bd)', paddingBottom: 'var(--space-3)' }}>
              {([
                { key: 'paste', label: 'New page', icon: <PenLine size={14} style={{ marginRight: 'var(--space-2)' }} /> },
                { key: 'file', label: 'PDF / TXT', icon: <FolderOpen size={14} style={{ marginRight: 'var(--space-2)' }} /> },
                { key: 'text', label: 'Upload text', icon: <Upload size={14} style={{ marginRight: 'var(--space-2)' }} /> },
                { key: 'video', label: 'Audio / Video', icon: <Film size={14} style={{ marginRight: 'var(--space-2)' }} /> },
                { key: 'drive', label: 'Drive link', icon: <Link size={14} style={{ marginRight: 'var(--space-2)' }} /> },
              ] as { key: typeof addMode; label: string; icon: React.ReactNode }[]).map(m => (
                <button
                  key={m.key}
                  onClick={() => setAddMode(m.key)}
                  style={{
                    padding: 'var(--space-1-5) var(--space-3)', borderRadius: 'var(--radius-lg)', fontSize: 'var(--text-sm)', cursor: 'pointer', border: 'none',
                    transition: 'all var(--duration-fast) var(--ease-default)', fontWeight: addMode === m.key ? 600 : 500,
                    background: addMode === m.key ? 'var(--bg1)' : 'transparent',
                    color: addMode === m.key ? 'var(--tx0)' : 'var(--tx2)',
                    boxShadow: addMode === m.key ? 'var(--shadow-sm)' : 'none',
                    display: 'flex', alignItems: 'center',
                  }}
                >
                  {m.icon}{m.label}
                </button>
              ))}
            </div>

            {/* Content for forms are preserved mostly unchanged except some spacing */}
            {addMode === 'paste' && (
              <div>
                <input value={pasteTitle} onChange={e => setPasteTitle(e.target.value)} placeholder="Title..." style={{ ...inputStyle, marginBottom: 'var(--space-3)' }} />
                <textarea value={pasteContent} onChange={e => setPasteContent(e.target.value)} rows={6} placeholder="Paste content here..." style={{ ...inputStyle, resize: 'vertical', lineHeight: 1.6 }} />
                <div style={{ display: 'flex', gap: 'var(--space-2)', marginTop: 'var(--space-4)' }}>
                  <Btn label="Create Page" onClick={createPastePage} color="blue" disabled={!pasteTitle.trim()} />
                </div>
              </div>
            )}

            {addMode === 'file' && (
              <div>
                <div style={{ fontSize: 'var(--text-sm)', color: 'var(--tx2)', marginBottom: 'var(--space-3)', fontWeight: 500 }}>
                  Upload a PDF or TXT file — AI will extract and organize into knowledge pages
                </div>
                <div
                  onClick={() => docFileRef.current?.click()}
                  style={{
                    border: '1.5px dashed var(--bd)', borderRadius: 'var(--radius-xl)', padding: 'var(--space-8) var(--space-4)', textAlign: 'center',
                    cursor: 'pointer', transition: 'all var(--duration-fast) var(--ease-default)',
                    borderColor: selectedDocFile ? 'var(--green)' : undefined,
                    background: selectedDocFile ? 'var(--green-bg)' : 'var(--bg1)',
                  }}
                >
                  <input ref={docFileRef} type="file" accept=".pdf,.txt,.md" style={{ display: 'none' }} onChange={e => setSelectedDocFile(e.target.files?.[0] || null)} />
                  {selectedDocFile ? (
                    <div>
                      <div style={{ marginBottom: 'var(--space-2)', display: 'flex', justifyContent: 'center' }}><FileText size={24} color="var(--green)" /></div>
                      <div style={{ fontSize: 'var(--text-base)', color: 'var(--green)', fontWeight: 600 }}>{selectedDocFile.name}</div>
                      <div style={{ fontSize: 'var(--text-sm)', color: 'var(--tx2)', marginTop: 'var(--space-1)' }}>{(selectedDocFile.size / 1024).toFixed(1)} KB</div>
                    </div>
                  ) : (
                    <div>
                      <div style={{ marginBottom: 'var(--space-2)', display: 'flex', justifyContent: 'center', color: 'var(--tx2)' }}><FolderOpen size={28} /></div>
                      <div style={{ fontSize: 'var(--text-base)', color: 'var(--tx1)', fontWeight: 500 }}>Click to select PDF, TXT, or MD file</div>
                      <div style={{ fontSize: 'var(--text-sm)', color: 'var(--tx2)', marginTop: 'var(--space-1)' }}>Max 20MB</div>
                    </div>
                  )}
                </div>
                {uploadResult && <div style={{ fontSize: 'var(--text-sm)', color: uploadResult.startsWith('Error') ? 'var(--red)' : 'var(--green)', marginTop: 'var(--space-3)', fontWeight: 500 }}>{uploadResult}</div>}
                <div style={{ display: 'flex', gap: 'var(--space-2)', marginTop: 'var(--space-4)' }}>
                  <Btn label={uploading ? 'Processing...' : 'Process with AI'} onClick={submitDocFile} color="blue" disabled={uploading || !selectedDocFile} />
                </div>
              </div>
            )}

            {addMode === 'text' && (
              <div>
                <div style={{ fontSize: 'var(--text-sm)', color: 'var(--tx2)', marginBottom: 'var(--space-3)', fontWeight: 500 }}>
                  Paste text, PDF content, or any document — AI will classify and update knowledge pages
                </div>
                <textarea value={uploadText} onChange={e => setUploadText(e.target.value)} rows={6} placeholder="Paste content here..." style={{ ...inputStyle, resize: 'vertical', lineHeight: 1.6 }} />
                {uploadResult && <div style={{ fontSize: 'var(--text-sm)', color: 'var(--green)', marginTop: 'var(--space-3)', fontWeight: 500 }}>{uploadResult}</div>}
                <div style={{ display: 'flex', gap: 'var(--space-2)', marginTop: 'var(--space-4)' }}>
                  <Btn label={uploading ? 'Processing...' : 'Process with AI'} onClick={processUploadText} color="blue" disabled={uploading || !uploadText.trim()} />
                </div>
              </div>
            )}

            {addMode === 'video' && (
              <div>
                <input value={manualTitle} onChange={e => setManualTitle(e.target.value)} placeholder="Meeting title (optional — AI will generate)" style={{ ...inputStyle, marginBottom: 'var(--space-4)' }} />
                <div
                  onClick={() => fileRef.current?.click()}
                  onDragOver={e => { e.preventDefault(); setDragOver(true) }}
                  onDragLeave={() => setDragOver(false)}
                  onDrop={onDrop}
                  style={{
                    border: '1.5px dashed var(--bd)', borderRadius: 'var(--radius-xl)', padding: 'var(--space-8) var(--space-4)', textAlign: 'center',
                    cursor: 'pointer', transition: 'all var(--duration-fast) var(--ease-default)',
                    background: dragOver ? 'var(--brand-bg)' : selectedFile ? 'var(--green-bg)' : 'var(--bg1)',
                    borderColor: dragOver ? 'var(--brand)' : selectedFile ? 'var(--green)' : undefined,
                  }}
                >
                  <input ref={fileRef} type="file" accept=".mp4,.webm,.mov,.mp3,.wav,.flac,.m4a" style={{ display: 'none' }} onChange={e => setSelectedFile(e.target.files?.[0] || null)} />
                  {selectedFile ? (
                    <div>
                      <div style={{ marginBottom: 'var(--space-2)', display: 'flex', justifyContent: 'center' }}><Mic size={24} color="var(--green)" /></div>
                      <div style={{ fontSize: 'var(--text-base)', color: 'var(--green)', fontWeight: 600 }}>{selectedFile.name}</div>
                      <div style={{ fontSize: 'var(--text-sm)', color: 'var(--tx2)', marginTop: 'var(--space-1)' }}>{(selectedFile.size / 1024 / 1024).toFixed(1)} MB</div>
                    </div>
                  ) : (
                    <div>
                      <div style={{ marginBottom: 'var(--space-2)', display: 'flex', justifyContent: 'center', color: 'var(--tx2)' }}><Film size={28} /></div>
                      <div style={{ fontSize: 'var(--text-base)', color: 'var(--tx1)', fontWeight: 500 }}>Drop video/audio file here or click to browse</div>
                      <div style={{ fontSize: 'var(--text-sm)', color: 'var(--tx2)', marginTop: 'var(--space-1)' }}>.mp4 .webm .mov .mp3 .wav — max 500MB</div>
                    </div>
                  )}
                </div>
                {uploadProgress && <div style={{ fontSize: 'var(--text-sm)', color: 'var(--brand)', marginTop: 'var(--space-3)', fontWeight: 500 }}>{uploadProgress}</div>}
                {uploadResult && <div style={{ fontSize: 'var(--text-sm)', color: uploadResult.startsWith('Error') ? 'var(--red)' : 'var(--green)', marginTop: 'var(--space-3)', fontWeight: 500 }}>{uploadResult}</div>}
                <div style={{ display: 'flex', gap: 'var(--space-2)', marginTop: 'var(--space-4)' }}>
                  <Btn label={processing ? 'Processing...' : 'Process with AI'} onClick={submitVideo} color="green" disabled={processing || !selectedFile} />
                </div>
              </div>
            )}

            {addMode === 'drive' && (
              <div>
                <div style={{ fontSize: 'var(--text-sm)', color: 'var(--tx2)', marginBottom: 'var(--space-3)', fontWeight: 500 }}>
                  Paste a Google Drive link — video/audio will be downloaded and processed automatically
                </div>
                <input value={driveUrl} onChange={e => setDriveUrl(e.target.value)} placeholder="https://drive.google.com/file/d/..." style={{ ...inputStyle, marginBottom: 'var(--space-3)' }} />
                <input value={driveTitle} onChange={e => setDriveTitle(e.target.value)} placeholder="Meeting title (optional — AI will generate)" style={inputStyle} />
                {uploadProgress && <div style={{ fontSize: 'var(--text-sm)', color: 'var(--brand)', marginTop: 'var(--space-3)', fontWeight: 500 }}>{uploadProgress}</div>}
                {uploadResult && <div style={{ fontSize: 'var(--text-sm)', color: uploadResult.startsWith('Error') ? 'var(--red)' : 'var(--green)', marginTop: 'var(--space-3)', fontWeight: 500 }}>{uploadResult}</div>}
                <div style={{ display: 'flex', gap: 'var(--space-2)', marginTop: 'var(--space-4)' }}>
                  <Btn label={processing ? 'Processing...' : 'Process with AI'} onClick={submitDrive} color="green" disabled={processing || !driveUrl.trim()} />
                </div>
              </div>
            )}

          </div>
        </div>
      )}

      {/* Source list */}
      <div style={{ flex: 1, overflowY: 'auto', padding: '0 var(--space-6) var(--space-6)' }}>
        {sources.length === 0 && (
          <div style={{ textAlign: 'center', marginTop: 'var(--space-8)', color: 'var(--tx2)', fontSize: 'var(--text-base)' }}>
            No sources yet — add documents, meetings, or upload content
          </div>
        )}

        {sources.map(source => {
          const isOpen = expanded === source.id
          const isEditing = source.knowledge && editing === source.knowledge.id

          return (
            <div key={source.id} style={{ 
              background: isOpen ? 'var(--bg1)' : 'var(--bg1)', 
              borderRadius: 'var(--radius-xl)', 
              marginBottom: 'var(--space-3)', 
              overflow: 'hidden', 
              transition: 'all var(--duration-normal) var(--ease-default)', 
              border: isOpen ? '1px solid var(--bd)' : '1px solid var(--bd2)',
              boxShadow: isOpen ? 'var(--shadow-card)' : '0 1px 2px rgba(0,0,0,0.02)',
            }}>
              {/* Header row */}
              <div
                onClick={() => setExpanded(isOpen ? null : source.id)}
                style={{ 
                  padding: 'var(--space-4) var(--space-5)', 
                  display: 'flex', alignItems: 'flex-start', gap: 'var(--space-4)', 
                  cursor: 'pointer', userSelect: 'none',
                  background: isOpen ? 'var(--bg1)' : 'transparent',
                }}
              >
                <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', color: 'var(--tx1)', marginTop: 2 }}>{ICONS[source.type]}</div>
                <div style={{ flex: 1, minWidth: 0 }}>
                  <div style={{ fontSize: 'var(--text-base)', fontWeight: 600, color: 'var(--tx0)', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap', marginBottom: 'var(--space-1)' }}>
                    {source.title}
                  </div>
                  <div style={{ display: 'flex', alignItems: 'center', gap: 'var(--space-3)' }}>
                    <div style={{ fontSize: 'var(--text-sm)', color: 'var(--tx2)', fontWeight: 500 }}>
                      {source.subtitle}
                    </div>
                  </div>
                </div>
                <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'flex-end', gap: 'var(--space-2)' }}>
                  <span style={{ fontSize: 'var(--text-xs)', color: 'var(--tx2)', flexShrink: 0, fontWeight: 500 }}>
                    {timeAgo(source.date)}
                  </span>
                  <span style={{ fontSize: 'var(--text-sm)', color: 'var(--tx2)', transition: 'transform var(--duration-fast) var(--ease-default)', transform: isOpen ? 'rotate(180deg)' : 'none', display: 'flex' }}>{'\u25BE'}</span>
                </div>
              </div>

              {/* Expanded content */}
              {isOpen && (
                <div className="animate-fade-in" style={{ borderTop: '1px solid var(--bd)' }}>
                  {/* Knowledge page content */}
                  {source.knowledge && !isEditing && (
                    <div>
                      <div style={{ padding: 'var(--space-5)', background: 'var(--bg2)' }}>
                        <pre style={{ fontSize: 'var(--text-base)', color: 'var(--tx0)', lineHeight: 1.75, whiteSpace: 'pre-wrap', fontFamily: 'var(--font-sans)', margin: 0 }}>
                          {source.knowledge.content || '(empty)'}
                        </pre>
                      </div>
                      {showTranslation[source.id] && translations[source.id] && (
                        <div style={{ padding: 'var(--space-5)', background: 'var(--amber-bg)', borderTop: '1px solid var(--amber-bd)' }}>
                          <div style={{ fontSize: 'var(--text-xs)', color: 'var(--amber)', fontWeight: 700, marginBottom: 'var(--space-2)', textTransform: 'uppercase', letterSpacing: '0.04em' }}>VIETNAMESE</div>
                          <pre style={{ fontSize: 'var(--text-base)', color: 'var(--tx0)', lineHeight: 1.75, whiteSpace: 'pre-wrap', fontFamily: 'var(--font-sans)', margin: 0 }}>
                            {translations[source.id]}
                          </pre>
                        </div>
                      )}
                      <div style={{ padding: 'var(--space-4) var(--space-5)', display: 'flex', gap: 'var(--space-3)', borderTop: '1px solid var(--bd)', background: 'var(--bg1)' }}>
                        <TranslateBtn
                          sourceId={source.id}
                          text={source.knowledge.content}
                          isShowing={!!showTranslation[source.id]}
                          isTranslating={translating === source.id}
                          onTranslate={translateText}
                        />
                        <Btn label="Edit page" onClick={() => { setEditing(source.knowledge!.id); setEditTitle(source.knowledge!.title); setEditContent(source.knowledge!.content) }} color="default" />
                        <div style={{ flex: 1 }} />
                        <Btn label="Delete" onClick={() => deleteKnowledge(source.knowledge!.id)} color="red" />
                      </div>
                    </div>
                  )}

                  {/* Knowledge page editing */}
                  {source.knowledge && isEditing && (
                    <div style={{ padding: 'var(--space-5)', background: 'var(--bg2)' }}>
                      <input value={editTitle} onChange={e => setEditTitle(e.target.value)} style={{ ...inputStyle, marginBottom: 'var(--space-3)', borderColor: 'var(--brand-bd)', fontWeight: 600, fontSize: 'var(--text-base)' }} />
                      <textarea value={editContent} onChange={e => setEditContent(e.target.value)} rows={12} style={{ ...inputStyle, resize: 'vertical', lineHeight: 1.75, fontSize: 'var(--text-base)' }} />
                      <div style={{ display: 'flex', gap: 'var(--space-3)', marginTop: 'var(--space-4)' }}>
                        <Btn label="Save changes" onClick={() => saveEdit(source.knowledge!.id)} color="blue" />
                        <Btn label="Cancel" onClick={() => setEditing(null)} color="default" />
                      </div>
                    </div>
                  )}

                  {/* Meeting content */}
                  {source.meeting && (
                    <div style={{ padding: 'var(--space-5)', background: 'var(--bg2)' }}>
                      {source.meeting.summary && (
                        <Section label="Summary" content={<pre style={{ fontSize: 'var(--text-base)', color: 'var(--tx0)', lineHeight: 1.75, whiteSpace: 'pre-wrap', fontFamily: 'var(--font-sans)', margin: 0 }}>{source.meeting.summary}</pre>} />
                      )}
                      
                      {source.meeting.translation && showTranslation[source.id] && (
                        <Section label="Vietnamese Translation" content={
                          <div style={{ padding: 'var(--space-4)', background: 'var(--amber-bg)', borderRadius: 'var(--radius-xl)', border: '1px solid var(--amber-bd)' }}>
                            <pre style={{ fontSize: 'var(--text-base)', color: 'var(--tx0)', lineHeight: 1.75, whiteSpace: 'pre-wrap', fontFamily: 'var(--font-sans)', margin: 0 }}>{source.meeting.translation}</pre>
                          </div>
                        } />
                      )}
                      
                      {(() => { const items: string[] = JSON.parse(source.meeting!.action_items || '[]'); return items.length > 0 ? <Section label="Action items" content={<ul style={{ paddingLeft: 'var(--space-5)', margin: 0 }}>{items.map((a, i) => <li key={i} style={{ fontSize: 'var(--text-base)', color: 'var(--tx0)', lineHeight: 1.75, marginBottom: 'var(--space-1)' }}>{a}</li>)}</ul>} /> : null })()}
                      {(() => { const items: string[] = JSON.parse(source.meeting!.key_decisions || '[]'); return items.length > 0 ? <Section label="Key decisions" content={<ul style={{ paddingLeft: 'var(--space-5)', margin: 0 }}>{items.map((d, i) => <li key={i} style={{ fontSize: 'var(--text-base)', color: 'var(--tx0)', lineHeight: 1.75, marginBottom: 'var(--space-1)' }}>{d}</li>)}</ul>} /> : null })()}
                      
                      {showTranslation[source.id] && translations[source.id] && (
                        <div style={{ padding: 'var(--space-4)', background: 'var(--amber-bg)', borderRadius: 'var(--radius-xl)', border: '1px solid var(--amber-bd)', marginBottom: 'var(--space-4)' }}>
                          <div style={{ fontSize: 'var(--text-xs)', color: 'var(--amber)', fontWeight: 700, marginBottom: 'var(--space-2)', textTransform: 'uppercase', letterSpacing: '0.04em' }}>TRANSLATED</div>
                          <pre style={{ fontSize: 'var(--text-base)', color: 'var(--tx0)', lineHeight: 1.75, whiteSpace: 'pre-wrap', fontFamily: 'var(--font-sans)', margin: 0 }}>
                            {translations[source.id]}
                          </pre>
                        </div>
                      )}
                      
                      {source.meeting.transcript && (
                        <details style={{ marginTop: 'var(--space-4)', background: 'var(--bg1)', padding: 'var(--space-3) var(--space-4)', borderRadius: 'var(--radius-xl)', border: '1px solid var(--bd2)' }}>
                          <summary style={{ fontSize: 'var(--text-sm)', color: 'var(--tx1)', cursor: 'pointer', fontWeight: 600 }}>Raw transcript</summary>
                          <pre style={{ marginTop: 'var(--space-3)', fontSize: 'var(--text-sm)', color: 'var(--tx2)', lineHeight: 1.6, whiteSpace: 'pre-wrap', fontFamily: 'var(--font-mono)', maxHeight: 300, overflowY: 'auto', padding: 'var(--space-3)', background: 'var(--bg2)', borderRadius: 'var(--radius-lg)' }}>{source.meeting.transcript}</pre>
                        </details>
                      )}
                      
                      <div style={{ marginTop: 'var(--space-5)', display: 'flex', gap: 'var(--space-3)', paddingTop: 'var(--space-4)', borderTop: '1px solid var(--bd)', marginInline: 'calc(-1 * var(--space-5))', paddingInline: 'var(--space-5)' }}>
                        {source.meeting.translation ? (
                          <button
                            onClick={() => setShowTranslation(prev => ({ ...prev, [source.id]: !prev[source.id] }))}
                            style={{
                              padding: 'var(--space-2) var(--space-4)', borderRadius: 'var(--radius-lg)', fontSize: 'var(--text-sm)',
                              cursor: 'pointer', border: 'none', transition: 'all var(--duration-fast) var(--ease-default)',
                              fontWeight: 600,
                              background: showTranslation[source.id] ? 'var(--amber-bg)' : 'var(--bg3)',
                              color: showTranslation[source.id] ? 'var(--amber)' : 'var(--tx1)',
                            }}
                          >
                            {showTranslation[source.id] ? 'Hide Translation' : 'View Translation'}
                          </button>
                        ) : (
                          <TranslateBtn
                            sourceId={source.id}
                            text={[source.meeting.summary, ...(JSON.parse(source.meeting.action_items || '[]') as string[]), ...(JSON.parse(source.meeting.key_decisions || '[]') as string[])].join('\n\n')}
                            isShowing={!!showTranslation[source.id]}
                            isTranslating={translating === source.id}
                            onTranslate={translateText}
                          />
                        )}
                        <div style={{ flex: 1 }} />
                        <Btn label="Delete" onClick={() => deleteMeeting(source.meeting!.id)} color="red" />
                      </div>
                    </div>
                  )}
                </div>
              )}
            </div>
          )
        })}
      </div>

      {/* Delete Confirmation Modal */}
      {deleteData && (
        <ConfirmModal
          title={deleteData.type === 'knowledge' ? "Delete Document" : "Delete Meeting"}
          message="Are you sure you want to delete this source? This action cannot be undone."
          confirmText={deletingItem ? "Deleting..." : "Delete"}
          onConfirm={performDelete}
          onCancel={() => setDeleteData(null)}
          danger={true}
        />
      )}
    </div>
  )
}

// Shared input style
const inputStyle: React.CSSProperties = {
  width: '100%', background: 'var(--bg1)', border: '1px solid var(--bd)', borderRadius: 'var(--radius-xl)',
  padding: 'var(--space-3) var(--space-4)', fontSize: 'var(--text-base)', color: 'var(--tx0)', outline: 'none', transition: 'all var(--duration-fast)'
}

function Section({ label, content }: { label: string; content: React.ReactNode }) {
  return (
    <div style={{ marginBottom: 'var(--space-6)' }}>
      <div style={{ fontSize: 'var(--text-xs)', color: 'var(--brand)', textTransform: 'uppercase', letterSpacing: '0.06em', fontWeight: 700, marginBottom: 'var(--space-2)' }}>{label}</div>
      {content}
    </div>
  )
}

function TranslateBtn({ sourceId, text, isShowing, isTranslating, onTranslate }: { sourceId: string; text: string; isShowing: boolean; isTranslating: boolean; onTranslate: (id: string, text: string) => void }) {
  return (
    <button
      onClick={() => onTranslate(sourceId, text)}
      disabled={isTranslating}
      style={{
        padding: 'var(--space-2) var(--space-4)', borderRadius: 'var(--radius-lg)', fontSize: 'var(--text-sm)',
        cursor: isTranslating ? 'wait' : 'pointer', border: 'none', transition: 'all var(--duration-fast) var(--ease-default)',
        fontWeight: 600,
        background: isShowing ? 'var(--amber-bg)' : 'var(--bg3)',
        color: isShowing ? 'var(--amber)' : 'var(--tx1)',
        opacity: isTranslating ? 0.6 : 1,
      }}
    >
      {isTranslating ? 'Translating...' : isShowing ? 'Hide Translation' : 'View Translation'}
    </button>
  )
}

function Btn({ label, onClick, color = 'default', disabled = false }: { label: string; onClick: () => void; color?: string; disabled?: boolean }) {
  const colors: Record<string, React.CSSProperties> = {
    blue: { background: 'var(--brand)', color: '#fff' },
    green: { background: 'var(--green)', color: '#fff' },
    red: { background: 'transparent', color: 'var(--red)' }, // Clean ghost button for delete
    default: { background: 'var(--bg3)', color: 'var(--tx1)' },
  }
  return (
    <button onClick={onClick} disabled={disabled} style={{
      padding: 'var(--space-2-5) var(--space-5)', borderRadius: 'var(--radius-lg)', fontSize: 'var(--text-sm)',
      cursor: disabled ? 'not-allowed' : 'pointer', border: 'none', transition: 'all var(--duration-fast) var(--ease-default)',
      fontWeight: 600, opacity: disabled ? .4 : 1, ...colors[color] || colors.default,
    }}>
      {label}
    </button>
  )
}
