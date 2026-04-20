import { NextRequest, NextResponse } from 'next/server'
import { db } from '@/lib/db'
import { v4 as uuid } from 'uuid'
import { processMeetingNotes, buildContext } from '@/lib/ai'

export async function GET(req: NextRequest) {
  const projectId = req.nextUrl.searchParams.get('project_id')
  if (!projectId) return NextResponse.json({ error: 'project_id required' }, { status: 400 })
  return NextResponse.json(db.meetings.byProject(projectId))
}

export async function POST(req: NextRequest) {
  const body = await req.json()
  const { project_id, raw_text, title: manualTitle, date, uploaded_by = 'steven' } = body

  // If raw_text provided → process with AI
  if (raw_text && process.env.GEMINI_API_KEY) {
    const pages = db.knowledge.byProject(project_id) as { title: string; content: string }[]
    const meetings = db.meetings.byProject(project_id) as { title: string; date: string; summary: string; action_items: string; key_decisions: string }[]
    const context = buildContext(pages, meetings)

    const processed = await processMeetingNotes(raw_text, context)
    const id = uuid()

    db.meetings.create({
      id,
      project_id,
      title: manualTitle || processed.title || 'Meeting',
      date: date || new Date().toISOString().split('T')[0],
      transcript: raw_text,
      translation: processed.translation || '',
      summary: processed.summary || '',
      action_items: JSON.stringify(processed.action_items || []),
      key_decisions: JSON.stringify(processed.key_decisions || []),
      uploaded_by,
    })

    // Auto-update knowledge pages based on meeting
    for (const update of processed.knowledge_updates || []) {
      const existing = (db.knowledge.byProject(project_id) as { id: string; title: string; content: string }[])
        .find(p => p.title.toLowerCase().includes(update.topic.toLowerCase()))
      if (existing) {
        db.knowledge.update(existing.id, {
          content: existing.content + `\n\n**From meeting ${date || 'today'}:** ${update.content}`,
          source: 'meeting'
        })
      } else {
        db.knowledge.create({ id: uuid(), project_id, title: update.topic, content: update.content, source: 'meeting' })
      }
    }

    return NextResponse.json(db.meetings.get(id), { status: 201 })
  }

  // Manual create
  const id = uuid()
  db.meetings.create({
    id, project_id,
    title: manualTitle || 'Meeting',
    date: date || new Date().toISOString().split('T')[0],
    transcript: body.transcript || '',
    translation: body.translation || '',
    summary: body.summary || '',
    action_items: JSON.stringify(body.action_items || []),
    key_decisions: JSON.stringify(body.key_decisions || []),
    uploaded_by,
  })
  return NextResponse.json(db.meetings.get(id), { status: 201 })
}
