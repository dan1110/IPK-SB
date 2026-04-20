export const dynamic = 'force-dynamic';
import { NextRequest, NextResponse } from 'next/server'
import { db } from '@/lib/db'
import { draftReply, buildContext } from '@/lib/ai'

export async function PATCH(req: NextRequest, { params }: { params: { id: string } }) {
  const body = await req.json()
  const { action, draft_reply, tags } = body

  if (action === 'replied') db.slack.update(params.id, { status: 'replied' })
  else if (action === 'flagged') {
    const updates: Record<string, string> = { status: 'flagged' }
    if (body.flagged_by) updates.flagged_by = body.flagged_by
    if (body.flagged_to) updates.flagged_to = body.flagged_to
    db.slack.update(params.id, updates as Parameters<typeof db.slack.update>[1])
  }
  else if (action === 'approved') db.slack.update(params.id, { status: 'replied' })
  else if (action === 'dismissed') db.slack.update(params.id, { status: 'dismissed' })
  else if (action === 'pending') db.slack.update(params.id, { status: 'pending' })
  else if (draft_reply !== undefined) db.slack.update(params.id, { draft_reply })
  else if (tags !== undefined) db.slack.update(params.id, { tags: JSON.stringify(tags) })

  return NextResponse.json(db.slack.get(params.id))
}

// Regenerate draft reply
export async function POST(req: NextRequest, { params }: { params: { id: string } }) {
  const msg = db.slack.get(params.id) as { project_id: string; message: string; from_name: string } | undefined
  if (!msg) return NextResponse.json({ error: 'Not found' }, { status: 404 })

  const pages = db.knowledge.byProject(msg.project_id) as { title: string; content: string }[]
  const meetings = db.meetings.byProject(msg.project_id) as { title: string; date: string; summary: string; action_items: string; key_decisions: string }[]
  const context = buildContext(pages, meetings)
  const tone = db.tone.get(msg.project_id) as { samples: string; style_notes: string; salutation: string } | undefined
  const toneProfile = tone ? { samples: JSON.parse(tone.samples), style_notes: tone.style_notes, salutation: tone.salutation } : null
  const draft = await draftReply(msg.message, msg.from_name, context, toneProfile)
  db.slack.update(params.id, { draft_reply: draft })
  return NextResponse.json(db.slack.get(params.id))
}
