# Project Knowledge Workspace — Design System

> Generated for: **ProjectKnowledgeWorkspace**
> Style lineage: Linear / Raycast / Vercel Dashboard
> Mode: Dark-primary, light-secondary

---

## 1. Design Pattern

**Pattern:** Dense Sidebar Navigation + Content-Detail Split

- **Collapsible sidebar** (240px expanded / 64px collapsed) with project switcher, nav items, user footer
- **Main content area** with contextual top bar (breadcrumb + actions)
- **Split panes** where needed (Knowledge: list + detail, Meeting Notes: transcript + summary)
- **Command palette** feel — keyboard-first, fast navigation
- **Modals** for creation flows, **inline editing** for updates, **toast + undo** for deletes

**Layout grid:** 12-column CSS Grid at 1440px, collapsing to 8-col at 1024px, single-col at 768px

---

## 2. Color Palette

### Neutral Scale (Background & Text)

All neutrals are cool-toned (slight blue undertone) to avoid the "warm gray" look of generic dashboards.

| Token | Light | Dark | Usage |
|-------|-------|------|-------|
| `--color-bg-base` | `#FAFAFA` | `#0A0A0B` | Page background |
| `--color-bg-raised` | `#FFFFFF` | `#111113` | Cards, panels |
| `--color-bg-overlay` | `#FFFFFF` | `#18181B` | Modals, dropdowns |
| `--color-bg-subtle` | `#F4F4F5` | `#1C1C1F` | Hover states, secondary areas |
| `--color-bg-muted` | `#E4E4E7` | `#27272A` | Input backgrounds, dividers |
| `--color-bg-invert` | `#09090B` | `#FAFAFA` | Inverted buttons |
| `--color-text-primary` | `#09090B` | `#FAFAFA` | Headings, body text |
| `--color-text-secondary` | `#52525B` | `#A1A1AA` | Labels, descriptions |
| `--color-text-tertiary` | `#A1A1AA` | `#52525B` | Placeholders, hints |
| `--color-text-invert` | `#FAFAFA` | `#09090B` | Text on inverted bg |
| `--color-border-default` | `#E4E4E7` | `#27272A` | Card borders, dividers |
| `--color-border-subtle` | `#F4F4F5` | `#1C1C1F` | Soft separators |
| `--color-border-strong` | `#D4D4D8` | `#3F3F46` | Input borders, focus rings |

### Accent (Brand)

A sharp, neutral blue — confident without being playful. Avoids the "AI purple" trap.

| Token | Value | Usage |
|-------|-------|-------|
| `--color-accent` | `#2563EB` | Primary buttons, active nav, links |
| `--color-accent-hover` | `#1D4ED8` | Hover state |
| `--color-accent-subtle` | `#DBEAFE` (light) / `#1E3A5F` (dark) | Badge backgrounds, selection |
| `--color-accent-text` | `#FFFFFF` | Text on accent bg |

### Semantic

| Token | Light | Dark | Usage |
|-------|-------|------|-------|
| `--color-success` | `#16A34A` | `#22C55E` | Completed, active, connected |
| `--color-success-subtle` | `#DCFCE7` | `#14532D` | Success badge bg |
| `--color-warning` | `#D97706` | `#F59E0B` | Flagged, at-risk |
| `--color-warning-subtle` | `#FEF3C7` | `#451A03` | Warning badge bg |
| `--color-danger` | `#DC2626` | `#EF4444` | Errors, destructive, urgent |
| `--color-danger-subtle` | `#FEE2E2` | `#450A0A` | Danger badge bg |
| `--color-info` | `#0EA5E9` | `#38BDF8` | Informational badges |
| `--color-info-subtle` | `#E0F2FE` | `#0C4A6E` | Info badge bg |

---

## 3. Typography

### Font Pairing

| Role | Family | Weight | Why |
|------|--------|--------|-----|
| **Headings** | `Inter` | 600 (Semibold) | Geometric, tight, professional — the Linear/Vercel standard |
| **Body** | `Inter` | 400 (Regular) | Same family, seamless hierarchy |
| **Mono** | `JetBrains Mono` | 400 | For code, IDs, timestamps, technical data |

> **Why Inter over Plus Jakarta Sans (current)?** Inter has tighter letter-spacing, better at small sizes in data-dense UIs, and is the de-facto standard for the aesthetic targets (Linear, Vercel, Raycast). Plus Jakarta Sans is slightly rounder and friendlier — better for marketing.

### Type Scale

