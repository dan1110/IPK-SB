import type { UserRole } from './types'

export function canCreateProject(role: UserRole): boolean { return role === 'boss' }
export function canDeleteProject(role: UserRole): boolean { return role === 'boss' }
export function canManageUsers(role: UserRole): boolean { return role === 'boss' }
export function canAssignPeople(role: UserRole): boolean { return role === 'boss' }
export function canViewAllProjects(role: UserRole): boolean { return role === 'boss' }
export function canViewDashboard(role: UserRole): boolean { return role === 'boss' || role === 'lead' }
export function canApproveFlagged(role: UserRole): boolean { return role === 'boss' || role === 'lead' }
export function canSetupIntegrations(role: UserRole): boolean { return role === 'boss' }
