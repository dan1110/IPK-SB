import { NextRequest, NextResponse } from 'next/server'
import { db } from '@/lib/db'
import { v4 as uuid } from 'uuid'
import { processUploadedText } from '@/lib/ai'

export const dynamic = 'force-dynamic'

export async function POST(req: NextRequest) {
  try {
    const formData = await req.formData()
    const file = formData.get('file') as File | null
    const projectId = formData.get('project_id') as string | null

    if (!file || !projectId) {
      return NextResponse.json({ error: 'file and project_id required' }, { status: 400 })
    }

    // Validate file type
    const name = file.name.toLowerCase()
    if (!name.endsWith('.pdf') && !name.endsWith('.txt') && !name.endsWith('.md')) {
      return NextResponse.json({ error: 'File must be .pdf, .txt, or .md' }, { status: 400 })
    }

    // Max 20MB
    if (file.size > 20 * 1024 * 1024) {
      return NextResponse.json({ error: 'File too large — max 20MB' }, { status: 400 })
    }

    let content = ''

    if (name.endsWith('.pdf')) {
      const buffer = Buffer.from(await file.arrayBuffer())
      // eslint-disable-next-line @typescript-eslint/no-require-imports
      const pdfParse = require('pdf-parse') as (buf: Buffer) => Promise<{ text: string }>
      const parsed = await pdfParse(buffer)
      content = parsed.text
    } else {
      // .txt or .md — read as text
      content = await file.text()
    }

    if (!content.trim()) {
      return NextResponse.json({ error: 'File is empty or could not be parsed' }, { status: 400 })
    }

    const existingPages = db.knowledge.byProject(projectId) as { id: string; title: string; content: string }[]

    if (!process.env.GEMINI_API_KEY) {
      const id = uuid()
      db.knowledge.create({ id, project_id: projectId, title: file.name.replace(/\.\w+$/, ''), content, source: 'upload' })
      return NextResponse.json({ summary: 'Content saved (no AI processing)', creates: 1, updates: 0 })
    }

    const result = await processUploadedText(content, existingPages)

    for (const u of result.updates || []) {
      db.knowledge.update(u.id, { title: u.title, content: u.content, source: 'upload' })
    }

    for (const c of result.creates || []) {
      db.knowledge.create({ id: uuid(), project_id: projectId, title: c.title, content: c.content, source: 'upload' })
    }

    return NextResponse.json({
      summary: result.summary,
      updates: (result.updates || []).length,
      creates: (result.creates || []).length,
      filename: file.name,
    })
  } catch (err) {
    console.error('[File upload error]', err)
    return NextResponse.json({ error: String(err) }, { status: 500 })
  }
}
