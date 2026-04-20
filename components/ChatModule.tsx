'use client'
import { useState, useEffect, useRef, useCallback } from 'react'
import { Brain, RefreshCw } from 'lucide-react'

interface Msg { id: string; role: 'user' | 'assistant'; content: string; created_at: string }

const SUGGESTED_QUESTIONS = [
  'Summarize all sources in this project',
  'What decisions were made in the last meeting?',
  'What are the pending action items?',
  'What is the tech stack for this project?',
  'List all key people mentioned across sources',
  'What Jira tickets are at risk?',
  'Show overdue tickets and blockers',
  'Explain the main codebase architecture',
]

export default function ChatModule({ projectId, projectName }: { projectId: string; projectName: string }) {
  const [msgs, setMsgs] = useState<Msg[]>([])
  const [input, setInput] = useState('')
  const [loading, setLoading] = useState(false)
  const [copiedId, setCopiedId] = useState<string | null>(null)
  const [translations, setTranslations] = useState<Record<string, string>>({})
  const [translating, setTranslating] = useState<string | null>(null)
  const [showTranslation, setShowTranslation] = useState<Record<string, boolean>>({})
  const bottomRef = useRef<HTMLDivElement>(null)

  const load = useCallback(() => {
    fetch(`/api/chat?project_id=${projectId}`).then(r => r.json()).then(setMsgs)
  }, [projectId])

  useEffect(() => { load() }, [load])
  useEffect(() => { bottomRef.current?.scrollIntoView({ behavior: 'smooth' }) }, [msgs])

  async function send(text?: string) {
    const msg = (text || input).trim()
    if (!msg || loading) return
    setInput('')
    setLoading(true)
    const tempId = 'tmp-' + Date.now()
    setMsgs(prev => [...prev, { id: tempId, role: 'user', content: msg, created_at: new Date().toISOString() }])
    await fetch('/api/chat', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ project_id: projectId, message: msg }) })
    load()
    setLoading(false)
  }

  async function clearChat() {
    if (!confirm('Clear chat history?')) return
    await fetch(`/api/chat?project_id=${projectId}`, { method: 'DELETE' })
    setMsgs([])
  }

  async function translateMsg(id: string, text: string) {
    if (translations[id]) { setShowTranslation(prev => ({ ...prev, [id]: !prev[id] })); return }
    setTranslating(id)
    try {
      const res = await fetch('/api/translate', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ text }) })
      const data = await res.json()
      if (data.translated) { setTranslations(prev => ({ ...prev, [id]: data.translated })); setShowTranslation(prev => ({ ...prev, [id]: true })) }
    } catch { /* ignore */ }
    setTranslating(null)
  }

  function copyText(text: string, id: string) {
    navigator.clipboard.writeText(text); setCopiedId(id); setTimeout(() => setCopiedId(null), 2000)
  }

  function renderContent(content: string) {
    const parts = content.split(/(\[Source:\s*[^\]]+\])/g)
    return parts.map((part, i) => {
      if (part.match(/^\[Source:\s*[^\]]+\]$/)) {
        return <span key={i} style={{ display: 'inline', fontSize: 'var(--text-xs)', background: 'var(--brand-bg)', color: 'var(--brand)', padding: 'var(--space-0-5) var(--space-2)', borderRadius: 'var(--radius-md)', fontWeight: 600, whiteSpace: 'nowrap' }}>{part}</span>
      }
      return <span key={i}>{part}</span>
    })
  }

  const isEmpty = msgs.length === 0 && !loading

  return (
    <div style={{ flex: 1, display: 'flex', flexDirection: 'column', overflow: 'hidden', background: 'var(--bg2)' }}>
      {/* Header */}
      <div style={{ padding: 'var(--space-4) var(--space-5)', display: 'flex', alignItems: 'center', justifyContent: 'space-between', flexShrink: 0 }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 'var(--space-3)' }}>
          <span style={{ fontSize: 'var(--text-md)', fontWeight: 700, color: 'var(--tx0)', fontFamily: 'var(--font-sans)' }}>Chat</span>
          <span style={{ fontSize: 'var(--text-sm)', color: 'var(--tx2)', fontFamily: 'var(--font-sans)' }}>{projectName}</span>
        </div>
        <div style={{ display: 'flex', gap: 'var(--space-2)', alignItems: 'center' }}>
          <span style={{ fontSize: 'var(--text-xs)', background: 'var(--purple-bg)', color: 'var(--purple)', padding: 'var(--space-1) var(--space-3)', borderRadius: 'var(--radius-lg)', fontWeight: 700 }}>RAG</span>
          {msgs.length > 0 && (
            <button onClick={clearChat} style={{ fontSize: 'var(--text-sm)', color: 'var(--tx2)', background: 'var(--bg3)', border: 'none', cursor: 'pointer', padding: 'var(--space-1) var(--space-3)', borderRadius: 'var(--radius-lg)', fontFamily: 'var(--font-sans)' }}>clear</button>
          )}
        </div>
      </div>

      {/* Messages */}
      <div style={{ flex: 1, overflowY: 'auto', padding: 'var(--space-2) var(--space-5) var(--space-3)' }}>
        {isEmpty && (
          <div className="animate-fade-in" style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', gap: 'var(--space-3)', marginTop: 'var(--space-12)' }}>
            <div style={{ width: 56, height: 56, borderRadius: 'var(--radius-xl)', background: 'var(--bg1)', boxShadow: 'var(--shadow-card)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
              <Brain size={26} color="var(--brand)" />
            </div>
            <div style={{ fontSize: 'var(--text-lg)', fontWeight: 700, color: 'var(--tx0)', letterSpacing: '-0.01em', fontFamily: 'var(--font-sans)' }}>Ask about {projectName}</div>
            <div style={{ fontSize: 'var(--text-sm)', color: 'var(--tx2)', marginBottom: 'var(--space-2)', fontFamily: 'var(--font-sans)' }}>Based on your sources — documents, meetings, and slack messages</div>
            <div style={{ display: 'flex', flexDirection: 'column', gap: 'var(--space-2)', width: '100%', maxWidth: 440 }}>
              {SUGGESTED_QUESTIONS.map(q => (
                <div key={q} onClick={() => send(q)} className="suggest-q" style={{ padding: 'var(--space-3) var(--space-4)', background: 'var(--bg1)', borderRadius: 'var(--radius-xl)', fontSize: 'var(--text-sm)', color: 'var(--tx1)', cursor: 'pointer', boxShadow: 'var(--shadow-card)', fontFamily: 'var(--font-sans)' }}>
                  {q}
                </div>
              ))}
            </div>
          </div>
        )}

        {msgs.map(m => (
          <div key={m.id} className="animate-fade-in" style={{ marginBottom: 'var(--space-5)', display: 'flex', flexDirection: 'column', alignItems: m.role === 'user' ? 'flex-end' : 'flex-start' }}>
            <div style={{ fontSize: 'var(--text-xs)', color: 'var(--tx2)', marginBottom: 'var(--space-1-5)', fontWeight: 600, textTransform: 'uppercase', letterSpacing: '0.04em', fontFamily: 'var(--font-sans)' }}>
              {m.role === 'user' ? 'you' : 'project brain'}
            </div>
            <div style={{
              maxWidth: '82%', padding: 'var(--space-3) var(--space-4)', borderRadius: m.role === 'user' ? '12px 12px 4px 12px' : '4px 12px 12px 12px',
              background: m.role === 'user' ? 'var(--brand)' : 'var(--bg1)',
              color: m.role === 'user' ? '#fff' : 'var(--tx0)',
              boxShadow: 'var(--shadow-card)',
              fontSize: 'var(--text-sm)', lineHeight: 1.65, whiteSpace: 'pre-wrap',
              fontFamily: 'var(--font-sans)',
            }}>
              {m.role === 'assistant' ? renderContent(m.content) : m.content}
            </div>
            {m.role === 'assistant' && showTranslation[m.id] && translations[m.id] && (
              <div style={{ maxWidth: '82%', padding: 'var(--space-3) var(--space-3)', marginTop: 'var(--space-1-5)', borderRadius: '4px 12px 12px 12px', background: 'var(--amber-bg)', fontSize: 'var(--text-sm)', lineHeight: 1.6, whiteSpace: 'pre-wrap', color: 'var(--tx1)', fontFamily: 'var(--font-sans)' }}>
                <span style={{ fontSize: 'var(--text-xs)', color: 'var(--amber)', fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.04em' }}>VIETNAMESE</span>
                <div style={{ marginTop: 'var(--space-1)' }}>{translations[m.id]}</div>
              </div>
            )}
            {m.role === 'assistant' && (
              <div style={{ display: 'flex', gap: 'var(--space-1-5)', marginTop: 'var(--space-1-5)' }}>
                <button onClick={() => copyText(m.content, m.id)} style={{ padding: 'var(--space-1) var(--space-3)', borderRadius: 'var(--radius-lg)', fontSize: 'var(--text-xs)', cursor: 'pointer', background: 'var(--bg1)', border: 'none', color: copiedId === m.id ? 'var(--green)' : 'var(--tx2)', fontWeight: 500, transition: `all var(--duration-fast) var(--ease-default)`, boxShadow: 'var(--shadow-card)', fontFamily: 'var(--font-sans)' }}>
                  {copiedId === m.id ? 'Copied!' : 'Copy'}
                </button>
                <button onClick={() => translateMsg(m.id, m.content)} disabled={translating === m.id} style={{ padding: 'var(--space-1) var(--space-3)', borderRadius: 'var(--radius-lg)', fontSize: 'var(--text-xs)', cursor: translating === m.id ? 'wait' : 'pointer', background: showTranslation[m.id] ? 'var(--amber-bg)' : 'var(--bg1)', border: 'none', color: showTranslation[m.id] ? 'var(--amber)' : 'var(--tx2)', fontWeight: 500, transition: `all var(--duration-fast) var(--ease-default)`, opacity: translating === m.id ? 0.6 : 1, boxShadow: 'var(--shadow-card)', fontFamily: 'var(--font-sans)' }}>
                  {translating === m.id ? '...' : showTranslation[m.id] ? 'Hide VI' : 'VI'}
                </button>
              </div>
            )}
          </div>
        ))}

        {loading && (
          <div style={{ display: 'flex', alignItems: 'center', gap: 'var(--space-2)', color: 'var(--tx2)', fontSize: 'var(--text-sm)', marginBottom: 'var(--space-3)', fontFamily: 'var(--font-sans)' }}>
            <RefreshCw size={14} className="animate-spin" /> thinking...
          </div>
        )}
        <div ref={bottomRef} />
      </div>

      {/* Input */}
      <div style={{ padding: 'var(--space-3) var(--space-5)', display: 'flex', gap: 'var(--space-3)', flexShrink: 0 }}>
        <textarea
          value={input} onChange={e => setInput(e.target.value)}
          onKeyDown={e => { if (e.key === 'Enter' && !e.shiftKey) { e.preventDefault(); send() } }}
          placeholder="Write a message..."
          rows={1}
          style={{ flex: 1, background: 'var(--bg1)', border: 'none', borderRadius: 'var(--radius-xl)', padding: 'var(--space-3) var(--space-4)', fontSize: 'var(--text-sm)', color: 'var(--tx0)', resize: 'none', outline: 'none', lineHeight: 1.5, boxShadow: 'var(--shadow-card)', fontFamily: 'var(--font-sans)' }}
        />
        <button onClick={() => send()} disabled={loading || !input.trim()} style={{ padding: 'var(--space-3) var(--space-6)', borderRadius: 'var(--radius-xl)', background: 'var(--brand)', color: '#fff', border: 'none', fontSize: 'var(--text-sm)', cursor: 'pointer', fontWeight: 600, opacity: loading || !input.trim() ? .4 : 1, alignSelf: 'flex-end', transition: `all var(--duration-normal) var(--ease-default)`, fontFamily: 'var(--font-sans)' }}>
          Send
        </button>
      </div>
    </div>
  )
}
