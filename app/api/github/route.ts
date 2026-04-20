import { NextRequest, NextResponse } from 'next/server'
import { db } from '@/lib/db'
import { v4 as uuid } from 'uuid'

export async function GET(req: NextRequest) {
  const project_id = req.nextUrl.searchParams.get('project_id')
  if (!project_id) return NextResponse.json({ error: 'project_id required' }, { status: 400 })

  const repos = db.github.repos.byProject(project_id)
  return NextResponse.json(repos)
}

export async function POST(req: NextRequest) {
  const { project_id, repo_url, default_branch } = await req.json()
  if (!project_id || !repo_url) return NextResponse.json({ error: 'project_id and repo_url required' }, { status: 400 })

  const project = db.projects.get(project_id)
  if (!project) return NextResponse.json({ error: 'Project not found' }, { status: 404 })

  const id = uuid()
  db.github.repos.create({ id, project_id, repo_url, default_branch: default_branch || 'main' })
  return NextResponse.json({ ok: true, id })
}
