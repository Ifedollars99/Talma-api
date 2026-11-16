import type { UserRole } from '../types'

/**
 * Human-readable label for an account role, shared across the app shell.
 * Backend roles stay `user`/`creator`; the product calls them Student and
 * Educator. `lecturer` is a legacy sign-up role for educator accounts.
 */
export function roleLabel(role: UserRole | undefined): string {
  switch (role) {
    case 'admin':
      return 'Administrator'
    case 'creator':
    case 'lecturer':
      return 'Educator'
    default:
      return 'Student'
  }
}
