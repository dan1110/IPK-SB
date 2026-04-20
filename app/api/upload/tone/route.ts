export const dynamic = 'force-dynamic';
import { NextRequest, NextResponse } from 'next/server'
import { db } from '@/lib/db'
import { v4 as uuid } from 'uuid'

export async function GET(req: NextRequest) {
  const projectId = req.nextUrl.searchParams.get('project_id')
  if (!projectId) return NextResponse.json({ error: 'project_id required' }, { status: 400 })
  const tone = db.tone.get(projectId)
  if (!tone) return NextResponse.json({ samples: [], style_notes: '', salutation: '' })
  const t = tone as { samples: string; style_notes: string; salutation: string }
  return NextResponse.json({ ...t, samples: JSON.parse(t.samples) })
}

export async function POST(req: NextRequest) {
  const body = await req.json()
  const { project_id, samples, style_notes, salutation } = body
  db.tone.upsert({ id: uuid(), project_id, samples: JSON.stringify(samples || []), style_notes: style_notes || '', salutation: salutation || '' })
  return NextResponse.json({ ok: true })
}
