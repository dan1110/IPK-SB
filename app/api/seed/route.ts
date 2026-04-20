import { NextResponse } from 'next/server'
import { db } from '@/lib/db'
import { v4 as uuid } from 'uuid'

export async function POST() {
  const existing = db.projects.all() as { id: string }[]
  if (existing.length > 0) return NextResponse.json({ ok: true, message: 'Already seeded' })

  // ── Users ───────────────────────────────────────────────────────────────────
  const usersExist = (db.users.all() as unknown[]).length > 0
  if (!usersExist) {
    const demoUsers = [
      { id: 'user-boss',     name: 'Steven Cao',  email: 'steven@solidbytes.vn',  role: 'boss',     title: 'PM' },
      { id: 'user-lead',     name: 'Ngọc Dân',    email: 'dan@solidbytes.vn',     role: 'lead',     title: 'Fullstack' },
      { id: 'user-employee', name: 'Hữu Nghị',    email: 'nghi@solidbytes.vn',    role: 'employee', title: 'BE' },
    ]
    demoUsers.forEach(u => db.users.create(u))
  }

  // ── Projects ────────────────────────────────────────────────────────────────
  const projects = [
    { id: uuid(), name: 'project-neopets',    color: '#f5a623', slack_workspace: 'neopets.slack.com' },
    { id: uuid(), name: 'project-intentwave', color: '#4f8ef7', slack_workspace: 'intentwave.slack.com' },
    { id: uuid(), name: 'project-yotta',      color: '#3ecf8e', slack_workspace: undefined },
    { id: uuid(), name: 'project-theory',     color: '#a78bfa', slack_workspace: undefined },
  ]
  projects.forEach(p => db.projects.create(p))
  const neopets = projects[0], intentwave = projects[1], yotta = projects[2]

  // ── Assignments ─────────────────────────────────────────────────────────────
  // Lead assigned to neopets + intentwave, Employee assigned to neopets + yotta
  db.assignments.assign({ id: uuid(), user_id: 'user-lead',     project_id: neopets.id,     role_in_project: 'lead' })
  db.assignments.assign({ id: uuid(), user_id: 'user-lead',     project_id: intentwave.id,  role_in_project: 'lead' })
  db.assignments.assign({ id: uuid(), user_id: 'user-employee', project_id: neopets.id,     role_in_project: 'member' })
  db.assignments.assign({ id: uuid(), user_id: 'user-employee', project_id: yotta.id,       role_in_project: 'member' })

  // ── Knowledge Pages — Neopets ───────────────────────────────────────────────
  db.knowledge.create({ id: uuid(), project_id: neopets.id, title: 'Tech Stack & Architecture', source: 'meeting', content: `## Frontend
React 18 + TypeScript, Tailwind CSS. Deployed on Vercel.

## Backend
Node.js + Express, PostgreSQL (Supabase). Auth via Clerk.

## Payment
Stripe integration — currently in staging. Deadline confirmed Jan 17.

## Key Decision (Jan 10 meeting)
Dropped Braintree, switched to Stripe due to better docs and faster integration timeline.` })

  db.knowledge.create({ id: uuid(), project_id: neopets.id, title: 'Client Requirements & Contacts', source: 'upload', content: `## Client
Neopets Inc.
- John Kim — Product Manager
- Sara Park — Tech Lead
- Mike Chen — Designer

## Core Requirements
User auth, pet management, marketplace with payment, mobile-responsive.

## Timeline
- Payment gateway: Jan 17 (non-negotiable)
- User profiles: Jan 24
- Marketplace: Feb 7` })

  db.knowledge.create({ id: uuid(), project_id: neopets.id, title: 'Decisions Log', source: 'meeting', content: `## Jan 10
Switch Braintree → Stripe. Approved by John Kim.

## Jan 8
Mobile-first approach confirmed. Responsive breakpoint at 768px.

## Jan 3
Sprint cadence = 2 weeks. Demo every other Friday.

## Dec 28
Supabase selected over self-hosted Postgres for faster setup.` })

  // ── Knowledge Pages — Intentwave ────────────────────────────────────────────
  db.knowledge.create({ id: uuid(), project_id: intentwave.id, title: 'Project Overview', source: 'manual', content: `## About
Intentwave is an AI-powered intent detection platform for e-commerce.

## Stack
Next.js 14, Python FastAPI, OpenAI embeddings, Pinecone vector DB.

## Status
Phase 2 development — 60% complete.` })

  // ── Meetings — Neopets ──────────────────────────────────────────────────────
  db.meetings.create({ id: uuid(), project_id: neopets.id, title: 'Sprint Planning — Jan 13', date: '2025-01-13', duration_minutes: 72, transcript: 'Full transcript available...', translation: '', summary: 'Reviewed sprint 3 progress. Payment gateway on track for Jan 17. Agreed to move PR review flow to Friday demos. John raised concern about 502 errors on staging — assigned to Quoc for immediate fix. Next sprint focus: user profiles + marketplace scaffold.', action_items: JSON.stringify(['Quoc: fix staging 502 by EOD Jan 14', 'Steven: send updated API docs by Jan 15', 'Sara: finalize user profile spec by Jan 16']), key_decisions: JSON.stringify(['Payment deadline confirmed: Jan 17 (non-negotiable)', 'Stripe chosen over Braintree']), uploaded_by: 'steven' })

  db.meetings.create({ id: uuid(), project_id: neopets.id, title: 'Kick-off Meeting — Jan 3', date: '2025-01-03', duration_minutes: 45, transcript: '', translation: '', summary: 'Initial project scope review with Neopets team. Confirmed tech stack, timeline, and team assignments. 2-week sprint cadence established.', action_items: JSON.stringify(['Steven: setup Vercel project', 'Sara: provision Supabase DB', 'John: share full requirements doc']), key_decisions: JSON.stringify(['Tech stack confirmed', '2-week sprints', 'Friday demos']), uploaded_by: 'steven' })

  // ── Slack Messages — Neopets ────────────────────────────────────────────────
  db.slack.create({ id: uuid(), project_id: neopets.id, from_name: 'John Kim', from_initials: 'JK', channel: '#neopets-general', workspace: 'neopets.slack.com', message: '@steven can you confirm the payment gateway integration deadline? Client is asking us today. Also the staging URL from last week is returning 502.', tags: JSON.stringify(['@mention', 'urgent', 'deadline']), draft_reply: `Hi John,\n\nThe payment gateway is confirmed for this Friday Jan 17 — that's locked in from our sprint planning.\n\nFor the 502 on staging, Quoc is on it now, should be resolved within the hour. Likely a config issue from the recent deploy.\n\nLet me know if you need anything else.` })

  db.slack.create({ id: uuid(), project_id: neopets.id, from_name: 'Sara Park', from_initials: 'SP', channel: '#neopets-dev', workspace: 'neopets.slack.com', message: '@steven we pushed the new auth flow to staging. Can you review when free? Also please approve the PR for the user profile module.', tags: JSON.stringify(['@mention', 'review']), draft_reply: `Hi Sara,\n\nWill take a look at the auth flow on staging this afternoon and leave comments.\n\nFor the user profile PR — I'll review and approve by EOD. Looks solid from the standup update.\n\nThanks for the heads up.` })

  db.slack.create({ id: uuid(), project_id: neopets.id, from_name: 'Mike Chen', from_initials: 'MC', channel: '#neopets-general', workspace: 'neopets.slack.com', message: '@steven thanks for the updated API docs. The team found it very helpful. Good to proceed with next sprint.', tags: JSON.stringify(['@mention']), draft_reply: `Great to hear Mike! Glad it helped. See you at Friday\'s demo.` })
  const msgs3 = db.slack.byProject(neopets.id) as {id:string}[]; if(msgs3[2]) db.slack.update(msgs3[2].id, { status: 'replied' })

  // ── Slack Messages — Yotta ──────────────────────────────────────────────────
  db.slack.create({ id: uuid(), project_id: yotta.id, from_name: 'Alex Wong', from_initials: 'AW', channel: '#yotta-dev', workspace: 'yotta-team.slack.com', message: '@steven when is the next deployment window? We need to push a hotfix for the auth bug.', tags: JSON.stringify(['@mention', 'urgent']), draft_reply: `Hi Alex,\n\nNext deployment window is Thursday 6pm UTC. For a hotfix this critical we can also do an off-schedule deploy — just confirm the fix is tested and I'll greenlight it.\n\nLet me know.` })

  // ── Jira Tickets — Neopets ─────────────────────────────────────────────────
  const jiraTickets = [
    { jira_key: 'NEO-101', title: 'Stripe payment gateway integration', status: 'In Progress', assignee: 'Quoc Nguyen', priority: 'Highest', description: 'Integrate Stripe for checkout flow. Must support credit card, Apple Pay, and Google Pay. Staging testing required before go-live.', risk_level: 'high', risk_reason: 'Due date is Jan 17 (non-negotiable client deadline), currently still in progress', due_date: '2025-01-17', labels: ['payment', 'sprint-3'] },
    { jira_key: 'NEO-102', title: 'Fix 502 errors on staging environment', status: 'In Progress', assignee: 'Quoc Nguyen', priority: 'Critical', description: 'Staging URL returning 502 after recent deploy. Likely config issue with Vercel environment variables.', risk_level: 'critical', risk_reason: 'Blocking QA testing and client demos, critical priority', due_date: '2025-01-14', labels: ['bug', 'urgent'] },
    { jira_key: 'NEO-103', title: 'User profile module — frontend', status: 'In Review', assignee: 'Sara Park', priority: 'High', description: 'Build user profile page: avatar upload, bio, settings, notification preferences. Mobile-first responsive layout.', risk_level: 'none', risk_reason: '', due_date: '2025-01-24', labels: ['frontend', 'sprint-3'] },
    { jira_key: 'NEO-104', title: 'User profile module — API endpoints', status: 'Done', assignee: 'Steven Cao', priority: 'High', description: 'REST API endpoints for user profile CRUD. GET/PUT /api/users/:id/profile. Supabase integration.', risk_level: 'none', risk_reason: '', due_date: '2025-01-20', labels: ['backend', 'sprint-3'] },
    { jira_key: 'NEO-105', title: 'Marketplace scaffold — database schema', status: 'To Do', assignee: '', priority: 'Medium', description: 'Design and implement PostgreSQL schema for marketplace: products, listings, categories, pricing, inventory.', risk_level: 'medium', risk_reason: 'No assignee yet, due Feb 7 — needs to be picked up soon', due_date: '2025-02-07', labels: ['backend', 'marketplace'] },
    { jira_key: 'NEO-106', title: 'Marketplace scaffold — UI components', status: 'To Do', assignee: 'Mike Chen', priority: 'Medium', description: 'Build marketplace UI: product grid, search/filter, product detail page. Figma designs ready.', risk_level: 'none', risk_reason: '', due_date: '2025-02-07', labels: ['frontend', 'marketplace'] },
    { jira_key: 'NEO-107', title: 'Setup CI/CD pipeline', status: 'Done', assignee: 'Steven Cao', priority: 'Medium', description: 'GitHub Actions for lint, test, build, and deploy to Vercel. Auto-deploy on main branch push.', risk_level: 'none', risk_reason: '', due_date: '2025-01-10', labels: ['devops'] },
    { jira_key: 'NEO-108', title: 'Auth flow — Clerk integration', status: 'Done', assignee: 'Sara Park', priority: 'High', description: 'Integrate Clerk for authentication: sign-up, sign-in, password reset, OAuth (Google, GitHub).', risk_level: 'none', risk_reason: '', due_date: '2025-01-10', labels: ['auth', 'sprint-2'] },
    { jira_key: 'NEO-109', title: 'API documentation — Swagger/OpenAPI', status: 'In Progress', assignee: 'Steven Cao', priority: 'Low', description: 'Generate OpenAPI spec and Swagger UI for all REST endpoints. Auto-generate from route handlers.', risk_level: 'none', risk_reason: '', due_date: '2025-01-31', labels: ['docs'] },
    { jira_key: 'NEO-110', title: 'Mobile responsive — breakpoint audit', status: 'To Do', assignee: 'Mike Chen', priority: 'High', description: 'Audit all pages for 768px breakpoint. Fix layout issues on tablet and mobile. Priority pages: auth, dashboard, marketplace.', risk_level: 'low', risk_reason: 'High priority but not started yet, due Jan 28', due_date: '2025-01-28', labels: ['frontend', 'mobile'] },
  ]

  for (const t of jiraTickets) {
    db.jira.upsert({ id: uuid(), project_id: neopets.id, jira_key: t.jira_key, title: t.title, status: t.status, assignee: t.assignee, priority: t.priority, description: t.description, due_date: t.due_date, labels: JSON.stringify(t.labels) })
    if (t.risk_level !== 'none') {
      const ticket = db.jira.getByKey(neopets.id, t.jira_key) as { id: string } | undefined
      if (ticket) db.jira.updateRisk(ticket.id, t.risk_level, t.risk_reason)
    }
  }

  // ── GitHub Repos — Neopets ─────────────────────────────────────────────────
  const repoId = uuid()
  db.github.repos.create({ id: repoId, project_id: neopets.id, repo_url: 'https://github.com/solidbytes/neopets-app', default_branch: 'main' })
  db.github.repos.updateSynced(repoId)

  const sampleFiles = [
    { path: 'src/app/layout.tsx', content: `import { ClerkProvider } from '@clerk/nextjs'\nimport './globals.css'\n\nexport default function RootLayout({ children }: { children: React.ReactNode }) {\n  return (\n    <ClerkProvider>\n      <html lang="en">\n        <body>{children}</body>\n      </html>\n    </ClerkProvider>\n  )\n}` },
    { path: 'src/app/api/users/[id]/profile/route.ts', content: `import { NextRequest, NextResponse } from 'next/server'\nimport { supabase } from '@/lib/supabase'\n\nexport async function GET(req: NextRequest, { params }: { params: { id: string } }) {\n  const { data, error } = await supabase.from('profiles').select('*').eq('user_id', params.id).single()\n  if (error) return NextResponse.json({ error: error.message }, { status: 404 })\n  return NextResponse.json(data)\n}\n\nexport async function PUT(req: NextRequest, { params }: { params: { id: string } }) {\n  const body = await req.json()\n  const { data, error } = await supabase.from('profiles').update(body).eq('user_id', params.id)\n  if (error) return NextResponse.json({ error: error.message }, { status: 400 })\n  return NextResponse.json(data)\n}` },
    { path: 'src/lib/stripe.ts', content: `import Stripe from 'stripe'\n\nexport const stripe = new Stripe(process.env.STRIPE_SECRET_KEY!, {\n  apiVersion: '2023-10-16',\n})\n\nexport async function createCheckoutSession(priceId: string, userId: string) {\n  return stripe.checkout.sessions.create({\n    mode: 'payment',\n    payment_method_types: ['card'],\n    line_items: [{ price: priceId, quantity: 1 }],\n    metadata: { userId },\n    success_url: process.env.NEXT_PUBLIC_URL + '/checkout/success',\n    cancel_url: process.env.NEXT_PUBLIC_URL + '/checkout/cancel',\n  })\n}` },
    { path: 'src/lib/supabase.ts', content: `import { createClient } from '@supabase/supabase-js'\n\nexport const supabase = createClient(\n  process.env.NEXT_PUBLIC_SUPABASE_URL!,\n  process.env.SUPABASE_SERVICE_KEY!\n)` },
    { path: 'package.json', content: `{\n  "name": "neopets-app",\n  "version": "0.1.0",\n  "dependencies": {\n    "@clerk/nextjs": "^4.29",\n    "@supabase/supabase-js": "^2.39",\n    "next": "14.1.0",\n    "react": "^18.2",\n    "stripe": "^14.12",\n    "tailwindcss": "^3.4"\n  }\n}` },
  ]

  for (const f of sampleFiles) {
    db.github.files.upsert({ id: uuid(), repo_id: repoId, file_path: f.path, content: f.content })
  }

  return NextResponse.json({ ok: true, message: 'Seeded successfully', projects: projects.map(p => p.name) })
}
