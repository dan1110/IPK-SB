export const dynamic = 'force-dynamic';
import { NextRequest, NextResponse } from 'next/server'
import { db } from '@/lib/db'

export async function GET(_: NextRequest, { params }: { params: { id: string } }) {
  const m = db.meetings.get(params.id)
  if (!m) return NextResponse.json({ error: 'Not found' }, { status: 404 })
  return NextResponse.json(m)
}

export async function PUT(req: NextRequest, { params }: { params: { id: string } }) {
  const body = await req.json()
  db.meetings.update(params.id, body)
  return NextResponse.json(db.meetings.get(params.id))
}

export async function DELETE(_: NextRequest, { params }: { params: { id: string } }) {
  db.meetings.delete(params.id)
  return NextResponse.json({ ok: true })
}
