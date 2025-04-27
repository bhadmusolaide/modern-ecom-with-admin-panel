// Permission string format: "resource:action"
// Example: "products:create", "users:view", "settings:edit"
export type Permission = string;

export interface Role {
  id: string;
  name: string;
  description: string;
  permissions: Permission[];
  isSystem?: boolean;
}

// Predefined roles with their permissions
export const PREDEFINED_ROLES: Role[] = [
  {
    id: 'admin',
    name: 'Administrator',
    description: 'Full access to all resources',
    permissions: [
      'dashboard:view',
      'products:view',
      'products:create',
      'products:edit',
      'products:delete',
      'orders:view',
      'orders:process',
      'customers:view',
      'customers:edit',
      'settings:view',
      'settings:edit',
      'users:view',
      'users:create',
      'users:edit',
      'users:delete',
      'roles:view',
      'roles:create',
      'roles:edit',
      'roles:delete',
      'media:view',
      'media:upload',
      'media:delete'
    ],
    isSystem: true
  },
  {
    id: 'manager',
    name: 'Store Manager',
    description: 'Manage products, orders, and customers',
    permissions: [
      'dashboard:view',
      'products:view',
      'products:create',
      'products:edit',
      'orders:view',
      'orders:process',
      'customers:view',
      'customers:edit',
      'media:view',
      'media:upload'
    ],
    isSystem: true
  },
  {
    id: 'content-editor',
    name: 'Content Editor',
    description: 'Manage products and content',
    permissions: [
      'products:view',
      'products:create',
      'products:edit',
      'media:view',
      'media:upload'
    ],
    isSystem: true
  }
];