| Token | Size | Line Height | Weight | Usage |
|-------|------|-------------|--------|-------|
| `--text-xs` | 11px | 16px | 400 | Badges, timestamps, meta |
| `--text-sm` | 13px | 20px | 400 | Secondary labels, descriptions |
| `--text-base` | 14px | 22px | 400 | Body text, inputs |
| `--text-md` | 15px | 24px | 500 | Emphasized body, nav items |
| `--text-lg` | 18px | 28px | 600 | Section headings |
| `--text-xl` | 22px | 30px | 600 | Page titles |
| `--text-2xl` | 28px | 36px | 600 | Dashboard hero numbers |
| `--text-mono` | 12px | 18px | 400 | Code, IDs, technical |

### Letter Spacing

| Context | Value |
|---------|-------|
| Headings (lg+) | `-0.02em` |
| Body (base, md) | `-0.01em` |
| Uppercase labels | `0.05em` |
| Mono | `0em` |

---

## 4. Spacing & Layout

### Spacing Scale

Based on a 4px grid. Tokens map to Tailwind spacing utilities.

| Token | Value | Usage |
|-------|-------|-------|
| `--space-0` | 0px | |
| `--space-1` | 4px | Tight gaps (icon + text) |
| `--space-2` | 8px | Inline padding, small gaps |
| `--space-3` | 12px | Card inner padding (compact) |
| `--space-4` | 16px | Default padding, list gaps |
| `--space-5` | 20px | Section spacing |
| `--space-6` | 24px | Card padding (default) |
| `--space-8` | 32px | Section breaks |
| `--space-10` | 40px | Page padding |
| `--space-12` | 48px | Large section gaps |
| `--space-16` | 64px | Page-level vertical rhythm |

### Border Radius

| Token | Value | Usage |
|-------|-------|-------|
| `--radius-sm` | 4px | Badges, tags |
| `--radius-md` | 6px | Inputs, small buttons |
| `--radius-lg` | 8px | Cards, panels, modals |
| `--radius-xl` | 12px | Large cards, dialogs |
| `--radius-full` | 9999px | Avatars, pills |

> **Note:** Current design uses 14-20px radii — this is too rounded for the Linear/Raycast aesthetic. Tighter radii (6-12px) read as more professional and dense.

### Shadows

| Token | Light | Dark |
|-------|-------|------|
| `--shadow-xs` | `0 1px 2px rgba(0,0,0,0.05)` | `0 1px 2px rgba(0,0,0,0.3)` |
| `--shadow-sm` | `0 1px 3px rgba(0,0,0,0.08), 0 1px 2px rgba(0,0,0,0.04)` | `0 1px 3px rgba(0,0,0,0.4)` |
| `--shadow-md` | `0 4px 12px rgba(0,0,0,0.08)` | `0 4px 12px rgba(0,0,0,0.5)` |
| `--shadow-lg` | `0 12px 40px rgba(0,0,0,0.1)` | `0 12px 40px rgba(0,0,0,0.6)` |
| `--shadow-focus` | `0 0 0 2px var(--color-accent)` | same | Focus ring |

> **Guideline:** Shadows only for elevation hierarchy (modals > dropdowns > cards > page). No decorative shadows. In dark mode, shadows are replaced by border emphasis.

---

## 5. Key Effects & Interactions

### Transitions

| Property | Duration | Easing |
|----------|----------|--------|
| Color, background, border | `150ms` | `ease` |
| Transform (hover lift) | `200ms` | `cubic-bezier(0.4, 0, 0.2, 1)` |
| Opacity (fade in/out) | `200ms` | `ease` |
| Layout (expand/collapse) | `250ms` | `cubic-bezier(0.4, 0, 0.2, 1)` |
| Modal entrance | `200ms` | `cubic-bezier(0.16, 1, 0.3, 1)` |

### Hover States

- **Cards:** `border-color` shifts to `--color-border-strong`, subtle `translateY(-1px)` — NO shadow change
- **Buttons:** Background darkens one step, no transform
- **List items:** Background changes to `--color-bg-subtle`
- **Links:** Underline appears (no color change)

### Focus States

- All interactive elements: `2px solid var(--color-accent)` ring with `2px offset`
- Keyboard-only (`:focus-visible`), not on click

### Loading States

- **Skeleton:** Pulsing `--color-bg-muted` blocks matching content shape
- **Spinners:** 16px `border-2` spinner, `--color-accent`
- **Progress bars:** Thin (3px), smooth indeterminate or stepped

### Motion (Framer Motion — sparingly)

| Animation | When | Duration |
|-----------|------|----------|
| `fadeIn` | Page/panel enters | 200ms |
| `slideUp` | Toast appears | 250ms |
| `scaleIn` | Modal opens | 200ms, from 0.95 |
| `collapse` | Accordion/sidebar | 250ms |
| `stagger` | List items on first load | 30ms delay per item, max 8 |

