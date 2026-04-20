import { NextRequest, NextResponse } from 'next/server'
import { db } from '@/lib/db'
import { v4 as uuid } from 'uuid'

export async function GET(req: NextRequest) {
  const { searchParams } = new URL(req.url)
  const project_id = searchParams.get('project_id')
  const user_id = searchParams.get('user_id')

  if (project_id) return NextResponse.json(db.assignments.byProject(project_id))
  if (user_id) return NextResponse.json(db.assignments.byUser(user_id))
  return NextResponse.json({ error: 'project_id or user_id required' }, { status: 400 })
}

export async function POST(req: NextRequest) {
  const body = await req.json()
  const { user_id, project_id, role_in_project = 'member' } = body
  if (!user_id || !project_id) return NextResponse.json({ error: 'user_id and project_id required' }, { status: 400 })

  db.assignments.assign({ id: uuid(), user_id, project_id, role_in_project })
  return NextResponse.json({ ok: true }, { status: 201 })
}

export async function DELETE(req: NextRequest) {
  const { searchParams } = new URL(req.url)
  const user_id = searchParams.get('user_id')
  const project_id = searchParams.get('project_id')
  if (!user_id || !project_id) return NextResponse.json({ error: 'user_id and project_id required' }, { status: 400 })

  db.assignments.remove(user_id, project_id)
  return NextResponse.json({ ok: true })
}
