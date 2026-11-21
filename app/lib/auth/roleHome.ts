/**
 * Single source of truth for role-based landing pages.
 *
 * Signing in must never silently dump a shopper into a dashboard. These
 * helpers are only used when the user explicitly chooses "Go to dashboard"
 * or when a staff account attempts a customer-only action.
 */

export function getRoleDashboard(role?: string | null): string {
  switch (role) {
    case 'superadmin':
      return '/superadmin/dashboard';
    case 'admin':
      return '/admin/dashboard';
    case 'user':
      return '/user/dashboard';
    default:
      return '/';
  }
}

export function getRoleLabel(role?: string | null): string {
  switch (role) {
    case 'superadmin':
      return 'Superadmin';
    case 'admin':
      return 'Admin';
    case 'user':
      return 'Customer';
    default:
      return 'Guest';
  }
}

export function isStaffRole(role?: string | null): boolean {
  return role === 'admin' || role === 'superadmin';
}
