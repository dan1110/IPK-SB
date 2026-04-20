import { NextRequest, NextResponse } from 'next/server'
import { db } from './db'
import type { User, UserRole } from './types'

/**
 * Phase 1: reads X-User-Id header to identify user.
 * Phase 4: will read JWT cookie instead (API routes won't change).
 */
export function getCurrentUser(req: NextRequest): User | null {
  const userId = req.headers.get('x-user-id')
  if (!userId) return null
  return db.users.get(userId) as User | null
}

export function requireRole(req: NextRequest, allowedRoles: UserRole[]): User {
  const user = getCurrentUser(req)
  if (!user) throw new AuthError('Not authenticated', 401)
  if (!allowedRoles.includes(user.role as UserRole)) throw new AuthError('Forbidden', 403)
  return user
}

export function requireAnyRole(req: NextRequest): User {
  return requireRole(req, ['boss', 'lead', 'employee'])
}

export class AuthError extends Error {
  status: number
  constructor(message: string, status: number) {
    super(message)
    this.status = status
  }
}

export function handleAuthError(err: unknown) {
  if (err instanceof AuthError) {
    return NextResponse.json({ error: err.message }, { status: err.status })
  }
  throw err
}
