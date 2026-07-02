/**
 * Sidebar navigation component for CommPro.ai
 * Shows/hides menu items based on user permissions
 */

'use client';

import { useCallback, useMemo } from 'react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { cn } from '@/lib/utils';
import { NAV_ITEMS, hasPermission, type Permission } from '@/lib/permissions';
import * as Icons from 'lucide-react';

interface SidebarProps {
  userPermissions: Permission[];
  accountId: string;
  className?: string;
}

export function Sidebar({
  userPermissions,
  accountId,
  className,
}: SidebarProps) {
  const pathname = usePathname();

  /**
   * Filter nav items based on user permissions
   * An item is visible if it has no permission requirement (null)
   * or if the user has the required permission
   */
  const visibleNavItems = useMemo(() => {
    return NAV_ITEMS.filter((item) => {
      if (item.permission === null) return true;
      return hasPermission(userPermissions, item.permission);
    });
  }, [userPermissions]);

  /**
   * Check if a nav item is active
   */
  const isActive = useCallback(
    (href: string) => pathname.startsWith(href),
    [pathname]
  );

  /**
   * Get icon component by name
   */
  const getIcon = (iconName: string) => {
    const Icon = (Icons as any)[iconName];
    return Icon ? <Icon className="h-4 w-4" /> : null;
  };

  return (
    <aside
      className={cn(
        'flex flex-col w-64 bg-slate-50 border-r border-slate-200 h-screen overflow-y-auto',
        className
      )}
    >
      {/* Logo/Brand Section */}
      <div className="p-6 border-b border-slate-200">
        <h2 className="font-bold text-lg text-slate-900">CommPro.ai</h2>
        <p className="text-sm text-slate-600">Insurance CRM</p>
      </div>

      {/* Navigation Items */}
      <nav className="flex-1 px-4 py-6 space-y-1">
        {visibleNavItems.map((item) => {
          const active = isActive(item.href);
          return (
            <Link
              key={item.href}
              href={item.href}
              className={cn(
                'flex items-center gap-3 px-4 py-2 rounded-md text-sm font-medium transition-colors',
                active
                  ? 'bg-blue-100 text-blue-900'
                  : 'text-slate-700 hover:bg-slate-100'
              )}
            >
              {getIcon(item.icon)}
              <span>{item.label}</span>
            </Link>
          );
        })}
      </nav>

      {/* Footer Info */}
      <div className="p-4 border-t border-slate-200 text-xs text-slate-500">
        <p className="text-center">
          Permissions: {userPermissions.length}
        </p>
      </div>
    </aside>
  );
}

/**
 * Sidebar permission visibility debug component
 * Shows which nav items are visible for testing
 */
export function SidebarDebug({
  userPermissions,
}: {
  userPermissions: Permission[];
}) {
  return (
    <div className="p-4 bg-yellow-50 border border-yellow-200 rounded-md">
      <h3 className="font-semibold text-sm text-yellow-900 mb-2">
        Debug: Visible Nav Items
      </h3>
      <ul className="text-xs text-yellow-800 space-y-1">
        {NAV_ITEMS.map((item) => {
          const canView = item.permission === null || 
            hasPermission(userPermissions, item.permission);
          return (
            <li key={item.href}>
              <span className={canView ? 'text-green-700 font-medium' : 'text-red-700'}>
                {item.label}: {canView ? '✓' : '✗'}
              </span>
            </li>
          );
        })}
      </ul>
    </div>
  );
}
