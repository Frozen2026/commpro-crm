/**
 * Hook to fetch and cache user permissions from MakerKit
 * Integrates with the MakerKit authentication system
 */

import { useCallback, useEffect, useState } from 'react';
import { createClient } from '@/lib/supabase/client';
import type { Permission } from '@/lib/permissions';

interface UseUserPermissionsReturn {
  permissions: Permission[] | null;
  loading: boolean;
  error: Error | null;
  refetch: () => Promise<void>;
}

/**
 * Fetch user's permissions from their current account's accounts_memberships
 * and accounts_roles configuration
 */
export function useUserPermissions(
  accountId: string | null
): UseUserPermissionsReturn {
  const [permissions, setPermissions] = useState<Permission[] | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<Error | null>(null);

  const supabase = createClient();

  const fetchPermissions = useCallback(async () => {
    if (!accountId) {
      setPermissions(null);
      setLoading(false);
      return;
    }

    try {
      setLoading(true);
      setError(null);

      // Get current user's role in this account via accounts_memberships
      const {
        data: { user },
      } = await supabase.auth.getUser();

      if (!user) {
        setPermissions([]);
        return;
      }

      // Query MakerKit's accounts_memberships to get the user's role
      const { data: membership, error: membershipError } = await supabase
        .from('accounts_memberships')
        .select('role')
        .eq('account_id', accountId)
        .eq('user_id', user.id)
        .single();

      if (membershipError) {
        throw new Error(`Failed to fetch membership: ${membershipError.message}`);
      }

      if (!membership || !membership.role) {
        setPermissions([]);
        return;
      }

      // Query accounts_roles to get permissions for this role
      const { data: roleData, error: roleError } = await supabase
        .from('accounts_roles')
        .select('permissions')
        .eq('role', membership.role)
        .single();

      if (roleError) {
        throw new Error(`Failed to fetch role permissions: ${roleError.message}`);
      }

      setPermissions((roleData?.permissions as Permission[]) || []);
    } catch (err) {
      console.error('Failed to fetch user permissions:', err);
      setError(err instanceof Error ? err : new Error('Unknown error'));
      setPermissions([]);
    } finally {
      setLoading(false);
    }
  }, [accountId, supabase]);

  useEffect(() => {
    fetchPermissions();
  }, [fetchPermissions]);

  return {
    permissions,
    loading,
    error,
    refetch: fetchPermissions,
  };
}

/**
 * Hook for checking if user has a specific permission
 * Useful for conditional rendering in components
 */
export function useHasPermission(
  accountId: string | null,
  requiredPermission: Permission
): boolean {
  const { permissions } = useUserPermissions(accountId);

  if (!permissions) return false;
  return permissions.includes(requiredPermission);
}

/**
 * Hook for checking if user has any of multiple permissions
 */
export function useHasAnyPermission(
  accountId: string | null,
  requiredPermissions: Permission[]
): boolean {
  const { permissions } = useUserPermissions(accountId);

  if (!permissions) return false;
  return requiredPermissions.some((p) => permissions.includes(p));
}

/**
 * Hook for checking if user has all of multiple permissions
 */
export function useHasAllPermissions(
  accountId: string | null,
  requiredPermissions: Permission[]
): boolean {
  const { permissions } = useUserPermissions(accountId);

  if (!permissions) return false;
  return requiredPermissions.every((p) => permissions.includes(p));
}
