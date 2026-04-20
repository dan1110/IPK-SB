export const dynamic = 'force-dynamic';
import { NextRequest, NextResponse } from 'next/server'
import { db } from '@/lib/db'

export async function GET(req: NextRequest) {
  const project_id = req.nextUrl.searchParams.get('project_id')
  if (!project_id) return NextResponse.json({ error: 'project_id required' }, { status: 400 })

  const status = req.nextUrl.searchParams.get('status') || 'all'
  const tickets = db.jira.byProject(project_id, status)
  const stats = db.jira.stats(project_id)
  const riskCount = db.jira.riskTickets(project_id).length

  return NextResponse.json({ tickets, stats, riskCount })
}
