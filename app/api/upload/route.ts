export const dynamic = 'force-dynamic';
import { NextRequest, NextResponse } from 'next/server'
import { db } from '@/lib/db'
import { v4 as uuid } from 'uuid'
import { processUploadedText } from '@/lib/ai'

export async function POST(req: NextRequest) {
  const body = await req.json()
  const { project_id, content } = body
  if (!project_id || !content) return NextResponse.json({ error: 'project_id and content required' }, { status: 400 })

  const existingPages = db.knowledge.byProject(project_id) as { id: string; title: string; content: string }[]

  if (!process.env.GEMINI_API_KEY) {
    // No AI — just create a raw page
    const id = uuid()
    db.knowledge.create({ id, project_id, title: 'Imported content', content, source: 'upload' })
    return NextResponse.json({ summary: 'Content saved (no AI processing)', creates: 1, updates: 0 })
  }

  const result = await processUploadedText(content, existingPages)

  // Apply updates
  for (const u of result.updates || []) {
    db.knowledge.update(u.id, { title: u.title, content: u.content, source: 'upload' })
  }

  // Apply creates
  for (const c of result.creates || []) {
    db.knowledge.create({ id: uuid(), project_id, title: c.title, content: c.content, source: 'upload' })
  }

  return NextResponse.json({
    summary: result.summary,
    updates: (result.updates || []).length,
    creates: (result.creates || []).length,
  })
}
