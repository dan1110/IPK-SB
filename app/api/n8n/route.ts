import { NextRequest, NextResponse } from 'next/server'
import { db } from '@/lib/db'

/*
  Utility endpoint for n8n to query project mappings.

  GET /api/n8n?secret=...
    → Returns all projects with their workspace + tool config.
    → n8n can use this to verify workspace→project mapping.

  GET /api/n8n?secret=...&workspace=neopets-team
    → Returns the specific project matching that workspace name.
*/

export async function GET(req: NextRequest) {
  const secret = process.env.ZAPIER_WEBHOOK_SECRET
  const qSecret = req.nextUrl.searchParams.get('secret')
  if (secret && qSecret !== secret) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  const workspace = req.nextUrl.searchParams.get('workspace')

  const allProjects = db.projects.all() as { id: string; name: string; slack_workspace: string | null; tool: string }[]

  if (workspace) {
    const wsLower = workspace.toLowerCase().trim()
    const matched = allProjects.find(p =>
      p.slack_workspace && p.slack_workspace.toLowerCase().trim() === wsLower
    )
    if (!matched) {
      return NextResponse.json({ error: `No project with slack_workspace "${workspace}"`, available: allProjects.map(p => ({ name: p.name, slack_workspace: p.slack_workspace })) }, { status: 404 })
    }
    return NextResponse.json({ project_id: matched.id, name: matched.name, tool: matched.tool, slack_workspace: matched.slack_workspace })
  }

  // Return all project mappings
  return NextResponse.json(allProjects.map(p => ({
    project_id: p.id,
    name: p.name,
    slack_workspace: p.slack_workspace,
    tool: p.tool,
  })))
}