> **Rule:** If the user will see the animation more than 10 times per session, make it < 150ms or remove it entirely.

---

## 6. Component Inventory (Primitives)

These will be built as shadcn/ui-based components in `components/ui/`:

| Component | Variants | States |
|-----------|----------|--------|
| **Button** | primary, secondary, ghost, danger, icon-only | hover, focus, active, disabled, loading |
| **Input** | text, search, textarea | focus, error, disabled |
| **Select** | single, multi | open, closed, disabled |
| **Card** | default, interactive (clickable), compact | hover, selected, loading (skeleton) |
| **Badge** | neutral, accent, success, warning, danger, info | — |
| **Dialog** | default, confirm (destructive), form | — |
| **Tabs** | underline, pill | active, hover |
| **Sidebar** | expanded, collapsed | — |
| **Toast** | success, error, info, undo | auto-dismiss (5s) |
| **Avatar** | image, initials, status dot | — |
| **Tooltip** | — | — |
| **Dropdown Menu** | with icons, with shortcuts | — |
| **Command** | search + results list | — |
| **Separator** | horizontal, vertical | — |
| **Skeleton** | text, circle, card | — |
| **ScrollArea** | vertical, horizontal | — |
| **Progress** | bar, stepped | — |

---

## 7. Anti-Patterns List

These are explicitly banned from this design system:

| # | Anti-Pattern | Why |
|---|-------------|-----|
| 1 | Purple/pink AI gradients | "ChatGPT wrapper" aesthetic |
| 2 | Emoji as functional icons | Inconsistent sizing, no hover states, unprofessional |
| 3 | Border-radius > 12px on cards | Over-rounded = playful, not professional |
| 4 | Decorative box-shadows | Shadows must indicate elevation, not decoration |
| 5 | Hardcoded hex colors in components | Breaks theming, impossible to maintain |
| 6 | Hardcoded px spacing in components | Must use spacing tokens |
| 7 | Inline React styles | Use Tailwind utility classes + CSS variables |
| 8 | Glass/frosted effects as default | Reserve for overlays only, not cards |
| 9 | Animation duration > 300ms | Feels sluggish in a power-user tool |
| 10 | Color as only differentiator | Must also use shape/icon/text for accessibility |
| 11 | `onMouseEnter/Leave` for hover states | Use CSS `:hover` via Tailwind |
| 12 | Nested scroll areas without clear boundaries | Confusing scroll behavior |
| 13 | Full-width layouts at 1440px+ | Content should max out at ~1200px or use sidebar + content pattern |
| 14 | More than 3 font weights on screen | Visual noise; stick to 400, 500, 600 |

---

## 8. Iconography

- **Library:** Lucide React (already installed)
- **Default size:** 16px (inline), 20px (nav), 24px (hero/empty states)
- **Stroke width:** 1.75 (default Lucide) — slightly lighter than 2 for density
- **Color:** Inherits `currentColor` — never hardcode icon colors
- **Paired with text:** 4px gap (`gap-1`)

---

## 9. Dark Mode Strategy

- **Primary mode.** Every token has a dark variant.
- **Implementation:** CSS variables scoped under `[data-theme="dark"]` on `<html>`.
- **Toggle:** Stored in `localStorage`, applied before first paint (script in `<head>`) to prevent flash.
- **Contrast:** All text/bg combos meet WCAG AA (4.5:1 for body text, 3:1 for large text).

---

## 10. File Structure

```
components/
  ui/          ← shadcn/ui primitives (Button, Card, Input, Dialog, etc.)
  app/         ← feature components (ProjectCard, MeetingNoteViewer, ChatMessage, etc.)
  layouts/     ← AppShell, Sidebar, TopBar, SplitPane

design-system/
  MASTER.md    ← this file
  tokens.css   ← CSS custom properties (generated from this spec)
```

---

## Summary at a Glance

| Dimension | Choice |
|-----------|--------|
| **Pattern** | Sidebar + Content-Detail Split |
| **Primary Accent** | `#2563EB` (clean blue) |
| **Neutrals** | Zinc scale (cool gray, blue undertone) |
| **Font** | Inter (headings + body) + JetBrains Mono (code) |
| **Radius** | 4–12px (restrained) |
| **Shadows** | Functional elevation only |
| **Motion** | Framer Motion, < 250ms, entrance only |
| **Icons** | Lucide React, 16–24px |
| **Mode** | Dark-primary, light supported |
| **Anti-patterns** | No gradients, no emoji icons, no inline styles, no hardcoded values |
