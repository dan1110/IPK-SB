import { NextRequest, NextResponse } from 'next/server'
import { db } from '@/lib/db'

export async function GET(_req: NextRequest, { params }: { params: Promise<{ repoId: string }> }) {
  const { repoId } = await params
  const repo = db.github.repos.get(repoId)
  if (!repo) return NextResponse.json({ error: 'Not found' }, { status: 404 })

  const files = db.github.files.byRepo(repoId)
  return NextResponse.json({ ...repo, files })
}

export async function DELETE(_req: NextRequest, { params }: { params: Promise<{ repoId: string }> }) {
  const { repoId } = await params
  db.github.files.deleteByRepo(repoId)
  db.github.repos.delete(repoId)
  return NextResponse.json({ ok: true })
}
