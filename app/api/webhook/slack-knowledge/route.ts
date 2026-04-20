export const dynamic = 'force-dynamic';
import { NextRequest, NextResponse } from 'next/server'
import { db } from '@/lib/db'
import { v4 as uuid } from 'uuid'
import { processSlackKnowledge } from '@/lib/ai'

/*
  n8n sends a daily batch of Slack channel messages.
  AI processes them and auto-updates knowledge pages.

  Payload:
  {
    "secret": "...",
    "workspace": "neopets-team",   ← auto-maps to project (or use project_id directly)
    "channel": "#general",
    "messages": [
      { "from": "John", "text": "...", "ts": "2026-04-07T10:00:00Z" }
    ]
  }
*/

export async function POST(req: NextRequest) {
  const body = await req.json()

  const secret = process.env.ZAPIER_WEBHOOK_SECRET
  if (secret && body.secret !== secret) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  const { channel, messages } = body

  // Resolve project by workspace name or explicit project_id
  let project_id = body.project_id as string | undefined
  if (!project_id && body.workspace) {
    const allProjects = db.projects.all() as { id: string; slack_workspace: string | null }[]
    const matched = allProjects.find(p =>
      p.slack_workspace && p.slack_workspace.toLowerCase().trim() === (body.workspace as string).toLowerCase().trim()
    )
    if (matched) project_id = matched.id
  }

  if (!project_id || !messages?.length) {
    return NextResponse.json({ error: 'workspace (or project_id) and messages required' }, { status: 400 })
  }

  const project = db.projects.get(project_id)
  if (!project) return NextResponse.json({ error: 'Project not found' }, { status: 404 })

  // Build text block from messages
  const textBlock = messages
    .map((m: { from: string; text: string; ts: string }) => `[${m.ts}] ${m.from}: ${m.text}`)
    .join('\n')

  // Get existing knowledge pages
  const existingPages = db.knowledge.byProject(project_id) as { id: string; title: string; content: string }[]

  // AI processes and returns create/update instructions
  const result = await processSlackKnowledge(textBlock, channel || '#general', existingPages)

  let creates = 0
  let updates = 0

  // Apply updates
  for (const upd of result.updates || []) {
    db.knowledge.update(upd.id, { title: upd.title, content: upd.content, source: 'slack' })
    updates++
  }

  // Apply creates
  for (const cr of result.creates || []) {
    db.knowledge.create({ id: uuid(), project_id, title: cr.title, content: cr.content, source: 'slack' })
    creates++
  }

  console.log(`[slack-knowledge] ${channel}: ${creates} created, ${updates} updated for ${project_id}`)
  return NextResponse.json({ ok: true, creates, updates, summary: result.summary || '' })
}
