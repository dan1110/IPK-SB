export const dynamic = 'force-dynamic';
import { NextRequest, NextResponse } from 'next/server'
import { db } from '@/lib/db'
import { v4 as uuid } from 'uuid'
import { getCurrentUser } from '@/lib/with-role'

export async function GET(req: NextRequest) {
  const user = getCurrentUser(req)

  let projects: Record<string, unknown>[]
  if (user && user.role !== 'boss') {
    // Lead/employee: only assigned projects
    const projectIds = db.assignments.projectIdsForUser(user.id)
    const allProjects = db.projects.all() as Record<string, unknown>[]
    projects = allProjects.filter(p => projectIds.includes(p.id as string))
  } else {
    // Boss or no user header (backward compat): all projects
    projects = db.projects.all() as Record<string, unknown>[]
  }

  const withCounts = projects.map((p) => ({
    ...p,
    pending_count: db.slack.pendingCount(p.id as string)
  }))
  return NextResponse.json(withCounts)
}

export async function POST(req: NextRequest) {
  const body = await req.json()
  const id = uuid()
  db.projects.create({ id, name: body.name, color: body.color || '#4f8ef7', slack_workspace: body.slack_workspace, tool: body.tool || 'none' })
  return NextResponse.json(db.projects.get(id), { status: 201 })
}
