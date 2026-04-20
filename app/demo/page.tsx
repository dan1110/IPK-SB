'use client'

import { useState } from 'react'
import {
  Search, Plus, Settings, ChevronDown, ChevronRight, Trash2,
  FileText, MessageSquare, Upload, Clock, Check, X, AlertTriangle,
  Info, Loader2, ExternalLink, Moon, Sun, FolderKanban, Users,
  LayoutDashboard, ArrowRight, Edit3, Copy, Flag, Eye
} from 'lucide-react'

export default function DesignSystemDemo() {
  const [theme, setTheme] = useState<'dark' | 'light'>('dark')
  const [activeTab, setActiveTab] = useState('colors')
  const [inputValue, setInputValue] = useState('')
  const [searchValue, setSearchValue] = useState('')
  const [textareaValue, setTextareaValue] = useState('')
  const [isLoading, setIsLoading] = useState(false)
  const [toastVisible, setToastVisible] = useState(false)

  const toggleTheme = () => setTheme(t => t === 'dark' ? 'light' : 'dark')

  const showToast = () => {
    setToastVisible(true)
    setTimeout(() => setToastVisible(false), 3000)
  }

  const sections = [
    { id: 'colors', label: 'Colors' },
    { id: 'typography', label: 'Typography' },
    { id: 'spacing', label: 'Spacing & Radius' },
    { id: 'buttons', label: 'Buttons' },
    { id: 'inputs', label: 'Inputs' },
    { id: 'cards', label: 'Cards' },
    { id: 'badges', label: 'Badges' },
    { id: 'misc', label: 'Misc' },
    { id: 'sample', label: 'Sample UI' },
  ]

  return (
    <div data-theme={theme} className="min-h-screen" style={{
      background: 'var(--color-bg-base)',
      color: 'var(--color-text-primary)',
      fontFamily: 'var(--font-sans)',
    }}>
      {/* ── Header ── */}
      <header style={{
        background: 'var(--color-bg-raised)',
        borderBottom: '1px solid var(--color-border-default)',
        padding: 'var(--space-4) var(--space-8)',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'space-between',
        position: 'sticky',
        top: 0,
        zIndex: 50,
      }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 'var(--space-3)' }}>
          <div style={{
            width: 32, height: 32,
            borderRadius: 'var(--radius-lg)',
            background: 'var(--color-accent)',
            display: 'flex', alignItems: 'center', justifyContent: 'center',
            color: 'var(--color-accent-text)',
            fontSize: 'var(--text-sm)', fontWeight: 600,
          }}>PK</div>
          <span style={{ fontSize: 'var(--text-md)', fontWeight: 600, letterSpacing: 'var(--tracking-tight)' }}>
            Design System Preview
          </span>
          <span style={{
            fontSize: 'var(--text-xs)',
            color: 'var(--color-text-tertiary)',
            background: 'var(--color-bg-subtle)',
            padding: '2px 8px',
            borderRadius: 'var(--radius-full)',
          }}>v1.0</span>
        </div>
        <button
          onClick={toggleTheme}
          style={{
            display: 'flex', alignItems: 'center', gap: 'var(--space-2)',
            padding: 'var(--space-2) var(--space-3)',
            borderRadius: 'var(--radius-md)',
            border: '1px solid var(--color-border-default)',
            background: 'var(--color-bg-subtle)',
            color: 'var(--color-text-secondary)',
            cursor: 'pointer',
            fontSize: 'var(--text-sm)',
            transition: 'all var(--duration-fast) var(--ease-default)',
          }}
        >
          {theme === 'dark' ? <Sun size={14} /> : <Moon size={14} />}
          {theme === 'dark' ? 'Light mode' : 'Dark mode'}
        </button>
      </header>

      <div style={{ display: 'flex' }}>
        {/* ── Sidebar Nav ── */}
        <nav style={{
          width: 200,
          padding: 'var(--space-4)',
          borderRight: '1px solid var(--color-border-default)',
          background: 'var(--color-bg-raised)',
          minHeight: 'calc(100vh - 65px)',
          position: 'sticky',
          top: 65,
          alignSelf: 'flex-start',
        }}>
          {sections.map(s => (
            <button
              key={s.id}
              onClick={() => {
                setActiveTab(s.id)
                document.getElementById(s.id)?.scrollIntoView({ behavior: 'smooth', block: 'start' })
              }}
              style={{
                display: 'block',
                width: '100%',
                textAlign: 'left',
                padding: 'var(--space-2) var(--space-3)',
                borderRadius: 'var(--radius-md)',
                border: 'none',
                background: activeTab === s.id ? 'var(--color-accent-subtle)' : 'transparent',
                color: activeTab === s.id ? 'var(--color-accent)' : 'var(--color-text-secondary)',
                cursor: 'pointer',
                fontSize: 'var(--text-sm)',
                fontWeight: activeTab === s.id ? 500 : 400,
                marginBottom: 'var(--space-0-5)',
                transition: 'all var(--duration-fast) var(--ease-default)',
                fontFamily: 'var(--font-sans)',
              }}
            >
              {s.label}
            </button>
          ))}
        </nav>

        {/* ── Main Content ── */}
        <main style={{
          flex: 1,
          padding: 'var(--space-8) var(--space-10)',
          maxWidth: 960,
          overflow: 'auto',
          height: 'calc(100vh - 65px)',
        }}>

          {/* ═══ COLORS ═══ */}
          <section id="colors" style={{ marginBottom: 'var(--space-16)' }}>
            <SectionTitle>Color Palette</SectionTitle>

            <SubTitle>Neutrals (Backgrounds)</SubTitle>
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(6, 1fr)', gap: 'var(--space-3)', marginBottom: 'var(--space-6)' }}>
              {[
                { name: 'bg-base', var: '--color-bg-base' },
                { name: 'bg-raised', var: '--color-bg-raised' },
                { name: 'bg-overlay', var: '--color-bg-overlay' },
                { name: 'bg-subtle', var: '--color-bg-subtle' },
                { name: 'bg-muted', var: '--color-bg-muted' },
                { name: 'bg-invert', var: '--color-bg-invert' },
              ].map(c => <ColorSwatch key={c.name} name={c.name} cssVar={c.var} />)}
            </div>

            <SubTitle>Text</SubTitle>
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: 'var(--space-3)', marginBottom: 'var(--space-6)' }}>
              {[
                { name: 'text-primary', var: '--color-text-primary' },
                { name: 'text-secondary', var: '--color-text-secondary' },
                { name: 'text-tertiary', var: '--color-text-tertiary' },
                { name: 'text-invert', var: '--color-text-invert' },
              ].map(c => <ColorSwatch key={c.name} name={c.name} cssVar={c.var} />)}
            </div>

            <SubTitle>Borders</SubTitle>
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: 'var(--space-3)', marginBottom: 'var(--space-6)' }}>
              {[
                { name: 'border-default', var: '--color-border-default' },
                { name: 'border-subtle', var: '--color-border-subtle' },
                { name: 'border-strong', var: '--color-border-strong' },
              ].map(c => <ColorSwatch key={c.name} name={c.name} cssVar={c.var} />)}
            </div>

            <SubTitle>Accent</SubTitle>
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: 'var(--space-3)', marginBottom: 'var(--space-6)' }}>
              {[
                { name: 'accent', var: '--color-accent' },
                { name: 'accent-hover', var: '--color-accent-hover' },
                { name: 'accent-subtle', var: '--color-accent-subtle' },
                { name: 'accent-text', var: '--color-accent-text' },
              ].map(c => <ColorSwatch key={c.name} name={c.name} cssVar={c.var} />)}
            </div>

            <SubTitle>Semantic</SubTitle>
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: 'var(--space-3)', marginBottom: 'var(--space-6)' }}>
              {[
                { name: 'success', var: '--color-success' },
                { name: 'warning', var: '--color-warning' },
                { name: 'danger', var: '--color-danger' },
                { name: 'info', var: '--color-info' },
              ].map(c => <ColorSwatch key={c.name} name={c.name} cssVar={c.var} />)}
            </div>
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: 'var(--space-3)' }}>
              {[
                { name: 'success-subtle', var: '--color-success-subtle' },
                { name: 'warning-subtle', var: '--color-warning-subtle' },
                { name: 'danger-subtle', var: '--color-danger-subtle' },
                { name: 'info-subtle', var: '--color-info-subtle' },
              ].map(c => <ColorSwatch key={c.name} name={c.name} cssVar={c.var} />)}
            </div>
          </section>

          {/* ═══ TYPOGRAPHY ═══ */}
          <section id="typography" style={{ marginBottom: 'var(--space-16)' }}>
            <SectionTitle>Typography</SectionTitle>

            <SubTitle>Inter — Type Scale</SubTitle>
            <div style={{ display: 'flex', flexDirection: 'column', gap: 'var(--space-5)', marginBottom: 'var(--space-8)' }}>
              {[
                { token: 'text-2xl', size: '28px', weight: 600, label: 'Dashboard Hero' },
                { token: 'text-xl', size: '22px', weight: 600, label: 'Page Title' },
                { token: 'text-lg', size: '18px', weight: 600, label: 'Section Heading' },
                { token: 'text-md', size: '15px', weight: 500, label: 'Nav / Emphasis' },
                { token: 'text-base', size: '14px', weight: 400, label: 'Body Text' },
                { token: 'text-sm', size: '13px', weight: 400, label: 'Secondary Label' },
                { token: 'text-xs', size: '11px', weight: 400, label: 'Badge / Meta' },
              ].map(t => (
                <div key={t.token} style={{ display: 'flex', alignItems: 'baseline', gap: 'var(--space-6)' }}>
                  <span style={{
                    fontSize: t.size,
                    fontWeight: t.weight,
                    letterSpacing: parseInt(t.size) >= 18 ? 'var(--tracking-tight)' : 'var(--tracking-normal)',
                    flex: 1,
                  }}>
                    Project Knowledge Workspace
                  </span>
                  <span style={{
                    fontSize: 'var(--text-xs)',
                    color: 'var(--color-text-tertiary)',
                    fontFamily: 'var(--font-mono)',
                    whiteSpace: 'nowrap',
                    minWidth: 180,
                  }}>
                    {t.token} / {t.size} / w{t.weight}
                  </span>
                  <span style={{
                    fontSize: 'var(--text-xs)',
                    color: 'var(--color-text-tertiary)',
                    minWidth: 120,
                  }}>
                    {t.label}
                  </span>
                </div>
              ))}
            </div>

            <SubTitle>JetBrains Mono — Monospace</SubTitle>
            <div style={{
              padding: 'var(--space-4)',
              background: 'var(--color-bg-subtle)',
              borderRadius: 'var(--radius-lg)',
              border: '1px solid var(--color-border-default)',
            }}>
              <code style={{
                fontFamily: 'var(--font-mono)',
                fontSize: '12px',
                lineHeight: '18px',
                color: 'var(--color-text-secondary)',
              }}>
                {`const project = await db.getProject("proj_x8k2m")\n`}
                {`// timestamps: 2024-01-15T09:30:00Z\n`}
                {`// ids: usr_a1b2c3, msg_d4e5f6`}
              </code>
            </div>

            <div style={{ marginTop: 'var(--space-6)' }}>
              <SubTitle>Letter Spacing</SubTitle>
              <div style={{ display: 'flex', flexDirection: 'column', gap: 'var(--space-3)' }}>
                <div>
                  <span style={{ fontSize: 'var(--text-lg)', fontWeight: 600, letterSpacing: 'var(--tracking-tight)' }}>
                    Tight tracking for headings
                  </span>
                  <span style={{ fontSize: 'var(--text-xs)', color: 'var(--color-text-tertiary)', marginLeft: 'var(--space-4)', fontFamily: 'var(--font-mono)' }}>-0.02em</span>
                </div>
                <div>
                  <span style={{ fontSize: 'var(--text-base)', letterSpacing: 'var(--tracking-normal)' }}>
                    Normal tracking for body text
                  </span>
                  <span style={{ fontSize: 'var(--text-xs)', color: 'var(--color-text-tertiary)', marginLeft: 'var(--space-4)', fontFamily: 'var(--font-mono)' }}>-0.01em</span>
                </div>
                <div>
                  <span style={{ fontSize: 'var(--text-xs)', fontWeight: 500, letterSpacing: 'var(--tracking-wide)', textTransform: 'uppercase', color: 'var(--color-text-tertiary)' }}>
                    Wide tracking for labels
                  </span>
                  <span style={{ fontSize: 'var(--text-xs)', color: 'var(--color-text-tertiary)', marginLeft: 'var(--space-4)', fontFamily: 'var(--font-mono)' }}>0.05em</span>
                </div>
              </div>
            </div>
          </section>

          {/* ═══ SPACING & RADIUS ═══ */}
          <section id="spacing" style={{ marginBottom: 'var(--space-16)' }}>
            <SectionTitle>Spacing & Radius</SectionTitle>

            <SubTitle>4px Grid Spacing Scale</SubTitle>
            <div style={{ display: 'flex', flexDirection: 'column', gap: 'var(--space-2)', marginBottom: 'var(--space-8)' }}>
              {[
                { token: 'space-1', px: '4px' },
                { token: 'space-2', px: '8px' },
                { token: 'space-3', px: '12px' },
                { token: 'space-4', px: '16px' },
                { token: 'space-5', px: '20px' },
                { token: 'space-6', px: '24px' },
                { token: 'space-8', px: '32px' },
                { token: 'space-10', px: '40px' },
                { token: 'space-12', px: '48px' },
              ].map(s => (
                <div key={s.token} style={{ display: 'flex', alignItems: 'center', gap: 'var(--space-4)' }}>
                  <span style={{ fontSize: 'var(--text-xs)', fontFamily: 'var(--font-mono)', color: 'var(--color-text-tertiary)', width: 80 }}>{s.token}</span>
                  <div style={{
                    width: s.px,
                    height: 20,
                    background: 'var(--color-accent)',
                    borderRadius: 'var(--radius-sm)',
                    opacity: 0.7,
                  }} />
                  <span style={{ fontSize: 'var(--text-xs)', color: 'var(--color-text-tertiary)' }}>{s.px}</span>
                </div>
              ))}
            </div>

            <SubTitle>Border Radius</SubTitle>
            <div style={{ display: 'flex', gap: 'var(--space-6)', flexWrap: 'wrap' }}>
              {[
                { token: 'radius-sm', val: '4px' },
                { token: 'radius-md', val: '6px' },
                { token: 'radius-lg', val: '8px' },
                { token: 'radius-xl', val: '12px' },
                { token: 'radius-full', val: '9999px' },
              ].map(r => (
                <div key={r.token} style={{ textAlign: 'center' }}>
                  <div style={{
                    width: 64, height: 64,
                    background: 'var(--color-bg-subtle)',
                    border: '2px solid var(--color-border-strong)',
                    borderRadius: r.val,
                    marginBottom: 'var(--space-2)',
                  }} />
                  <div style={{ fontSize: 'var(--text-xs)', fontFamily: 'var(--font-mono)', color: 'var(--color-text-tertiary)' }}>{r.token}</div>
                  <div style={{ fontSize: 'var(--text-xs)', color: 'var(--color-text-tertiary)' }}>{r.val}</div>
                </div>
              ))}
            </div>

            <div style={{ marginTop: 'var(--space-8)' }}>
              <SubTitle>Shadows</SubTitle>
              <div style={{ display: 'flex', gap: 'var(--space-6)', flexWrap: 'wrap' }}>
                {[
                  { token: 'shadow-xs', val: 'var(--shadow-xs)' },
                  { token: 'shadow-sm', val: 'var(--shadow-sm)' },
                  { token: 'shadow-md', val: 'var(--shadow-md)' },
                  { token: 'shadow-lg', val: 'var(--shadow-lg)' },
                ].map(s => (
                  <div key={s.token} style={{ textAlign: 'center' }}>
                    <div style={{
                      width: 80, height: 80,
                      background: 'var(--color-bg-raised)',
                      borderRadius: 'var(--radius-lg)',
                      boxShadow: s.val,
                      border: '1px solid var(--color-border-default)',
                      marginBottom: 'var(--space-2)',
                    }} />
                    <div style={{ fontSize: 'var(--text-xs)', fontFamily: 'var(--font-mono)', color: 'var(--color-text-tertiary)' }}>{s.token}</div>
                  </div>
                ))}
              </div>
            </div>
          </section>

          {/* ═══ BUTTONS ═══ */}
          <section id="buttons" style={{ marginBottom: 'var(--space-16)' }}>
            <SectionTitle>Buttons</SectionTitle>

            <SubTitle>Variants</SubTitle>
            <div style={{ display: 'flex', gap: 'var(--space-3)', alignItems: 'center', flexWrap: 'wrap', marginBottom: 'var(--space-6)' }}>
              <DemoButton variant="primary">Primary</DemoButton>
              <DemoButton variant="secondary">Secondary</DemoButton>
              <DemoButton variant="ghost">Ghost</DemoButton>
              <DemoButton variant="danger">Danger</DemoButton>
              <DemoButton variant="primary" icon={<Plus size={14} />}>With Icon</DemoButton>
              <DemoButton variant="ghost" iconOnly><Settings size={16} /></DemoButton>
            </div>

            <SubTitle>States</SubTitle>
            <div style={{ display: 'flex', gap: 'var(--space-3)', alignItems: 'center', flexWrap: 'wrap', marginBottom: 'var(--space-6)' }}>
              <DemoButton variant="primary">Default</DemoButton>
              <DemoButton variant="primary" disabled>Disabled</DemoButton>
              <DemoButton variant="primary" loading>Loading</DemoButton>
            </div>

            <SubTitle>Sizes</SubTitle>
            <div style={{ display: 'flex', gap: 'var(--space-3)', alignItems: 'center' }}>
              <DemoButton variant="primary" size="sm">Small</DemoButton>
              <DemoButton variant="primary" size="md">Medium</DemoButton>
              <DemoButton variant="primary" size="lg">Large</DemoButton>
            </div>
          </section>

          {/* ═══ INPUTS ═══ */}
          <section id="inputs" style={{ marginBottom: 'var(--space-16)' }}>
            <SectionTitle>Inputs</SectionTitle>

            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 'var(--space-6)', marginBottom: 'var(--space-6)' }}>
              <div>
                <InputLabel>Text Input</InputLabel>
                <DemoInput
                  placeholder="Enter project name..."
                  value={inputValue}
                  onChange={(e: React.ChangeEvent<HTMLInputElement>) => setInputValue(e.target.value)}
                />
              </div>
              <div>
                <InputLabel>Search</InputLabel>
                <DemoInput
                  placeholder="Search knowledge base..."
                  value={searchValue}
                  onChange={(e: React.ChangeEvent<HTMLInputElement>) => setSearchValue(e.target.value)}
                  icon={<Search size={14} />}
                />
              </div>
            </div>

            <div style={{ marginBottom: 'var(--space-6)' }}>
              <InputLabel>Textarea</InputLabel>
              <textarea
                placeholder="Write meeting notes..."
                value={textareaValue}
                onChange={(e) => setTextareaValue(e.target.value)}
                rows={3}
                style={{
                  width: '100%',
                  padding: 'var(--space-3)',
                  background: 'var(--color-bg-subtle)',
                  border: '1px solid var(--color-border-default)',
                  borderRadius: 'var(--radius-md)',
                  color: 'var(--color-text-primary)',
                  fontSize: 'var(--text-base)',
                  fontFamily: 'var(--font-sans)',
                  resize: 'vertical',
                  outline: 'none',
                  transition: 'border-color var(--duration-fast) var(--ease-default)',
                }}
              />
            </div>

            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 'var(--space-6)' }}>
              <div>
                <InputLabel>Disabled</InputLabel>
                <DemoInput placeholder="Cannot edit" disabled />
              </div>
              <div>
                <InputLabel>With Error</InputLabel>
                <DemoInput placeholder="Required field" error="This field is required" />
              </div>
            </div>
          </section>

          {/* ═══ CARDS ═══ */}
          <section id="cards" style={{ marginBottom: 'var(--space-16)' }}>
            <SectionTitle>Cards</SectionTitle>

            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: 'var(--space-4)', marginBottom: 'var(--space-6)' }}>
              {/* Default Card */}
              <DemoCard>
                <div style={{ display: 'flex', alignItems: 'center', gap: 'var(--space-2)', marginBottom: 'var(--space-3)' }}>
                  <div style={{
                    width: 8, height: 8, borderRadius: 'var(--radius-full)',
                    background: 'var(--color-success)',
                  }} />
                  <span style={{ fontSize: 'var(--text-md)', fontWeight: 600 }}>Acme Corp</span>
                </div>
                <p style={{ fontSize: 'var(--text-sm)', color: 'var(--color-text-secondary)', marginBottom: 'var(--space-3)' }}>
                  12 knowledge pages, 8 meetings
                </p>
                <div style={{ display: 'flex', gap: 'var(--space-2)' }}>
                  <DemoBadge variant="neutral">Active</DemoBadge>
                  <DemoBadge variant="info">3 pending</DemoBadge>
                </div>
              </DemoCard>

              {/* Interactive Card */}
              <DemoCard interactive>
                <div style={{ display: 'flex', alignItems: 'center', gap: 'var(--space-2)', marginBottom: 'var(--space-3)' }}>
                  <div style={{
                    width: 8, height: 8, borderRadius: 'var(--radius-full)',
                    background: 'var(--color-warning)',
                  }} />
                  <span style={{ fontSize: 'var(--text-md)', fontWeight: 600 }}>TechStart Inc</span>
                </div>
                <p style={{ fontSize: 'var(--text-sm)', color: 'var(--color-text-secondary)', marginBottom: 'var(--space-3)' }}>
                  5 knowledge pages, 2 meetings
                </p>
                <div style={{ display: 'flex', gap: 'var(--space-2)' }}>
                  <DemoBadge variant="warning">Flagged</DemoBadge>
                </div>
              </DemoCard>

              {/* Compact Card */}
              <DemoCard compact>
                <div style={{ display: 'flex', alignItems: 'center', gap: 'var(--space-2)', marginBottom: 'var(--space-2)' }}>
                  <div style={{
                    width: 8, height: 8, borderRadius: 'var(--radius-full)',
                    background: 'var(--color-accent)',
                  }} />
                  <span style={{ fontSize: 'var(--text-sm)', fontWeight: 500 }}>GlobalDev</span>
                </div>
                <p style={{ fontSize: 'var(--text-xs)', color: 'var(--color-text-tertiary)' }}>
                  Last active 2h ago
                </p>
              </DemoCard>
            </div>

            <SubTitle>Skeleton Loading</SubTitle>
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: 'var(--space-4)' }}>
              <SkeletonCard />
              <SkeletonCard />
              <SkeletonCard />
            </div>
          </section>

          {/* ═══ BADGES ═══ */}
          <section id="badges" style={{ marginBottom: 'var(--space-16)' }}>
            <SectionTitle>Badges</SectionTitle>
            <div style={{ display: 'flex', gap: 'var(--space-3)', flexWrap: 'wrap' }}>
              <DemoBadge variant="neutral">Neutral</DemoBadge>
              <DemoBadge variant="accent">Accent</DemoBadge>
              <DemoBadge variant="success">Success</DemoBadge>
              <DemoBadge variant="warning">Warning</DemoBadge>
              <DemoBadge variant="danger">Danger</DemoBadge>
              <DemoBadge variant="info">Info</DemoBadge>
              <DemoBadge variant="accent" dot>With Dot</DemoBadge>
            </div>
          </section>

          {/* ═══ MISC ═══ */}
          <section id="misc" style={{ marginBottom: 'var(--space-16)' }}>
            <SectionTitle>Misc Components</SectionTitle>

            <SubTitle>Icons (Lucide React — 16/20/24px)</SubTitle>
            <div style={{ display: 'flex', gap: 'var(--space-5)', alignItems: 'end', marginBottom: 'var(--space-8)', color: 'var(--color-text-secondary)' }}>
              {[FileText, MessageSquare, Upload, Settings, Users, FolderKanban, LayoutDashboard, Search, Edit3, Copy, Flag, Eye, Clock, AlertTriangle].map((Icon, i) => (
                <div key={i} style={{ textAlign: 'center' }}>
                  <Icon size={20} />
                  <div style={{ fontSize: 9, marginTop: 'var(--space-1)', color: 'var(--color-text-tertiary)' }}>20</div>
                </div>
              ))}
            </div>

            <SubTitle>Toast</SubTitle>
            <div style={{ display: 'flex', gap: 'var(--space-3)', marginBottom: 'var(--space-4)' }}>
              <DemoButton variant="secondary" onClick={showToast}>Show Toast</DemoButton>
            </div>
            {toastVisible && (
              <div style={{
                position: 'fixed',
                bottom: 24,
                right: 24,
                padding: 'var(--space-3) var(--space-4)',
                background: 'var(--color-bg-invert)',
                color: 'var(--color-text-invert)',
                borderRadius: 'var(--radius-lg)',
                fontSize: 'var(--text-sm)',
                boxShadow: 'var(--shadow-lg)',
                display: 'flex',
                alignItems: 'center',
                gap: 'var(--space-2)',
                animation: 'slideUp .25s ease-out',
                zIndex: 100,
              }}>
                <Check size={14} /> Knowledge page deleted.
                <button style={{
                  marginLeft: 'var(--space-3)',
                  color: 'var(--color-accent)',
                  background: 'none',
                  border: 'none',
                  cursor: 'pointer',
                  fontSize: 'var(--text-sm)',
                  fontWeight: 500,
                  fontFamily: 'var(--font-sans)',
                }}>Undo</button>
              </div>
            )}

            <SubTitle>Confirm Dialog</SubTitle>
            <DemoCard>
              <div style={{ padding: 'var(--space-2)' }}>
                <div style={{ fontSize: 'var(--text-md)', fontWeight: 600, marginBottom: 'var(--space-2)' }}>Delete project?</div>
                <p style={{ fontSize: 'var(--text-sm)', color: 'var(--color-text-secondary)', marginBottom: 'var(--space-5)' }}>
                  This will permanently delete &quot;Acme Corp&quot; and all its knowledge pages, meeting notes, and chat history. This action cannot be undone.
                </p>
                <div style={{ display: 'flex', gap: 'var(--space-2)', justifyContent: 'flex-end' }}>
                  <DemoButton variant="ghost">Cancel</DemoButton>
                  <DemoButton variant="danger">Delete project</DemoButton>
                </div>
              </div>
            </DemoCard>

            <div style={{ marginTop: 'var(--space-8)' }}>
              <SubTitle>Separator</SubTitle>
              <div style={{ height: 1, background: 'var(--color-border-default)', marginBottom: 'var(--space-3)' }} />
              <div style={{ height: 1, background: 'var(--color-border-subtle)' }} />
            </div>

            <div style={{ marginTop: 'var(--space-8)' }}>
              <SubTitle>Avatar</SubTitle>
              <div style={{ display: 'flex', gap: 'var(--space-3)', alignItems: 'center' }}>
                <DemoAvatar initials="SC" />
                <DemoAvatar initials="NK" color="var(--color-success)" />
                <DemoAvatar initials="DT" color="var(--color-warning)" />
                <DemoAvatar initials="PK" color="var(--color-danger)" size={28} />
                <DemoAvatar initials="TL" color="var(--color-info)" size={40} />
              </div>
            </div>

            <div style={{ marginTop: 'var(--space-8)' }}>
              <SubTitle>Progress / Upload Steps</SubTitle>
              <div style={{ display: 'flex', gap: 'var(--space-1)', alignItems: 'center' }}>
                {['Upload', 'Transcribe', 'Enrich', 'Route'].map((step, i) => (
                  <div key={step} style={{ display: 'flex', alignItems: 'center' }}>
                    <div style={{
                      padding: 'var(--space-1-5) var(--space-3)',
                      borderRadius: 'var(--radius-full)',
                      fontSize: 'var(--text-xs)',
                      fontWeight: 500,
                      background: i < 2 ? 'var(--color-accent)' : i === 2 ? 'var(--color-accent-subtle)' : 'var(--color-bg-muted)',
                      color: i < 2 ? 'var(--color-accent-text)' : i === 2 ? 'var(--color-accent)' : 'var(--color-text-tertiary)',
                    }}>
                      {i < 2 ? <Check size={12} style={{ display: 'inline', marginRight: 4 }} /> : null}
                      {step}
                    </div>
                    {i < 3 && <ChevronRight size={14} style={{ margin: '0 var(--space-1)', color: 'var(--color-text-tertiary)' }} />}
                  </div>
                ))}
              </div>
            </div>
          </section>

          {/* ═══ SAMPLE UI ═══ */}
          <section id="sample" style={{ marginBottom: 'var(--space-16)' }}>
            <SectionTitle>Sample UI Compositions</SectionTitle>

            <SubTitle>Sidebar + Project List</SubTitle>
            <div style={{
              display: 'flex',
              border: '1px solid var(--color-border-default)',
              borderRadius: 'var(--radius-xl)',
              overflow: 'hidden',
              height: 400,
              marginBottom: 'var(--space-8)',
            }}>
              {/* Mini Sidebar */}
              <div style={{
                width: 240,
                background: 'var(--color-bg-raised)',
                borderRight: '1px solid var(--color-border-default)',
                padding: 'var(--space-4)',
                display: 'flex',
                flexDirection: 'column',
              }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: 'var(--space-2)', marginBottom: 'var(--space-5)' }}>
                  <div style={{
                    width: 28, height: 28, borderRadius: 'var(--radius-md)',
                    background: 'var(--color-accent)', display: 'flex', alignItems: 'center', justifyContent: 'center',
                    color: 'var(--color-accent-text)', fontSize: 11, fontWeight: 700,
                  }}>PK</div>
                  <span style={{ fontSize: 'var(--text-sm)', fontWeight: 600 }}>Project Brain</span>
                </div>

                <div style={{ marginBottom: 'var(--space-4)' }}>
                  {[
                    { icon: <LayoutDashboard size={15} />, label: 'Dashboard', active: false },
                    { icon: <FolderKanban size={15} />, label: 'Projects', active: true },
                    { icon: <Users size={15} />, label: 'Team', active: false },
                    { icon: <Settings size={15} />, label: 'Settings', active: false },
                  ].map(item => (
                    <div key={item.label} style={{
                      display: 'flex', alignItems: 'center', gap: 'var(--space-2)',
                      padding: 'var(--space-2) var(--space-3)',
                      borderRadius: 'var(--radius-md)',
                      fontSize: 'var(--text-sm)',
                      color: item.active ? 'var(--color-text-primary)' : 'var(--color-text-secondary)',
                      background: item.active ? 'var(--color-bg-subtle)' : 'transparent',
                      fontWeight: item.active ? 500 : 400,
                      marginBottom: 'var(--space-0-5)',
                      cursor: 'pointer',
                    }}>
                      {item.icon} {item.label}
                    </div>
                  ))}
                </div>

                <div style={{ fontSize: 'var(--text-xs)', fontWeight: 500, color: 'var(--color-text-tertiary)', textTransform: 'uppercase', letterSpacing: 'var(--tracking-wide)', marginBottom: 'var(--space-2)', paddingLeft: 'var(--space-3)' }}>
                  Projects
                </div>
                {[
                  { name: 'Acme Corp', color: '#22C55E' },
                  { name: 'TechStart', color: '#F59E0B' },
                  { name: 'GlobalDev', color: '#3B82F6' },
                ].map(p => (
                  <div key={p.name} style={{
                    display: 'flex', alignItems: 'center', gap: 'var(--space-2)',
                    padding: 'var(--space-2) var(--space-3)',
                    borderRadius: 'var(--radius-md)',
                    fontSize: 'var(--text-sm)',
                    color: 'var(--color-text-secondary)',
                    cursor: 'pointer',
                  }}>
                    <div style={{ width: 7, height: 7, borderRadius: 'var(--radius-full)', background: p.color }} />
                    {p.name}
                  </div>
                ))}

                <div style={{ marginTop: 'auto', borderTop: '1px solid var(--color-border-default)', paddingTop: 'var(--space-3)' }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: 'var(--space-2)' }}>
                    <DemoAvatar initials="SC" size={28} />
                    <div>
                      <div style={{ fontSize: 'var(--text-sm)', fontWeight: 500 }}>Steven Cao</div>
                      <div style={{ fontSize: 'var(--text-xs)', color: 'var(--color-text-tertiary)' }}>Boss</div>
                    </div>
                  </div>
                </div>
              </div>

              {/* Main Content */}
              <div style={{ flex: 1, padding: 'var(--space-6)', background: 'var(--color-bg-base)', overflow: 'auto' }}>
                <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 'var(--space-5)' }}>
                  <h2 style={{ fontSize: 'var(--text-xl)', fontWeight: 600, letterSpacing: 'var(--tracking-tight)' }}>Projects</h2>
                  <DemoButton variant="primary" icon={<Plus size={14} />} size="sm">New Project</DemoButton>
                </div>

                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 'var(--space-3)' }}>
                  {[
                    { name: 'Acme Corp', color: '#22C55E', pages: 12, meetings: 8, pending: 3, lastActive: '2h ago' },
                    { name: 'TechStart Inc', color: '#F59E0B', pages: 5, meetings: 2, pending: 1, lastActive: '1d ago' },
                    { name: 'GlobalDev', color: '#3B82F6', pages: 8, meetings: 4, pending: 0, lastActive: '30m ago' },
                    { name: 'MegaCorp', color: '#EF4444', pages: 3, meetings: 1, pending: 5, lastActive: '5m ago' },
                  ].map(p => (
                    <div key={p.name} style={{
                      padding: 'var(--space-4)',
                      background: 'var(--color-bg-raised)',
                      border: '1px solid var(--color-border-default)',
                      borderRadius: 'var(--radius-lg)',
                      cursor: 'pointer',
                      transition: 'border-color var(--duration-fast) var(--ease-default)',
                    }}>
                      <div style={{ display: 'flex', alignItems: 'center', gap: 'var(--space-2)', marginBottom: 'var(--space-2)' }}>
                        <div style={{ width: 8, height: 8, borderRadius: 'var(--radius-full)', background: p.color }} />
                        <span style={{ fontSize: 'var(--text-md)', fontWeight: 600 }}>{p.name}</span>
                        {p.pending > 0 && <DemoBadge variant="danger" small>{p.pending}</DemoBadge>}
                      </div>
                      <div style={{ fontSize: 'var(--text-sm)', color: 'var(--color-text-secondary)', marginBottom: 'var(--space-2)' }}>
                        {p.pages} pages, {p.meetings} meetings
                      </div>
                      <div style={{ fontSize: 'var(--text-xs)', color: 'var(--color-text-tertiary)' }}>
                        Active {p.lastActive}
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            </div>

            <SubTitle>Meeting Notes — Two Column</SubTitle>
            <div style={{
              display: 'flex',
              border: '1px solid var(--color-border-default)',
              borderRadius: 'var(--radius-xl)',
              overflow: 'hidden',
              height: 300,
            }}>
              {/* Transcript side */}
              <div style={{ flex: 1, padding: 'var(--space-5)', borderRight: '1px solid var(--color-border-default)', background: 'var(--color-bg-raised)', overflow: 'auto' }}>
                <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 'var(--space-4)' }}>
                  <span style={{ fontSize: 'var(--text-sm)', fontWeight: 600 }}>Transcript</span>
                  <DemoBadge variant="neutral">EN</DemoBadge>
                </div>
                {[
                  { time: '00:00', speaker: 'Steven', text: 'Let\'s review the Q1 deliverables and timeline.' },
                  { time: '00:45', speaker: 'Sarah', text: 'The API integration is 80% complete. We need two more days for testing.' },
                  { time: '01:30', speaker: 'Steven', text: 'What about the authentication module? Any blockers?' },
                  { time: '02:15', speaker: 'David', text: 'OAuth flow is done. Waiting on client credentials from their team.' },
                ].map((line, i) => (
                  <div key={i} style={{ marginBottom: 'var(--space-3)', display: 'flex', gap: 'var(--space-3)' }}>
                    <span style={{ fontSize: 'var(--text-xs)', fontFamily: 'var(--font-mono)', color: 'var(--color-text-tertiary)', minWidth: 36, paddingTop: 2 }}>{line.time}</span>
                    <div>
                      <span style={{ fontSize: 'var(--text-sm)', fontWeight: 500, color: 'var(--color-accent)' }}>{line.speaker}: </span>
                      <span style={{ fontSize: 'var(--text-sm)', color: 'var(--color-text-secondary)' }}>{line.text}</span>
                    </div>
                  </div>
                ))}
              </div>

              {/* Summary side */}
              <div style={{ flex: 1, padding: 'var(--space-5)', background: 'var(--color-bg-base)', overflow: 'auto' }}>
                <span style={{ fontSize: 'var(--text-sm)', fontWeight: 600, display: 'block', marginBottom: 'var(--space-4)' }}>Summary</span>

                <div style={{ marginBottom: 'var(--space-4)' }}>
                  <span style={{ fontSize: 'var(--text-xs)', fontWeight: 500, color: 'var(--color-text-tertiary)', textTransform: 'uppercase', letterSpacing: 'var(--tracking-wide)', display: 'block', marginBottom: 'var(--space-2)' }}>Key Decisions</span>
                  <div style={{ fontSize: 'var(--text-sm)', color: 'var(--color-text-secondary)', paddingLeft: 'var(--space-3)', borderLeft: '2px solid var(--color-accent)', marginBottom: 'var(--space-2)' }}>
                    API integration deadline extended by 2 days for testing
                  </div>
                  <div style={{ fontSize: 'var(--text-sm)', color: 'var(--color-text-secondary)', paddingLeft: 'var(--space-3)', borderLeft: '2px solid var(--color-accent)' }}>
                    OAuth implementation approved, pending client credentials
                  </div>
                </div>

                <div>
                  <span style={{ fontSize: 'var(--text-xs)', fontWeight: 500, color: 'var(--color-text-tertiary)', textTransform: 'uppercase', letterSpacing: 'var(--tracking-wide)', display: 'block', marginBottom: 'var(--space-2)' }}>Action Items</span>
                  {['Follow up with client for OAuth credentials', 'Complete API integration testing', 'Schedule demo for next Friday'].map((item, i) => (
                    <div key={i} style={{ display: 'flex', alignItems: 'center', gap: 'var(--space-2)', marginBottom: 'var(--space-2)', fontSize: 'var(--text-sm)', color: 'var(--color-text-secondary)' }}>
                      <div style={{ width: 14, height: 14, borderRadius: 'var(--radius-sm)', border: '1.5px solid var(--color-border-strong)', flexShrink: 0 }} />
                      {item}
                    </div>
                  ))}
                </div>
              </div>
            </div>
          </section>

        </main>
      </div>
    </div>
  )
}

