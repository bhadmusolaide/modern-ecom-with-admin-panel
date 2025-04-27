import { Permission } from './types';

// All available permissions in the system
export const ALL_PERMISSIONS: Permission[] = [
  // Dashboard
  'dashboard:view',

  // Products
  'products:view',
  'products:create',
  'products:edit',
  'products:delete',

  // Orders
  'orders:view',
  'orders:process',
  'orders:refund',
  'orders:cancel',

  // Customers
  'customers:view',
  'customers:edit',

  // Settings
  'settings:view',
  'settings:edit',

  // Users
  'users:view',
  'users:create',
  'users:edit',
  'users:delete',

  // Roles
  'roles:view',
  'roles:create',
  'roles:edit',
  'roles:delete',

  // Media
  'media:view',
  'media:upload',
  'media:delete',

  // Reports
  'reports:view',
  'reports:export'
];

// Group permissions by category
export function getAllPermissionsByCategory(): Record<string, Permission[]> {
  const categories: Record<string, Permission[]> = {};

  ALL_PERMISSIONS.forEach(permission => {
    const [category] = permission.split(':');

    if (!categories[category]) {
      categories[category] = [];
    }

    categories[category].push(permission);
  });

  return categories;
}

// Get all permissions
export function getAllPermissions(): Permission[] {
  return ALL_PERMISSIONS;
}

// Get permissions by category
export function getPermissionsByCategory(category: string): Permission[] {
  return ALL_PERMISSIONS.filter(permission => permission.startsWith(`${category}:`));
}
