import { NextRequest, NextResponse } from 'next/server'
import { db } from '@/lib/db'

export async function PUT(req: NextRequest, { params }: { params: { id: string } }) {
  const body = await req.json()
  db.knowledge.update(params.id, body)
  return NextResponse.json(db.knowledge.get(params.id))
}

export async function DELETE(_: NextRequest, { params }: { params: { id: string } }) {
  db.knowledge.delete(params.id)
  return NextResponse.json({ ok: true })
}
