import { NextRequest, NextResponse } from 'next/server'
import { db } from '@/lib/db'

export async function GET(req: NextRequest) {
  const { searchParams } = new URL(req.url)
  const project_id = searchParams.get('project_id')
  const user_id = searchParams.get('user_id')
  const limit = parseInt(searchParams.get('limit') || '50')

  if (project_id) return NextResponse.json(db.activity.byProject(project_id, limit))
  if (user_id) return NextResponse.json(db.activity.byUser(user_id, limit))
  return NextResponse.json({ error: 'project_id or user_id required' }, { status: 400 })
}
