export const dynamic = 'force-dynamic';
import { NextRequest, NextResponse } from 'next/server'
import { db } from '@/lib/db'
import { v4 as uuid } from 'uuid'
import type { GithubRepo } from '@/lib/types'

/*
  n8n syncs GitHub repo files to this endpoint.

  Payload:
  {
    "secret": "...",
    "project_id": "...",
    "repo_url": "https://github.com/org/repo",
    "default_branch": "main",
    "files": [
      { "path": "src/index.ts", "content": "..." }
    ]
  }
*/

export async function POST(req: NextRequest) {
  const body = await req.json()

  const secret = process.env.ZAPIER_WEBHOOK_SECRET
  if (secret && body.secret !== secret) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  const { project_id, repo_url, default_branch, files } = body
  if (!project_id || !repo_url || !files?.length) {
    return NextResponse.json({ error: 'project_id, repo_url, and files required' }, { status: 400 })
  }

  const project = db.projects.get(project_id)
  if (!project) return NextResponse.json({ error: 'Project not found' }, { status: 404 })

  // Find or create repo
  const existingRepos = db.github.repos.byProject(project_id) as GithubRepo[]
  let repo = existingRepos.find(r => r.repo_url === repo_url)
  if (!repo) {
    const repoId = uuid()
    db.github.repos.create({ id: repoId, project_id, repo_url, default_branch: default_branch || 'main' })
    repo = { id: repoId, project_id, repo_url, default_branch: default_branch || 'main', last_synced: null }
  }

  // Upsert files
  for (const f of files) {
    db.github.files.upsert({ id: uuid(), repo_id: repo.id, file_path: f.path, content: f.content })
  }

  // Update sync timestamp
  db.github.repos.updateSynced(repo.id)

  console.log(`[github webhook] Synced ${files.length} files from ${repo_url} for ${project_id}`)
  return NextResponse.json({ ok: true, repo_id: repo.id, files_synced: files.length })
}
