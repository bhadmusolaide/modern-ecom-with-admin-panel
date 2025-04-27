'use client';

import { ReactNode, useEffect, useState } from 'react';
import { Settings } from 'lucide-react';
import { Permission } from '@/lib/rbac/types';
import { useFirebaseAuth } from '@/lib/firebase/auth/FirebaseAuthProvider';

interface PermissionGuardProps {
  children: ReactNode;
  permissions: Permission | Permission[];
  requireAll?: boolean;
  fallback?: ReactNode;
}

/**
 * PermissionGuard component that controls access to UI elements based on user permissions.
 *
 * Checks if the user has the required permissions or is an admin.
 * Admins automatically have access to all protected resources.
 */
export default function PermissionGuard(props: PermissionGuardProps) {
  const { children, permissions, requireAll = false, fallback } = props;
  const { isAdmin, hasPermission, isAuthenticated, isLoading } = useFirebaseAuth();
  const [hasAccess, setHasAccess] = useState(false);
  const [checkComplete, setCheckComplete] = useState(false);

  useEffect(() => {
    // Skip permission check if still loading
    if (isLoading) return;

    // Admin users always have access
    if (isAdmin) {
      console.log('Admin user detected, granting access');
      setHasAccess(true);
      setCheckComplete(true);
      return;
    }

    // No bypass auth - both development and production use Firebase authentication directly
    console.log('Using Firebase authentication for permission check');

    // Check if user has required permissions
    if (isAuthenticated) {
      if (Array.isArray(permissions)) {
        if (requireAll) {
          // User needs all permissions
          setHasAccess(permissions.every(p => hasPermission(p)));
        } else {
          // User needs at least one permission
          setHasAccess(permissions.some(p => hasPermission(p)));
        }
      } else {
        // Single permission check
        setHasAccess(hasPermission(permissions));
      }
    } else {
      setHasAccess(false);
    }

    setCheckComplete(true);
  }, [isAdmin, isAuthenticated, isLoading, hasPermission, permissions, requireAll]);

  // This is the default fallback UI that matches the project's styling
  const defaultFallback = (
    <div className="bg-white dark:bg-gray-800 rounded-lg shadow-md border border-gray-200 dark:border-gray-700 p-6 text-center">
      <Settings size={48} className="mx-auto text-gray-400 dark:text-gray-500 mb-4" />
      <h2 className="text-xl font-bold text-gray-900 dark:text-white mb-2">Access Denied</h2>
      <p className="text-gray-600 dark:text-gray-400">
        You don't have permission to access this resource.
      </p>
    </div>
  );

  // Show loading state if still checking permissions
  if (!checkComplete) {
    return (
      <div className="flex justify-center items-center py-8">
        <div className="animate-spin rounded-full h-8 w-8 border-t-2 border-b-2 border-primary-600"></div>
      </div>
    );
  }

  return hasAccess ? <>{children}</> : <>{fallback || defaultFallback}</>;
}
