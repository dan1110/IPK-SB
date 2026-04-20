import { NextRequest, NextResponse } from 'next/server'
import { db } from '@/lib/db'
import { v4 as uuid } from 'uuid'
import { draftReply, buildContext, autoTagMessage } from '@/lib/ai'

/*
  ╔══════════════════════════════════════════════════════════════════╗
  ║  SAFE SLACK INTEGRATION — via Email Notifications + n8n        ║
  ╠══════════════════════════════════════════════════════════════════╣
  ║                                                                ║
  ║  Flow (zero footprint in client Slack workspaces):             ║
  ║                                                                ║
  ║  1. Steven has email notifications ON for @mentions            ║
  ║     (Slack default — nothing to install)                       ║
  ║                                                                ║
  ║  2. Slack sends notification emails to Steven's Gmail          ║
  ║     from: notifications@slack.com                              ║
  ║     subject: "[workspace] sender in #channel: message..."      ║
  ║                                                                ║
  ║  3. n8n monitors Gmail (1 shared flow for all workspaces):     ║
  ║     - Trigger: Gmail → new email from notifications@slack.com  ║
  ║     - Parse subject: extract workspace, channel, sender        ║
  ║     - Parse body: extract full message text                    ║
  ║     - POST to this endpoint                                   ║
  ║                                                                ║
  ║  4. IPK auto-maps workspace name → project                    ║
  ║     (via slack_workspace field on projects table)              ║
  ║                                                                ║
  ║  WHY THIS IS SAFE:                                             ║
  ║  - No Slack App/Bot installed in client workspace              ║
  ║  - No Slack API calls — zero audit trail                       ║
  ║  - Email notifications are normal user behavior                ║
  ║  - Client admins cannot detect this                            ║
  ║                                                                ║
  ╚══════════════════════════════════════════════════════════════════╝

  Expected payload from n8n:
  {
    "workspace": "neopets-team",     ← parsed from email subject
    "from_name": "John Kim",         ← parsed from email
    "channel": "#general",           ← parsed from email subject
    "message": "full message text",  ← parsed from email body
    "secret": "your-webhook-secret"
  }
*/

function resolveProjectId(body: Record<string, unknown>): string | null {
  // 1. Explicit project_id (override)
  if (body.project_id) return body.project_id as string

  // 2. Auto-map by workspace name
  const workspace = body.workspace as string | undefined
  if (!workspace) return null

  const allProjects = db.projects.all() as { id: string; slack_workspace: string | null }[]
  const wsLower = workspace.toLowerCase().trim()
  const matched = allProjects.find(p =>
    p.slack_workspace && p.slack_workspace.toLowerCase().trim() === wsLower
  )
  return matched?.id || null
}

export async function POST(req: NextRequest) {
  const body = await req.json()

  // Auth check
  const secret = process.env.ZAPIER_WEBHOOK_SECRET
  if (secret && body.secret !== secret) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  const { from_name, channel, workspace, message } = body
  if (!message) {
    return NextResponse.json({ error: 'message required' }, { status: 400 })
  }

  const project_id = resolveProjectId(body)
  if (!project_id) {
    return NextResponse.json({
      error: `No project matched workspace "${workspace || '(empty)'}". Create a project with this slack_workspace name first.`,
      hint: 'POST /api/projects { name, slack_workspace, tool }'
    }, { status: 400 })
  }

  const project = db.projects.get(project_id)
  if (!project) return NextResponse.json({ error: 'Project not found' }, { status: 404 })

  const tags = await autoTagMessage(message)
  const from_initials = (from_name || 'UN').split(' ').map((w: string) => w[0]).join('').toUpperCase().slice(0, 2)

  // Auto-draft reply using project knowledge
  let draft = ''
  if (process.env.GEMINI_API_KEY) {
    const pages = db.knowledge.byProject(project_id) as { title: string; content: string }[]
    const meetings = db.meetings.byProject(project_id) as { title: string; date: string; summary: string; action_items: string; key_decisions: string }[]
    const context = buildContext(pages, meetings)
    const tone = db.tone.get(project_id) as { samples: string; style_notes: string; salutation: string } | undefined
    const toneProfile = tone ? { samples: JSON.parse(tone.samples), style_notes: tone.style_notes, salutation: tone.salutation } : null
    draft = await draftReply(message, from_name, context, toneProfile)
  }

  const id = uuid()
  db.slack.create({ id, project_id, from_name: from_name || 'Unknown', from_initials, channel: channel || '#general', workspace: workspace || 'unknown', message, tags: JSON.stringify(tags), draft_reply: draft })

  console.log(`[n8n→slack] ${workspace}/${channel} from ${from_name} → project ${project_id}`)
  return NextResponse.json({ ok: true, id, project_id })
}
