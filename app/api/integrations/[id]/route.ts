export const dynamic = 'force-dynamic';
import { NextRequest, NextResponse } from 'next/server'
import { db } from '@/lib/db'

export async function PUT(req: NextRequest, { params }: { params: { id: string } }) {
  const existing = db.integrations.get(params.id)
  if (!existing) return NextResponse.json({ error: 'Not found' }, { status: 404 })

  const body = await req.json()
  const updates: Record<string, string | number> = {}
  if (body.type !== undefined) updates.type = body.type
  if (body.label !== undefined) updates.label = body.label
  if (body.config !== undefined) updates.config = typeof body.config === 'string' ? body.config : JSON.stringify(body.config)
  if (body.n8n_webhook_url !== undefined) updates.n8n_webhook_url = body.n8n_webhook_url
  if (body.active !== undefined) updates.active = body.active ? 1 : 0

  if (Object.keys(updates).length > 0) {
    db.integrations.update(params.id, updates as Parameters<typeof db.integrations.update>[1])
  }
  return NextResponse.json(db.integrations.get(params.id))
}

export async function DELETE(_req: NextRequest, { params }: { params: { id: string } }) {
  db.integrations.delete(params.id)
  return NextResponse.json({ ok: true })
}