/* ── Sub-components ── */

function SectionTitle({ children }: { children: React.ReactNode }) {
  return (
    <h2 style={{
      fontSize: 'var(--text-xl)',
      fontWeight: 600,
      letterSpacing: 'var(--tracking-tight)',
      marginBottom: 'var(--space-6)',
      paddingBottom: 'var(--space-3)',
      borderBottom: '1px solid var(--color-border-default)',
    }}>
      {children}
    </h2>
  )
}

function SubTitle({ children }: { children: React.ReactNode }) {
  return (
    <h3 style={{
      fontSize: 'var(--text-xs)',
      fontWeight: 500,
      textTransform: 'uppercase',
      letterSpacing: 'var(--tracking-wide)',
      color: 'var(--color-text-tertiary)',
      marginBottom: 'var(--space-3)',
      marginTop: 'var(--space-6)',
    }}>
      {children}
    </h3>
  )
}

function ColorSwatch({ name, cssVar }: { name: string; cssVar: string }) {
  return (
    <div>
      <div style={{
        width: '100%',
        height: 48,
        background: `var(${cssVar})`,
        borderRadius: 'var(--radius-md)',
        border: '1px solid var(--color-border-default)',
        marginBottom: 'var(--space-1)',
      }} />
      <div style={{ fontSize: 'var(--text-xs)', fontWeight: 500 }}>{name}</div>
      <div style={{ fontSize: 9, fontFamily: 'var(--font-mono)', color: 'var(--color-text-tertiary)' }}>{cssVar}</div>
    </div>
  )
}

