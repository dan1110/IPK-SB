export const dynamic = 'force-dynamic';
import { NextRequest, NextResponse } from 'next/server'
import { db } from '@/lib/db'
import { v4 as uuid } from 'uuid'
import { chatWithContext, buildContext, buildCodeContext } from '@/lib/ai'
import type { GithubRepo, GithubFile } from '@/lib/types'

export async function GET(req: NextRequest) {
  const projectId = req.nextUrl.searchParams.get('project_id')
  if (!projectId) return NextResponse.json({ error: 'project_id required' }, { status: 400 })
  return NextResponse.json(db.chat.byProject(projectId))
}

export async function POST(req: NextRequest) {
  const body = await req.json()
  const { project_id, message } = body
  if (!project_id || !message) return NextResponse.json({ error: 'project_id and message required' }, { status: 400 })

  const project = db.projects.get(project_id) as { name: string } | undefined
  if (!project) return NextResponse.json({ error: 'Project not found' }, { status: 404 })

  // Save user message
  db.chat.create({ id: uuid(), project_id, role: 'user', content: message })

  // Build context with knowledge + meetings + jira + code
  const pages = db.knowledge.byProject(project_id) as { title: string; content: string }[]
  const meetings = db.meetings.byProject(project_id) as { title: string; date: string; summary: string; action_items: string; key_decisions: string }[]
  const tickets = db.jira.byProject(project_id) as { jira_key: string; title: string; status: string; assignee: string; priority: string; risk_level: string; due_date: string | null }[]

  // Get relevant code files if repos exist
  let codeFiles: { file_path: string; content: string }[] = []
  const repos = db.github.repos.byProject(project_id) as GithubRepo[]
  if (repos.length > 0) {
    const allFiles: GithubFile[] = []
    for (const repo of repos) {
      const files = db.github.files.search(repo.id, message) as GithubFile[]
      allFiles.push(...files)
    }
    codeFiles = buildCodeContext(allFiles, message)
  }

  const context = buildContext(pages, meetings, tickets.length ? tickets : undefined, codeFiles.length ? codeFiles : undefined)

  // Build history (last 10 messages)
  const history = (db.chat.byProject(project_id) as { role: string; content: string }[])
    .slice(-10)
    .map(m => ({ role: m.role as 'user' | 'assistant', content: m.content }))

  let reply = 'AI not configured — set GEMINI_API_KEY in .env.local'
  if (process.env.GEMINI_API_KEY) {
    reply = await chatWithContext(history, context, project.name)
  }

  db.chat.create({ id: uuid(), project_id, role: 'assistant', content: reply })
  return NextResponse.json({ reply })
}

export async function DELETE(req: NextRequest) {
  const projectId = req.nextUrl.searchParams.get('project_id')
  if (!projectId) return NextResponse.json({ error: 'project_id required' }, { status: 400 })
  db.chat.clear(projectId)
  return NextResponse.json({ ok: true })
}
