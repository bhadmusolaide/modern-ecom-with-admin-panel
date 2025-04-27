import { User } from '@/lib/types';
import { PREDEFINED_ROLES } from './types';

/**
 * Check if a user has a specific permission
 * 
 * @param user - The user to check
 * @param permission - The permission to check for
 * @returns boolean indicating if the user has the permission
 */
export function hasPermission(user: User, permission: string): boolean {
  if (!user) return false;
  
  // Admin role has all permissions
  if (user.role === 'ADMIN') return true;
  
  // Check user's direct permissions first
  if (user.permissions && user.permissions.includes(permission)) {
    return true;
  }
  
  // Check for wildcard permissions (e.g., 'products:*' grants all product permissions)
  if (user.permissions) {
    const category = permission.split(':')[0];
    if (user.permissions.includes(`${category}:*`)) {
      return true;
    }
    
    // Global wildcard permission
    if (user.permissions.includes('*')) {
      return true;
    }
  }
  
  // Check role-based permissions
  const userRole = PREDEFINED_ROLES.find(role => role.id === user.role);
  
  if (userRole) {
    // Check if role has the specific permission
    if (userRole.permissions.includes(permission)) {
      return true;
    }
    
    // Check for wildcard permissions in the role
    const category = permission.split(':')[0];
    if (userRole.permissions.includes(`${category}:*`)) {
      return true;
    }
    
    // Global wildcard permission
    if (userRole.permissions.includes('*')) {
      return true;
    }
  }
  
  return false;
}

/**
 * Get all permissions for a user (combining role permissions and direct permissions)
 * 
 * @param user - The user to get permissions for
 * @returns Array of permission strings
 */
export function getUserPermissions(user: User): string[] {
  if (!user) return [];
  
  // Admin role has all permissions
  if (user.role === 'ADMIN') {
    return ['*']; // Wildcard permission
  }
  
  const permissions = new Set<string>();
  
  // Add user's direct permissions
  if (user.permissions) {
    user.permissions.forEach(permission => permissions.add(permission));
  }
  
  // Add role-based permissions
  const userRole = PREDEFINED_ROLES.find(role => role.id === user.role);
  
  if (userRole) {
    userRole.permissions.forEach(permission => permissions.add(permission));
  }
  
  return Array.from(permissions);
}

/**
 * Check if a user has access to a specific route
 * 
 * @param user - The user to check
 * @param route - The route to check access for
 * @returns boolean indicating if the user has access to the route
 */
export function hasRouteAccess(user: User, route: string): boolean {
  if (!user) return false;
  
  // Admin role has access to all routes
  if (user.role === 'ADMIN') return true;
  
  // Define route permission mappings
  const routePermissions: Record<string, string> = {
    '/admin/dashboard': 'dashboard:view',
    '/admin/products': 'products:view',
    '/admin/orders': 'orders:view',
    '/admin/customers': 'customers:view',
    '/admin/settings': 'settings:view',
    '/admin/system/users': 'users:view',
    '/admin/system/roles': 'roles:view',
    '/admin/media': 'media:view',
    '/admin/reports': 'reports:view',
  };
  
  // Check if route requires permission
  const requiredPermission = routePermissions[route];
  
  if (!requiredPermission) {
    // If route is not in the mapping, default to allowing access
    return true;
  }
  
  return hasPermission(user, requiredPermission);
}