function DemoButton({
  children, variant = 'primary', size = 'md', icon, iconOnly, disabled, loading, onClick
}: {
  children?: React.ReactNode
  variant?: 'primary' | 'secondary' | 'ghost' | 'danger'
  size?: 'sm' | 'md' | 'lg'
  icon?: React.ReactNode
  iconOnly?: boolean
  disabled?: boolean
  loading?: boolean
  onClick?: () => void
}) {
  const styles: Record<string, React.CSSProperties> = {
    primary: {
      background: 'var(--color-accent)',
      color: 'var(--color-accent-text)',
      border: 'none',
    },
    secondary: {
      background: 'var(--color-bg-subtle)',
      color: 'var(--color-text-primary)',
      border: '1px solid var(--color-border-default)',
    },
    ghost: {
      background: 'transparent',
      color: 'var(--color-text-secondary)',
      border: '1px solid transparent',
    },
    danger: {
      background: 'var(--color-danger)',
      color: '#FFFFFF',
      border: 'none',
    },
  }

  const sizes: Record<string, React.CSSProperties> = {
    sm: { padding: iconOnly ? '6px' : '4px 10px', fontSize: 'var(--text-sm)' },
    md: { padding: iconOnly ? '8px' : '6px 14px', fontSize: 'var(--text-sm)' },
    lg: { padding: iconOnly ? '10px' : '8px 18px', fontSize: 'var(--text-base)' },
  }

  return (
    <button
      disabled={disabled || loading}
      onClick={onClick}
      style={{
        ...styles[variant],
        ...sizes[size],
        borderRadius: 'var(--radius-md)',
        fontWeight: 500,
        fontFamily: 'var(--font-sans)',
        cursor: disabled ? 'not-allowed' : 'pointer',
        opacity: disabled ? 0.5 : 1,
        display: 'inline-flex',
        alignItems: 'center',
        gap: 'var(--space-1-5)',
        transition: 'all var(--duration-fast) var(--ease-default)',
        lineHeight: 1,
      }}
    >
      {loading && <Loader2 size={14} style={{ animation: 'spin .8s linear infinite' }} />}
      {!loading && icon}
      {!iconOnly && children}
    </button>
  )
}

