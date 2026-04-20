export const dynamic = 'force-dynamic';
import { NextRequest, NextResponse } from 'next/server'
import { db } from '@/lib/db'
import { v4 as uuid } from 'uuid'

export async function GET(req: NextRequest) {
  const { searchParams } = new URL(req.url)
  const project_id = searchParams.get('project_id')
  if (!project_id) return NextResponse.json({ error: 'project_id required' }, { status: 400 })
  return NextResponse.json(db.integrations.byProject(project_id))
}

export async function POST(req: NextRequest) {
  const body = await req.json()
  const { project_id, type, label, config, n8n_webhook_url } = body
  if (!project_id || !type) return NextResponse.json({ error: 'project_id and type required' }, { status: 400 })

  const id = uuid()
  db.integrations.create({ id, project_id, type, label, config: config ? JSON.stringify(config) : '{}', n8n_webhook_url })
  return NextResponse.json(db.integrations.get(id), { status: 201 })
}
