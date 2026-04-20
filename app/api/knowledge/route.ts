import { NextRequest, NextResponse } from 'next/server'
import { db } from '@/lib/db'
import { v4 as uuid } from 'uuid'

export async function GET(req: NextRequest) {
  const projectId = req.nextUrl.searchParams.get('project_id')
  const q = req.nextUrl.searchParams.get('q')
  if (!projectId) return NextResponse.json({ error: 'project_id required' }, { status: 400 })
  const pages = q ? db.knowledge.search(projectId, q) : db.knowledge.byProject(projectId)
  return NextResponse.json(pages)
}

export async function POST(req: NextRequest) {
  const body = await req.json()
  const id = uuid()
  db.knowledge.create({ id, project_id: body.project_id, title: body.title, content: body.content || '', source: body.source || 'manual' })
  return NextResponse.json(db.knowledge.get(id), { status: 201 })
}
