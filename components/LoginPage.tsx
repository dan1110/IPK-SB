'use client'
import { useState } from 'react'
import { Shield, Users } from 'lucide-react'
import type { UserRole } from '@/lib/types'

interface Props {
  onLogin: (role: UserRole) => void
}

const ROLES: { key: UserRole; label: string; desc: string; icon: typeof Shield; color: string; bg: string; bd: string }[] = [
  { key: 'boss', label: 'Boss', desc: 'Full access — manage projects, team, integrations, and approve flagged messages.', icon: Shield, color: 'var(--red)', bg: 'var(--red-bg)', bd: 'var(--red-bd)' },
  { key: 'employee', label: 'Employee', desc: 'View assigned projects, draft replies, upload knowledge, and chat with AI.', icon: Users, color: 'var(--purple)', bg: 'var(--purple-bg)', bd: 'var(--purple-bd)' },
]

export default function LoginPage({ onLogin }: Props) {
  const [selected, setSelected] = useState<UserRole | null>(null)
  const [hoveredRole, setHoveredRole] = useState<UserRole | null>(null)

  return (
    <div style={{
      height: '100vh', display: 'flex', alignItems: 'center', justifyContent: 'center',
      background: 'var(--bg0)', fontFamily: 'var(--font-sans)',
    }}>
      <div className="animate-fade-in" style={{
        width: 440, padding: 'var(--space-10)', background: 'var(--bg1)',
        borderRadius: 'var(--radius-2xl)', border: '1px solid var(--bd)',
        boxShadow: 'var(--shadow-lg)',
      }}>
        {/* Logo */}
        <div style={{ display: 'flex', alignItems: 'center', gap: 'var(--space-3)', marginBottom: 'var(--space-8)' }}>
          <div style={{
            width: 42, height: 42, background: 'var(--brand-gradient)',
            borderRadius: 'var(--radius-xl)',
            display: 'flex', alignItems: 'center', justifyContent: 'center',
            fontSize: 'var(--text-md)', fontWeight: 800, color: '#fff', flexShrink: 0,
          }}>PB</div>
          <div>
            <div style={{ fontSize: 'var(--text-xl)', fontWeight: 800, color: 'var(--tx0)', letterSpacing: 'var(--tracking-tight)' }}>Project Brain</div>
            <div style={{ fontSize: 'var(--text-sm)', color: 'var(--tx2)', fontWeight: 500 }}>Sign in to continue</div>
          </div>
        </div>

        {/* Role label */}
        <div style={{
          fontSize: 'var(--text-xs)', color: 'var(--tx2)', fontWeight: 700,
          textTransform: 'uppercase', letterSpacing: 'var(--tracking-wide)',
          marginBottom: 'var(--space-3)',
        }}>
          Select your role
        </div>

        {/* Role cards */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: 'var(--space-3)', marginBottom: 'var(--space-8)' }}>
          {ROLES.map(r => {
            const isSelected = selected === r.key
            const isHovered = hoveredRole === r.key
            return (
              <div
                key={r.key}
                onClick={() => setSelected(r.key)}
                onMouseEnter={() => setHoveredRole(r.key)}
                onMouseLeave={() => setHoveredRole(null)}
                style={{
                  display: 'flex', alignItems: 'center', gap: 'var(--space-4)',
                  padding: 'var(--space-5)', borderRadius: 'var(--radius-xl)',
                  cursor: 'pointer',
                  border: isSelected ? `2px solid ${r.color}` : '2px solid var(--bd)',
                  background: isSelected ? r.bg : isHovered ? 'var(--bg2)' : 'var(--bg1)',
                  transition: 'all var(--duration-fast) var(--ease-default)',
                }}
              >
                {/* Icon */}
                <div style={{
                  width: 48, height: 48, borderRadius: 'var(--radius-xl)',
                  background: isSelected ? r.bg : 'var(--bg3)',
                  border: isSelected ? `1px solid ${r.bd}` : '1px solid var(--bd)',
                  display: 'flex', alignItems: 'center', justifyContent: 'center',
                  color: isSelected ? r.color : 'var(--tx2)', flexShrink: 0,
                  transition: 'all var(--duration-fast)',
                }}>
                  <r.icon size={22} />
                </div>

                {/* Text */}
                <div style={{ flex: 1, minWidth: 0 }}>
                  <div style={{
                    fontSize: 'var(--text-base)', fontWeight: 700,
                    color: isSelected ? r.color : 'var(--tx0)',
                    marginBottom: 'var(--space-1)',
                    transition: 'color var(--duration-fast)',
                  }}>{r.label}</div>
                  <div style={{ fontSize: 'var(--text-xs)', color: 'var(--tx2)', lineHeight: 1.5, fontWeight: 500 }}>
                    {r.desc}
                  </div>
                </div>

                {/* Radio indicator */}
                <div style={{
                  width: 20, height: 20, borderRadius: 'var(--radius-full)',
                  border: isSelected ? `6px solid ${r.color}` : '2px solid var(--bd)',
                  background: isSelected ? '#fff' : 'var(--bg1)',
                  flexShrink: 0, transition: 'all var(--duration-fast)',
                }} />
              </div>
            )
          })}
        </div>

        {/* Login button */}
        <button
          onClick={() => selected && onLogin(selected)}
          disabled={!selected}
          style={{
            width: '100%', padding: 'var(--space-3-5)',
            background: selected ? 'var(--brand)' : 'var(--bg3)',
            border: 'none', borderRadius: 'var(--radius-xl)',
            fontSize: 'var(--text-base)', fontWeight: 700,
            color: selected ? '#fff' : 'var(--tx2)',
            cursor: selected ? 'pointer' : 'not-allowed',
            transition: 'all var(--duration-fast)',
            fontFamily: 'var(--font-sans)',
          }}
        >
          Continue
        </button>
      </div>
    </div>
  )
}