function DemoInput({
  placeholder, value, onChange, icon, disabled, error
}: {
  placeholder?: string
  value?: string
  onChange?: (e: React.ChangeEvent<HTMLInputElement>) => void
  icon?: React.ReactNode
  disabled?: boolean
  error?: string
}) {
  return (
    <div>
      <div style={{ position: 'relative' }}>
        {icon && (
          <div style={{
            position: 'absolute', left: 10, top: '50%', transform: 'translateY(-50%)',
            color: 'var(--color-text-tertiary)',
          }}>{icon}</div>
        )}
        <input
          type="text"
          placeholder={placeholder}
          value={value}
          onChange={onChange}
          disabled={disabled}
          style={{
            width: '100%',
            padding: 'var(--space-2) var(--space-3)',
            paddingLeft: icon ? 32 : 'var(--space-3)',
            background: disabled ? 'var(--color-bg-muted)' : 'var(--color-bg-subtle)',
            border: `1px solid ${error ? 'var(--color-danger)' : 'var(--color-border-default)'}`,
            borderRadius: 'var(--radius-md)',
            color: 'var(--color-text-primary)',
            fontSize: 'var(--text-base)',
            fontFamily: 'var(--font-sans)',
            outline: 'none',
            opacity: disabled ? 0.5 : 1,
            transition: 'border-color var(--duration-fast) var(--ease-default)',
          }}
        />
      </div>
      {error && (
        <div style={{ fontSize: 'var(--text-xs)', color: 'var(--color-danger)', marginTop: 'var(--space-1)' }}>
          {error}
        </div>
      )}
    </div>
  )
}

