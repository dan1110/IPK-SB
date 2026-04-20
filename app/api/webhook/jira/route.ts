import { NextRequest, NextResponse } from 'next/server'
import { db } from '@/lib/db'
import { v4 as uuid } from 'uuid'
import { analyzeJiraRisks } from '@/lib/ai'

/*
  n8n syncs Jira tickets to this endpoint.

  Payload:
  {
    "secret": "...",
    "project_id": "...",
    "tickets": [
      {
        "key": "PROJ-123",
        "title": "Implement login",
        "status": "In Progress",
        "assignee": "John",
        "priority": "High",
        "description": "...",
        "due_date": "2026-04-15",
        "labels": ["backend", "sprint-5"]
      }
    ]
  }
*/

export async function POST(req: NextRequest) {
  const body = await req.json()

  const secret = process.env.ZAPIER_WEBHOOK_SECRET
  if (secret && body.secret !== secret) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  const { project_id, tickets } = body
  if (!project_id || !tickets?.length) {
    return NextResponse.json({ error: 'project_id and tickets required' }, { status: 400 })
  }

  const project = db.projects.get(project_id)
  if (!project) return NextResponse.json({ error: 'Project not found' }, { status: 404 })

  // Upsert all tickets
  for (const t of tickets) {
    db.jira.upsert({
      id: uuid(),
      project_id,
      jira_key: t.key,
      title: t.title || '',
      status: t.status || 'To Do',
      assignee: t.assignee || '',
      priority: t.priority || 'Medium',
      description: t.description || '',
      due_date: t.due_date || null,
      labels: JSON.stringify(t.labels || []),
    })
  }

  // AI risk analysis
  let risksFound = 0
  if (process.env.GEMINI_API_KEY) {
    const allTickets = db.jira.byProject(project_id) as { id: string; jira_key: string; title: string; status: string; assignee: string; priority: string; due_date: string | null }[]
    const risks = await analyzeJiraRisks(allTickets)
    for (const r of risks) {
      const ticket = allTickets.find(t => t.jira_key === r.jira_key)
      if (ticket) {
        db.jira.updateRisk(ticket.id, r.risk_level, r.risk_reason)
        risksFound++
      }
    }
  }

  console.log(`[jira webhook] Synced ${tickets.length} tickets, ${risksFound} risks flagged for ${project_id}`)
  return NextResponse.json({ ok: true, synced: tickets.length, risks: risksFound })
}
