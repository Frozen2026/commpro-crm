/**
 * Permission constants and helper functions for CommPro.ai
 * Integrated with MakerKit's kit.has_permission() RLS system
 */

export const PERMISSIONS = {
  AGENCIES_MANAGE: 'agencies.manage',
  AGENCIES_VIEW: 'agencies.view',
  LEADS_MANAGE: 'leads.manage',
  LEADS_VIEW: 'leads.view',
  CLIENTS_MANAGE: 'clients.manage',
  CLIENTS_VIEW: 'clients.view',
  POLICIES_MANAGE: 'policies.manage',
  POLICIES_VIEW: 'policies.view',
  COMMISSIONS_MANAGE: 'commissions.manage',
  COMMISSIONS_VIEW: 'commissions.view',
  RENEWALS_MANAGE: 'renewals.manage',
  RENEWALS_VIEW: 'renewals.view',
  CLAIMS_MANAGE: 'claims.manage',
  CLAIMS_VIEW: 'claims.view',
  REPORTS_VIEW: 'reports.view',
  SETTINGS_MANAGE: 'settings.manage',
  COI_ISSUE: 'coi.issue',
  AI_USE: 'ai.use',
} as const;

export type Permission = typeof PERMISSIONS[keyof typeof PERMISSIONS];

/**
 * Role to permission mappings
 * Mirrors database configuration in accounts_roles table
 */
export const ROLE_PERMISSIONS: Record<string, Permission[]> = {
  owner: [
    'agencies.manage',
    'agencies.view',
    'leads.manage',
    'leads.view',
    'clients.manage',
    'clients.view',
    'policies.manage',
    'policies.view',
    'commissions.manage',
    'commissions.view',
    'renewals.manage',
    'renewals.view',
    'claims.manage',
    'claims.view',
    'reports.view',
    'settings.manage',
    'coi.issue',
    'ai.use',
  ],
  mga_admin: [
    'agencies.manage',
    'agencies.view',
    'leads.manage',
    'leads.view',
    'clients.manage',
    'clients.view',
    'policies.manage',
    'policies.view',
    'commissions.manage',
    'commissions.view',
    'renewals.manage',
    'renewals.view',
    'claims.manage',
    'claims.view',
    'reports.view',
    'settings.manage',
    'coi.issue',
    'ai.use',
  ],
  agency_admin: [
    'agencies.view',
    'leads.manage',
    'leads.view',
    'clients.manage',
    'clients.view',
    'policies.manage',
    'policies.view',
    'commissions.view',
    'renewals.manage',
    'renewals.view',
    'claims.manage',
    'claims.view',
    'reports.view',
    'coi.issue',
    'ai.use',
  ],
  agent: [
    'leads.manage',
    'leads.view',
    'clients.manage',
    'clients.view',
    'policies.view',
    'renewals.view',
    'claims.view',
    'coi.issue',
    'ai.use',
  ],
  csr: [
    'leads.view',
    'clients.view',
    'policies.view',
    'coi.issue',
  ],
};

/**
 * Check if a user has a specific permission
 * Note: This is a client-side reference. The actual permission check
 * happens server-side via MakerKit's kit.has_permission() in RLS policies.
 */
export function hasPermission(
  userPermissions: Permission[],
  permission: Permission
): boolean {
  return userPermissions.includes(permission);
}

/**
 * Check if a user has any of multiple permissions
 */
export function hasAnyPermission(
  userPermissions: Permission[],
  permissions: Permission[]
): boolean {
  return permissions.some((p) => userPermissions.includes(p));
}

/**
 * Check if a user has all of multiple permissions
 */
export function hasAllPermissions(
  userPermissions: Permission[],
  permissions: Permission[]
): boolean {
  return permissions.every((p) => userPermissions.includes(p));
}

/**
 * Navigation items with their required permission(s)
 */
export const NAV_ITEMS = [
  {
    label: 'Dashboard',
    href: '/dashboard',
    permission: null, // Everyone can see dashboard
    icon: 'LayoutDashboard',
  },
  {
    label: 'Leads',
    href: '/dashboard/leads',
    permission: PERMISSIONS.LEADS_VIEW,
    icon: 'Users',
  },
  {
    label: 'Clients',
    href: '/dashboard/clients',
    permission: PERMISSIONS.CLIENTS_VIEW,
    icon: 'Building2',
  },
  {
    label: 'Policies',
    href: '/dashboard/policies',
    permission: PERMISSIONS.POLICIES_VIEW,
    icon: 'FileText',
  },
  {
    label: 'Renewals',
    href: '/dashboard/renewals',
    permission: PERMISSIONS.RENEWALS_VIEW,
    icon: 'RotateCw',
  },
  {
    label: 'Commissions',
    href: '/dashboard/commissions',
    permission: PERMISSIONS.COMMISSIONS_VIEW,
    icon: 'DollarSign',
  },
  {
    label: 'Claims',
    href: '/dashboard/claims',
    permission: PERMISSIONS.CLAIMS_VIEW,
    icon: 'AlertCircle',
  },
  {
    label: 'COI Request',
    href: '/dashboard/coi',
    permission: PERMISSIONS.COI_ISSUE,
    icon: 'FileCheck',
  },
  {
    label: 'Reports',
    href: '/dashboard/reports',
    permission: PERMISSIONS.REPORTS_VIEW,
    icon: 'BarChart3',
  },
  {
    label: 'Settings',
    href: '/dashboard/settings',
    permission: PERMISSIONS.SETTINGS_MANAGE,
    icon: 'Settings',
  },
] as const;
