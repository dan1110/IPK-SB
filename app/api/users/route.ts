import { NextRequest, NextResponse } from 'next/server'
import { db } from '@/lib/db'
import { v4 as uuid } from 'uuid'

export async function GET() {
  const users = db.users.all()
  return NextResponse.json(users)
}

export async function POST(req: NextRequest) {
  const body = await req.json()
  const { name, email, role = 'employee', title = '', avatar = '' } = body
  if (!name || !email) return NextResponse.json({ error: 'name and email required' }, { status: 400 })

  const existing = db.users.getByEmail(email)
  if (existing) return NextResponse.json({ error: 'Email already exists' }, { status: 409 })

  const id = uuid()
  db.users.create({ id, name, email, role, title, avatar })
  return NextResponse.json(db.users.get(id), { status: 201 })
}
