import { NextRequest, NextResponse } from 'next/server'
import { db } from '@/lib/db'
import { v4 as uuid } from 'uuid'
import { draftReply, buildContext, autoTagMessage } from '@/lib/ai'

export async function GET(req: NextRequest) {
  const projectId = req.nextUrl.searchParams.get('project_id')
  const status = req.nextUrl.searchParams.get('status') || 'all'
  if (!projectId) return NextResponse.json({ error: 'project_id required' }, { status: 400 })
  return NextResponse.json(db.slack.byProject(projectId, status))
}

export async function POST(req: NextRequest) {
  const body = await req.json()
  const { project_id, from_name, from_initials, channel, workspace, message } = body

  const tags = await autoTagMessage(message)

  // Auto-draft reply if AI available
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
  db.slack.create({ id, project_id, from_name, from_initials: from_initials || from_name.slice(0, 2).toUpperCase(), channel, workspace, message, tags: JSON.stringify(tags), draft_reply: draft })
  return NextResponse.json(db.slack.get(id), { status: 201 })
}
