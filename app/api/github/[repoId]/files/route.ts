import { NextRequest, NextResponse } from 'next/server'
import { db } from '@/lib/db'

export async function GET(req: NextRequest, { params }: { params: Promise<{ repoId: string }> }) {
  const { repoId } = await params
  const q = req.nextUrl.searchParams.get('q')

  const files = q
    ? db.github.files.search(repoId, q)
    : db.github.files.byRepo(repoId)

  return NextResponse.json(files)
}
