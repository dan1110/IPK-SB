'use client'
import { useState, useEffect, useCallback, useRef } from 'react'
import type { KnowledgePage, Meeting } from '@/lib/types'

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

const ICONS: Record<string, string> = { document: '\u{1F4C4}', meeting: '\u{1F399}\uFE0F', slack: '\u{1F4AC}' }

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
  async function deleteKnowledge(id: string) {
    if (!confirm('Delete this source?')) return
    await fetch(`/api/knowledge/${id}`, { method: 'DELETE' })
    reload()
  }

  async function deleteMeeting(id: string) {
    if (!confirm('Delete this meeting?')) return
    await fetch(`/api/meetings/${id}`, { method: 'DELETE' })
    reload()
  }

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
    }, 4000) // update every 4 seconds

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
    // If already cached, just toggle visibility
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
      <div style={{ padding: '16px 20px 14px', flexShrink: 0 }}>
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 12 }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
            <span style={{ fontSize: 16, fontWeight: 700, color: 'var(--tx0)' }}>Sources</span>
            <span style={{ fontSize: 11, color: 'var(--tx2)', fontWeight: 600, background: 'var(--bg3)', padding: '3px 9px', borderRadius: 8 }}>{sourceCount}</span>
          </div>
          <button
            onClick={() => setShowAdd(s => !s)}
            style={{
              padding: '8px 16px', borderRadius: 12, fontSize: 13, cursor: 'pointer', border: 'none',
              transition: 'all .2s ease', fontWeight: 600,
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
          style={{ width: '100%', background: 'var(--bg3)', border: 'none', borderRadius: 12, padding: '10px 14px', fontSize: 13, color: 'var(--tx0)', outline: 'none', marginBottom: 10 }}
        />

        {/* Filter chips */}
        <div style={{ display: 'flex', gap: 4, background: 'var(--bg3)', borderRadius: 10, padding: 3 }}>
          {([
            { key: 'all', label: 'All' },
            { key: 'document', label: '\u{1F4C4} Docs' },
            { key: 'meeting', label: '\u{1F399}\uFE0F Meetings' },
            { key: 'slack', label: '\u{1F4AC} Slack' },
          ] as { key: SourceType; label: string }[]).map(f => (
            <button
              key={f.key}
              onClick={() => setFilter(f.key)}
              style={{
                padding: '5px 12px', borderRadius: 8, fontSize: 11, cursor: 'pointer', border: 'none',
                transition: 'all .15s', fontWeight: filter === f.key ? 600 : 400,
                background: filter === f.key ? 'var(--bg1)' : 'transparent',
                color: filter === f.key ? 'var(--tx0)' : 'var(--tx2)',
                boxShadow: filter === f.key ? 'var(--shadow-card)' : 'none',
              }}
            >
              {f.label}
            </button>
          ))}
        </div>
      </div>

      {/* Add source panel */}
      {showAdd && (
        <div className="animate-fade-in" style={{ padding: '16px 20px', background: 'var(--bg2)', flexShrink: 0 }}>
          {/* Mode tabs */}
          <div style={{ display: 'flex', gap: 4, marginBottom: 14, background: 'var(--bg3)', borderRadius: 10, padding: 3 }}>
            {([
              { key: 'paste', label: '\u{1F4DD} New page' },
              { key: 'file', label: '\u{1F4C1} PDF/TXT' },
              { key: 'text', label: '\u{1F4E4} Upload text' },
              { key: 'video', label: '\u{1F3A5} Video/Audio' },
              { key: 'drive', label: '\u{1F517} Drive link' },
            ] as { key: typeof addMode; label: string }[]).map(m => (
              <button
                key={m.key}
                onClick={() => setAddMode(m.key)}
                style={{
                  padding: '5px 10px', borderRadius: 8, fontSize: 11, cursor: 'pointer', border: 'none',
                  transition: 'all .15s', fontWeight: addMode === m.key ? 600 : 400,
                  background: addMode === m.key ? 'var(--bg1)' : 'transparent',
                  color: addMode === m.key ? 'var(--tx0)' : 'var(--tx2)',
                  boxShadow: addMode === m.key ? 'var(--shadow-card)' : 'none',
                }}
              >
                {m.label}
              </button>
            ))}
          </div>

          {/* Paste / New page */}
          {addMode === 'paste' && (
            <div>
              <input value={pasteTitle} onChange={e => setPasteTitle(e.target.value)} placeholder="Title..." style={inputStyle} />
              <textarea value={pasteContent} onChange={e => setPasteContent(e.target.value)} rows={4} placeholder="Paste content here..." style={{ ...inputStyle, resize: 'vertical', lineHeight: 1.5, marginTop: 6 }} />
              <div style={{ display: 'flex', gap: 6, marginTop: 8 }}>
                <Btn label="Create" onClick={createPastePage} color="blue" disabled={!pasteTitle.trim()} />
                <Btn label="Cancel" onClick={() => setShowAdd(false)} color="default" />
              </div>
            </div>
          )}

          {/* File upload (PDF/TXT) */}
          {addMode === 'file' && (
            <div>
              <div style={{ fontSize: 11, color: 'var(--tx2)', marginBottom: 8, fontWeight: 500 }}>
                Upload a PDF or TXT file — AI will extract and organize into knowledge pages
              </div>
              <div
                onClick={() => docFileRef.current?.click()}
                style={{
                  border: '1.5px dashed var(--bd2)', borderRadius: 12, padding: '22px 16px', textAlign: 'center',
                  cursor: 'pointer', transition: 'all .2s ease',
                  borderColor: selectedDocFile ? 'var(--green)' : undefined,
                  background: selectedDocFile ? 'var(--green-bg)' : 'var(--bg1)',
                }}
              >
                <input ref={docFileRef} type="file" accept=".pdf,.txt,.md" style={{ display: 'none' }} onChange={e => setSelectedDocFile(e.target.files?.[0] || null)} />
                {selectedDocFile ? (
                  <div>
                    <div style={{ fontSize: 18, marginBottom: 4 }}>{'\u{1F4C4}'}</div>
                    <div style={{ fontSize: 12, color: 'var(--green)', fontWeight: 600 }}>{selectedDocFile.name}</div>
                    <div style={{ fontSize: 10, color: 'var(--tx2)', marginTop: 2 }}>{(selectedDocFile.size / 1024).toFixed(1)} KB</div>
                  </div>
                ) : (
                  <div>
                    <div style={{ fontSize: 20, marginBottom: 4 }}>{'\u{1F4C1}'}</div>
                    <div style={{ fontSize: 12, color: 'var(--tx1)', fontWeight: 500 }}>Click to select PDF, TXT, or MD file</div>
                    <div style={{ fontSize: 10, color: 'var(--tx2)', marginTop: 3 }}>.pdf .txt .md — max 20MB</div>
                  </div>
                )}
              </div>
              {uploadResult && <div style={{ fontSize: 11, color: uploadResult.startsWith('Error') ? 'var(--red)' : 'var(--green)', marginTop: 5, fontWeight: 500 }}>{uploadResult}</div>}
              <div style={{ display: 'flex', gap: 6, marginTop: 8 }}>
                <Btn label={uploading ? 'Processing...' : 'Process with AI'} onClick={submitDocFile} color="blue" disabled={uploading || !selectedDocFile} />
                <Btn label="Cancel" onClick={() => { setShowAdd(false); setSelectedDocFile(null); setUploadResult('') }} color="default" />
              </div>
            </div>
          )}

          {/* Upload text (AI process) */}
          {addMode === 'text' && (
            <div>
              <div style={{ fontSize: 11, color: 'var(--tx2)', marginBottom: 8, fontWeight: 500 }}>
                Paste text, PDF content, or any document — AI will classify and update knowledge pages
              </div>
              <textarea value={uploadText} onChange={e => setUploadText(e.target.value)} rows={4} placeholder="Paste content here..." style={{ ...inputStyle, resize: 'vertical', lineHeight: 1.5 }} />
              {uploadResult && <div style={{ fontSize: 11, color: 'var(--green)', marginTop: 5, fontWeight: 500 }}>{uploadResult}</div>}
              <div style={{ display: 'flex', gap: 6, marginTop: 8 }}>
                <Btn label={uploading ? 'Processing...' : 'Process with AI'} onClick={processUploadText} color="blue" disabled={uploading || !uploadText.trim()} />
                <Btn label="Cancel" onClick={() => { setShowAdd(false); setUploadResult('') }} color="default" />
              </div>
            </div>
          )}

          {/* Video upload */}
          {addMode === 'video' && (
            <div>
              <input value={manualTitle} onChange={e => setManualTitle(e.target.value)} placeholder="Meeting title (optional — AI will generate)" style={{ ...inputStyle, marginBottom: 8 }} />
              <div
                onClick={() => fileRef.current?.click()}
                onDragOver={e => { e.preventDefault(); setDragOver(true) }}
                onDragLeave={() => setDragOver(false)}
                onDrop={onDrop}
                style={{
                  border: '1.5px dashed var(--bd2)', borderRadius: 12, padding: '24px 16px', textAlign: 'center',
                  cursor: 'pointer', transition: 'all .2s ease',
                  background: dragOver ? 'var(--brand-bg)' : selectedFile ? 'var(--green-bg)' : 'var(--bg1)',
                  borderColor: dragOver ? 'var(--brand)' : selectedFile ? 'var(--green)' : undefined,
                }}
              >
                <input ref={fileRef} type="file" accept=".mp4,.webm,.mov,.mp3,.wav,.flac,.m4a" style={{ display: 'none' }} onChange={e => setSelectedFile(e.target.files?.[0] || null)} />
                {selectedFile ? (
                  <div>
                    <div style={{ fontSize: 18, marginBottom: 4 }}>{'\u{1F399}\uFE0F'}</div>
                    <div style={{ fontSize: 12, color: 'var(--green)', fontWeight: 600 }}>{selectedFile.name}</div>
                    <div style={{ fontSize: 10, color: 'var(--tx2)', marginTop: 2 }}>{(selectedFile.size / 1024 / 1024).toFixed(1)} MB</div>
                  </div>
                ) : (
                  <div>
                    <div style={{ fontSize: 20, marginBottom: 4 }}>{'\u{1F3AC}'}</div>
                    <div style={{ fontSize: 12, color: 'var(--tx1)', fontWeight: 500 }}>Drop video/audio file here or click to browse</div>
                    <div style={{ fontSize: 10, color: 'var(--tx2)', marginTop: 3 }}>.mp4 .webm .mov .mp3 .wav max 500MB</div>
                  </div>
                )}
              </div>
              {uploadProgress && <div style={{ fontSize: 11, color: 'var(--brand)', marginTop: 6, fontWeight: 500 }}>{uploadProgress}</div>}
              {uploadResult && <div style={{ fontSize: 11, color: uploadResult.startsWith('Error') ? 'var(--red)' : 'var(--green)', marginTop: 5, fontWeight: 500 }}>{uploadResult}</div>}
              <div style={{ display: 'flex', gap: 6, marginTop: 8 }}>
                <Btn label={processing ? 'Processing...' : 'Process with AI'} onClick={submitVideo} color="green" disabled={processing || !selectedFile} />
                <Btn label="Cancel" onClick={() => { setShowAdd(false); setSelectedFile(null); setUploadResult('') }} color="default" />
              </div>
            </div>
          )}
          {/* Drive link */}
          {addMode === 'drive' && (
            <div>
              <div style={{ fontSize: 11, color: 'var(--tx2)', marginBottom: 8, fontWeight: 500 }}>
                Paste a Google Drive link — video/audio will be downloaded and processed automatically
              </div>
              <input value={driveUrl} onChange={e => setDriveUrl(e.target.value)} placeholder="https://drive.google.com/file/d/..." style={{ ...inputStyle, marginBottom: 6 }} />
              <input value={driveTitle} onChange={e => setDriveTitle(e.target.value)} placeholder="Meeting title (optional — AI will generate)" style={inputStyle} />
              {uploadProgress && <div style={{ fontSize: 11, color: 'var(--brand)', marginTop: 6, fontWeight: 500 }}>{uploadProgress}</div>}
              {uploadResult && <div style={{ fontSize: 11, color: uploadResult.startsWith('Error') ? 'var(--red)' : 'var(--green)', marginTop: 5, fontWeight: 500 }}>{uploadResult}</div>}
              <div style={{ display: 'flex', gap: 6, marginTop: 8 }}>
                <Btn label={processing ? 'Processing...' : 'Process with AI'} onClick={submitDrive} color="green" disabled={processing || !driveUrl.trim()} />
                <Btn label="Cancel" onClick={() => { setShowAdd(false); setDriveUrl(''); setUploadResult('') }} color="default" />
              </div>
            </div>
          )}
        </div>
      )}

      {/* Source list */}
      <div style={{ flex: 1, overflowY: 'auto', padding: '0 12px 12px' }}>
        {sources.length === 0 && (
          <div style={{ textAlign: 'center', marginTop: 48, color: 'var(--tx2)', fontSize: 13 }}>
            No sources yet — add documents, meetings, or upload content
          </div>
        )}

        {sources.map(source => {
          const isOpen = expanded === source.id
          const isEditing = source.knowledge && editing === source.knowledge.id

          return (
            <div key={source.id} style={{ background: 'var(--bg1)', borderRadius: 16, marginBottom: 8, overflow: 'hidden', transition: 'all .2s ease', boxShadow: 'var(--shadow-card)' }}>
              {/* Header row */}
              <div
                onClick={() => setExpanded(isOpen ? null : source.id)}
                style={{ padding: '12px 16px', display: 'flex', alignItems: 'center', gap: 12, cursor: 'pointer', userSelect: 'none' }}
              >
                <span style={{ fontSize: 15 }}>{ICONS[source.type]}</span>
                <div style={{ flex: 1, minWidth: 0 }}>
                  <div style={{ fontSize: 13, fontWeight: 600, color: 'var(--tx0)', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                    {source.title}
                  </div>
                  <div style={{ fontSize: 10, color: 'var(--tx2)', fontWeight: 500 }}>
                    {source.subtitle}
                  </div>
                </div>
                <span style={{ fontSize: 10, color: 'var(--tx2)', flexShrink: 0, fontWeight: 500 }}>
                  {timeAgo(source.date)}
                </span>
                <span style={{ fontSize: 11, color: 'var(--tx2)', transition: 'transform .2s', transform: isOpen ? 'rotate(180deg)' : 'none', display: 'inline-block' }}>{'\u25BE'}</span>
              </div>

              {/* Expanded content */}
              {isOpen && (
                <div className="animate-fade-in" style={{ borderTop: '1px solid var(--bd)' }}>
                  {/* Knowledge page content */}
                  {source.knowledge && !isEditing && (
                    <div>
                      <pre style={{ padding: '12px 14px', fontSize: 12, color: 'var(--tx1)', lineHeight: 1.65, whiteSpace: 'pre-wrap', fontFamily: "'Plus Jakarta Sans', sans-serif", margin: 0 }}>
                        {source.knowledge.content || '(empty)'}
                      </pre>
                      {showTranslation[source.id] && translations[source.id] && (
                        <div style={{ padding: '10px 14px', background: 'var(--amber-bg)', borderTop: '1px solid var(--amber-bd)' }}>
                          <div style={{ fontSize: 10, color: 'var(--amber)', fontWeight: 700, marginBottom: 4, textTransform: 'uppercase', letterSpacing: '0.04em' }}>VIETNAMESE</div>
                          <pre style={{ fontSize: 12, color: 'var(--tx1)', lineHeight: 1.65, whiteSpace: 'pre-wrap', fontFamily: "'Plus Jakarta Sans', sans-serif", margin: 0 }}>
                            {translations[source.id]}
                          </pre>
                        </div>
                      )}
                      <div style={{ padding: '0 14px 12px', display: 'flex', gap: 6, marginTop: 8 }}>
                        <TranslateBtn
                          sourceId={source.id}
                          text={source.knowledge.content}
                          isShowing={!!showTranslation[source.id]}
                          isTranslating={translating === source.id}
                          onTranslate={translateText}
                        />
                        <Btn label="Edit" onClick={() => { setEditing(source.knowledge!.id); setEditTitle(source.knowledge!.title); setEditContent(source.knowledge!.content) }} color="default" small />
                        <Btn label="Delete" onClick={() => deleteKnowledge(source.knowledge!.id)} color="red" small />
                      </div>
                    </div>
                  )}

                  {/* Knowledge page editing */}
                  {source.knowledge && isEditing && (
                    <div style={{ padding: 14 }}>
                      <input value={editTitle} onChange={e => setEditTitle(e.target.value)} style={{ ...inputStyle, marginBottom: 8, borderColor: 'var(--brand-bd)' }} />
                      <textarea value={editContent} onChange={e => setEditContent(e.target.value)} rows={8} style={{ ...inputStyle, resize: 'vertical', lineHeight: 1.6 }} />
                      <div style={{ display: 'flex', gap: 6, marginTop: 8 }}>
                        <Btn label="Save" onClick={() => saveEdit(source.knowledge!.id)} color="blue" />
                        <Btn label="Cancel" onClick={() => setEditing(null)} color="default" />
                      </div>
                    </div>
                  )}

                  {/* Meeting content */}
                  {source.meeting && (
                    <div style={{ padding: '12px 14px' }}>
                      {source.meeting.summary && (
                        <Section label="Summary (Detailed Notes)" content={<pre style={{ fontSize: 12, color: 'var(--tx1)', lineHeight: 1.65, whiteSpace: 'pre-wrap', fontFamily: "'Plus Jakarta Sans', sans-serif", margin: 0 }}>{source.meeting.summary}</pre>} />
                      )}
                      {source.meeting.translation && showTranslation[source.id] && (
                        <Section label="Vietnamese Translation" content={
                          <div style={{ padding: '10px 12px', background: 'var(--amber-bg)', borderRadius: 8, border: '1px solid var(--amber-bd)' }}>
                            <pre style={{ fontSize: 12, color: 'var(--tx1)', lineHeight: 1.65, whiteSpace: 'pre-wrap', fontFamily: "'Plus Jakarta Sans', sans-serif", margin: 0 }}>{source.meeting.translation}</pre>
                          </div>
                        } />
                      )}
                      {(() => { const items: string[] = JSON.parse(source.meeting!.action_items || '[]'); return items.length > 0 ? <Section label="Action items" content={<ul style={{ paddingLeft: 16, margin: 0 }}>{items.map((a, i) => <li key={i} style={{ fontSize: 12, color: 'var(--tx1)', lineHeight: 1.7 }}>{a}</li>)}</ul>} /> : null })()}
                      {(() => { const items: string[] = JSON.parse(source.meeting!.key_decisions || '[]'); return items.length > 0 ? <Section label="Key decisions" content={<ul style={{ paddingLeft: 16, margin: 0 }}>{items.map((d, i) => <li key={i} style={{ fontSize: 12, color: 'var(--tx1)', lineHeight: 1.7 }}>{d}</li>)}</ul>} /> : null })()}
                      {/* On-demand translation block (for additional translate requests) */}
                      {showTranslation[source.id] && translations[source.id] && (
                        <div style={{ padding: '10px 12px', background: 'var(--amber-bg)', borderRadius: 8, border: '1px solid var(--amber-bd)', marginBottom: 10 }}>
                          <div style={{ fontSize: 10, color: 'var(--amber)', fontWeight: 700, marginBottom: 4, textTransform: 'uppercase', letterSpacing: '0.04em' }}>TRANSLATED</div>
                          <pre style={{ fontSize: 12, color: 'var(--tx1)', lineHeight: 1.65, whiteSpace: 'pre-wrap', fontFamily: "'Plus Jakarta Sans', sans-serif", margin: 0 }}>
                            {translations[source.id]}
                          </pre>
                        </div>
                      )}
                      {source.meeting.transcript && (
                        <details style={{ marginTop: 8 }}>
                          <summary style={{ fontSize: 11, color: 'var(--tx2)', cursor: 'pointer', fontWeight: 500 }}>Raw transcript</summary>
                          <pre style={{ marginTop: 6, fontSize: 11, color: 'var(--tx2)', lineHeight: 1.5, whiteSpace: 'pre-wrap', fontFamily: "'Plus Jakarta Sans', sans-serif" }}>{source.meeting.transcript}</pre>
                        </details>
                      )}
                      <div style={{ marginTop: 10, display: 'flex', gap: 6 }}>
                        {source.meeting.translation ? (
                          <button
                            onClick={() => setShowTranslation(prev => ({ ...prev, [source.id]: !prev[source.id] }))}
                            style={{
                              padding: '4px 10px', borderRadius: 8, fontSize: 11,
                              cursor: 'pointer', border: 'none', transition: 'all .15s',
                              fontWeight: 500,
                              background: showTranslation[source.id] ? 'var(--amber-bg)' : 'var(--bg3)',
                              color: showTranslation[source.id] ? 'var(--amber)' : 'var(--tx2)',
                            }}
                          >
                            {showTranslation[source.id] ? 'Hide VI' : 'VI'}
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
                        <Btn label="Delete" onClick={() => deleteMeeting(source.meeting!.id)} color="red" small />
                      </div>
                    </div>
                  )}
                </div>
              )}
            </div>
          )
        })}
      </div>
    </div>
  )
}

// Shared input style
const inputStyle: React.CSSProperties = {
  width: '100%', background: 'var(--bg1)', border: 'none', borderRadius: 12,
  padding: '10px 14px', fontSize: 13, color: 'var(--tx0)', outline: 'none', boxShadow: 'var(--shadow-card)',
}

function Section({ label, content }: { label: string; content: React.ReactNode }) {
  return (
    <div style={{ marginBottom: 12 }}>
      <div style={{ fontSize: 10, color: 'var(--brand)', textTransform: 'uppercase', letterSpacing: '0.06em', fontWeight: 700, marginBottom: 5 }}>{label}</div>
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
        padding: '4px 10px', borderRadius: 8, fontSize: 11,
        cursor: isTranslating ? 'wait' : 'pointer', border: 'none', transition: 'all .15s',
        fontWeight: 500,
        background: isShowing ? 'var(--amber-bg)' : 'var(--bg3)',
        color: isShowing ? 'var(--amber)' : 'var(--tx2)',
        opacity: isTranslating ? 0.6 : 1,
      }}
    >
      {isTranslating ? 'Translating...' : isShowing ? 'Hide VI' : 'VI'}
    </button>
  )
}

function Btn({ label, onClick, color = 'default', disabled = false, small = false }: { label: string; onClick: () => void; color?: string; disabled?: boolean; small?: boolean }) {
  const colors: Record<string, React.CSSProperties> = {
    blue: { background: 'var(--brand)', color: '#fff' },
    green: { background: 'var(--green)', color: '#fff' },
    red: { background: 'var(--red-bg)', color: 'var(--red)' },
    default: { background: 'var(--bg3)', color: 'var(--tx1)' },
  }
  return (
    <button onClick={onClick} disabled={disabled} style={{
      padding: small ? '5px 12px' : '8px 16px', borderRadius: 10, fontSize: small ? 11 : 12,
      cursor: disabled ? 'not-allowed' : 'pointer', border: 'none', transition: 'all .2s',
      fontWeight: 600, opacity: disabled ? .4 : 1, ...colors[color] || colors.default,
    }}>
      {label}
    </button>
  )
}
