export const dynamic = 'force-dynamic';
import { NextRequest, NextResponse } from 'next/server'
import { db } from '@/lib/db'

export async function GET(_req: NextRequest, { params }: { params: { id: string } }) {
  const user = db.users.get(params.id)
  if (!user) return NextResponse.json({ error: 'Not found' }, { status: 404 })
  return NextResponse.json(user)
}

export async function PUT(req: NextRequest, { params }: { params: { id: string } }) {
  const user = db.users.get(params.id)
  if (!user) return NextResponse.json({ error: 'Not found' }, { status: 404 })

  const body = await req.json()
  const { name, email, role, title, avatar, active } = body
  const updates: Record<string, string | number> = {}
  if (name !== undefined) updates.name = name
  if (email !== undefined) updates.email = email
  if (role !== undefined) updates.role = role
  if (title !== undefined) updates.title = title
  if (avatar !== undefined) updates.avatar = avatar
  if (active !== undefined) updates.active = active

  if (Object.keys(updates).length > 0) {
    db.users.update(params.id, updates as Parameters<typeof db.users.update>[1])
  }
  return NextResponse.json(db.users.get(params.id))
}

export async function DELETE(_req: NextRequest, { params }: { params: { id: string } }) {
  db.users.deactivate(params.id)
  return NextResponse.json({ ok: true })
}
