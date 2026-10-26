import type { UserRole } from '../types'

/**
 * Human-readable label for an account role, shared across the app shell.
 * `lecturer` is a legacy sign-up role: lecturers are shown as members until
 * they verify their account as creators.
 */
export function roleLabel(role: UserRole | undefined): string {
  switch (role) {
    case 'admin':
      return 'Administrator'
    case 'creator':
      return 'Creator'
    default:
      return 'Member'
  }
}