function InputLabel({ children }: { children: React.ReactNode }) {
  return (
    <label style={{
      fontSize: 'var(--text-sm)',
      fontWeight: 500,
      color: 'var(--color-text-secondary)',
      display: 'block',
      marginBottom: 'var(--space-1-5)',
    }}>
      {children}
    </label>
  )
}

function DemoCard({ children, interactive, compact }: { children: React.ReactNode; interactive?: boolean; compact?: boolean }) {
  return (
    <div style={{
      padding: compact ? 'var(--space-3)' : 'var(--space-4)',
      background: 'var(--color-bg-raised)',
      border: '1px solid var(--color-border-default)',
      borderRadius: 'var(--radius-lg)',
      cursor: interactive ? 'pointer' : 'default',
      transition: 'border-color var(--duration-fast) var(--ease-default), transform var(--duration-normal) var(--ease-out)',
    }}>
      {children}
    </div>
  )
}

function DemoBadge({ children, variant, dot, small }: {
  children: React.ReactNode
  variant: 'neutral' | 'accent' | 'success' | 'warning' | 'danger' | 'info'
  dot?: boolean
  small?: boolean
}) {
  const colors: Record<string, { bg: string; color: string }> = {
    neutral: { bg: 'var(--color-bg-muted)', color: 'var(--color-text-secondary)' },
    accent: { bg: 'var(--color-accent-subtle)', color: 'var(--color-accent)' },
    success: { bg: 'var(--color-success-subtle)', color: 'var(--color-success)' },
    warning: { bg: 'var(--color-warning-subtle)', color: 'var(--color-warning)' },
    danger: { bg: 'var(--color-danger-subtle)', color: 'var(--color-danger)' },
    info: { bg: 'var(--color-info-subtle)', color: 'var(--color-info)' },
  }

  return (
    <span style={{
      display: 'inline-flex',
      alignItems: 'center',
      gap: 'var(--space-1)',
      padding: small ? '1px 6px' : '2px 8px',
      borderRadius: 'var(--radius-full)',
      fontSize: small ? 10 : 'var(--text-xs)',
      fontWeight: 500,
      background: colors[variant].bg,
      color: colors[variant].color,
    }}>
      {dot && <div style={{ width: 5, height: 5, borderRadius: 'var(--radius-full)', background: 'currentColor' }} />}
      {children}
    </span>
  )
}

