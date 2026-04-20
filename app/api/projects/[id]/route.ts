import { NextRequest, NextResponse } from 'next/server'
import { db } from '@/lib/db'

export async function GET(_: NextRequest, { params }: { params: { id: string } }) {
  const p = db.projects.get(params.id)
  if (!p) return NextResponse.json({ error: 'Not found' }, { status: 404 })
  return NextResponse.json(p)
}

export async function PUT(req: NextRequest, { params }: { params: { id: string } }) {
  const body = await req.json()
  db.projects.update(params.id, body)
  return NextResponse.json(db.projects.get(params.id))
}

export async function DELETE(_: NextRequest, { params }: { params: { id: string } }) {
  db.projects.delete(params.id)
  return NextResponse.json({ ok: true })
}
