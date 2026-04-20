'use client'
import { AlertCircle } from 'lucide-react'

interface Props {
  title: string
  message: string
  confirmText?: string
  cancelText?: string
  onConfirm: () => void
  onCancel: () => void
  danger?: boolean
}

export default function ConfirmModal({ title, message, confirmText = 'Delete', cancelText = 'Cancel', onConfirm, onCancel, danger = true }: Props) {
  return (
    <div style={{ position: 'fixed', inset: 0, zIndex: 1000, display: 'flex', alignItems: 'center', justifyContent: 'center', background: 'rgba(0,0,0,.35)', backdropFilter: 'blur(8px)', WebkitBackdropFilter: 'blur(8px)' }} onClick={onCancel}>
      <div onClick={e => e.stopPropagation()} className="animate-scale-in" style={{ width: 440, background: 'var(--bg1)', border: 'none', borderRadius: 'var(--radius-xl)', display: 'flex', flexDirection: 'column', overflow: 'hidden', boxShadow: 'var(--shadow-float)' }}>
        <div style={{ padding: 'var(--space-6) var(--space-6) var(--space-4)', display: 'flex', gap: 'var(--space-4)' }}>
          <div style={{ flexShrink: 0, width: 40, height: 40, borderRadius: 'var(--radius-full)', background: danger ? 'var(--red-bg)' : 'var(--brand-bg)', display: 'flex', alignItems: 'center', justifyContent: 'center', color: danger ? 'var(--red)' : 'var(--brand)' }}>
            <AlertCircle size={20} />
          </div>
          <div>
            <div style={{ fontSize: 'var(--text-lg)', fontWeight: 700, color: 'var(--tx0)', letterSpacing: 'var(--tracking-tight)', marginBottom: 'var(--space-2)' }}>{title}</div>
            <div style={{ fontSize: 'var(--text-sm)', color: 'var(--tx1)', lineHeight: 1.5 }}>{message}</div>
          </div>
        </div>

        <div style={{ padding: 'var(--space-4) var(--space-6)', display: 'flex', justifyContent: 'flex-end', borderTop: '1px solid var(--bd)', background: 'var(--bg2)', gap: 'var(--space-3)' }}>
          <button onClick={onCancel} style={{ padding: 'var(--space-2) var(--space-5)', background: 'var(--bg3)', border: 'none', borderRadius: 'var(--radius-lg)', fontSize: 'var(--text-sm)', color: 'var(--tx0)', cursor: 'pointer', fontWeight: 600, transition: 'all var(--duration-fast) var(--ease-default)' }}>
            {cancelText}
          </button>
          <button onClick={onConfirm} style={{ padding: 'var(--space-2) var(--space-5)', background: danger ? 'var(--red)' : 'var(--brand)', border: 'none', borderRadius: 'var(--radius-lg)', fontSize: 'var(--text-sm)', color: '#fff', cursor: 'pointer', fontWeight: 600, transition: 'all var(--duration-fast) var(--ease-default)' }}>
            {confirmText}
          </button>
        </div>
      </div>
    </div>
  )
}