function DemoAvatar({ initials, color, size = 32 }: { initials: string; color?: string; size?: number }) {
  return (
    <div style={{
      width: size, height: size,
      borderRadius: 'var(--radius-full)',
      background: color || 'var(--color-accent)',
      display: 'flex', alignItems: 'center', justifyContent: 'center',
      color: '#FFFFFF',
      fontSize: size < 32 ? 10 : 11,
      fontWeight: 600,
      letterSpacing: '-0.02em',
    }}>
      {initials}
    </div>
  )
}

function SkeletonCard() {
  return (
    <div style={{
      padding: 'var(--space-4)',
      background: 'var(--color-bg-raised)',
      border: '1px solid var(--color-border-default)',
      borderRadius: 'var(--radius-lg)',
    }}>
      <div style={{ display: 'flex', alignItems: 'center', gap: 'var(--space-2)', marginBottom: 'var(--space-3)' }}>
        <div style={{ width: 8, height: 8, borderRadius: 'var(--radius-full)', background: 'var(--color-bg-muted)', animation: 'pulse-dot 2s ease-in-out infinite' }} />
        <div style={{ width: 100, height: 14, borderRadius: 'var(--radius-sm)', background: 'var(--color-bg-muted)', animation: 'pulse-dot 2s ease-in-out infinite' }} />
      </div>
      <div style={{ width: '80%', height: 12, borderRadius: 'var(--radius-sm)', background: 'var(--color-bg-muted)', marginBottom: 'var(--space-2)', animation: 'pulse-dot 2s ease-in-out infinite' }} />
      <div style={{ width: '50%', height: 12, borderRadius: 'var(--radius-sm)', background: 'var(--color-bg-muted)', animation: 'pulse-dot 2s ease-in-out infinite' }} />
    </div>
  )
}
