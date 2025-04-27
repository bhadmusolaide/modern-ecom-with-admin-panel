'use client';

import React, { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { Save, AlertCircle, Info, Check, X } from 'lucide-react';
import Button from '@/components/ui/Button';
import Card from '@/components/ui/Card';
import { useToast } from '@/lib/context/ToastContext';
import { useActivity } from '@/lib/context/ActivityContext';
import Section from '@/components/admin/layouts/Section';
import { Role } from '@/lib/rbac/types';
import { Permission } from '@/lib/rbac/permissions';

const PermissionMatrix: React.FC = () => {
  const { showToast } = useToast();
  const { addActivity } = useActivity();

  const [roles, setRoles] = useState<Role[]>([]);
  const [permissions, setPermissions] = useState<string[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isSaving, setIsSaving] = useState(false);
  const [hasChanges, setHasChanges] = useState(false);
  const [permissionsByCategory, setPermissionsByCategory] = useState<Record<string, string[]>>({});
  const [rolePermissions, setRolePermissions] = useState<Record<string, string[]>>({});
  const [csrfToken, setCsrfToken] = useState('');

  // Fetch CSRF token
  useEffect(() => {
    const fetchCsrfToken = async () => {
      try {
        console.log('PermissionMatrix: Fetching CSRF token...');
        const response = await fetch('/api/auth/csrf');
        if (!response.ok) {
          throw new Error(`Failed to fetch CSRF token: ${response.status}`);
        }
        const data = await response.json();
        console.log('PermissionMatrix: CSRF token fetched successfully');
        setCsrfToken(data.csrfToken);
      } catch (error) {
        console.error('Error fetching CSRF token:', error);
      }
    };

    fetchCsrfToken();
  }, []);

  // Fetch roles and permissions
  useEffect(() => {
    const fetchData = async () => {
      try {
        console.log('PermissionMatrix: Fetching roles and permissions...');
        setIsLoading(true);

        // Fetch roles
        console.log('PermissionMatrix: Fetching roles...');
        const rolesResponse = await fetch('/api/admin/roles');
        if (!rolesResponse.ok) {
          throw new Error(`Failed to fetch roles: ${rolesResponse.status}`);
        }
        const rolesData = await rolesResponse.json();
        console.log('PermissionMatrix: Roles fetched successfully:', rolesData.roles?.length || 0, 'roles');

        // Use default roles if API fails
        if (!rolesData.roles || !Array.isArray(rolesData.roles)) {
          console.warn('PermissionMatrix: Invalid roles data, using defaults');
          // Import predefined roles
          const { PREDEFINED_ROLES } = await import('@/lib/rbac/types');
          setRoles(PREDEFINED_ROLES);

          // Initialize role permissions with predefined roles
          const initialRolePermissions: Record<string, string[]> = {};
          PREDEFINED_ROLES.forEach((role: Role) => {
            initialRolePermissions[role.id] = [...role.permissions];
          });
          setRolePermissions(initialRolePermissions);
        } else {
          setRoles(rolesData.roles);

          // Initialize role permissions
          const initialRolePermissions: Record<string, string[]> = {};
          rolesData.roles.forEach((role: Role) => {
            initialRolePermissions[role.id] = [...role.permissions];
          });
          setRolePermissions(initialRolePermissions);
        }

        // Fetch permissions
        console.log('PermissionMatrix: Fetching permissions...');
        try {
          const permissionsResponse = await fetch('/api/admin/permissions');
          if (!permissionsResponse.ok) {
            throw new Error(`Failed to fetch permissions: ${permissionsResponse.status}`);
          }
          const permissionsData = await permissionsResponse.json();
          console.log('PermissionMatrix: Permissions fetched successfully:', permissionsData.permissions?.length || 0, 'permissions');

          setPermissions(permissionsData.permissions);

          // Group permissions by category
          const grouped = permissionsData.permissions.reduce((acc: Record<string, string[]>, permission: string) => {
            const category = permission.split(':')[0];
            if (!acc[category]) {
              acc[category] = [];
            }
            acc[category].push(permission);
            return acc;
          }, {});
          setPermissionsByCategory(grouped);
        } catch (permissionsError) {
          console.error('Error fetching permissions:', permissionsError);

          // Import default permissions
          const { ALL_PERMISSIONS } = await import('@/lib/rbac/permissions');
          console.log('PermissionMatrix: Using default permissions');
          setPermissions(ALL_PERMISSIONS);

          // Group default permissions by category
          const grouped = ALL_PERMISSIONS.reduce((acc: Record<string, string[]>, permission: string) => {
            const category = permission.split(':')[0];
            if (!acc[category]) {
              acc[category] = [];
            }
            acc[category].push(permission);
            return acc;
          }, {});
          setPermissionsByCategory(grouped);
        }
      } catch (error) {
        console.error('Error fetching data:', error);
        showToast('Failed to load roles and permissions', 'error');
      } finally {
        setIsLoading(false);
      }
    };

    fetchData();
  }, [showToast]);

  // Check for changes
  useEffect(() => {
    const checkChanges = () => {
      for (const role of roles) {
        const currentPermissions = rolePermissions[role.id] || [];
        const originalPermissions = role.permissions || [];

        // Check if arrays have different lengths
        if (currentPermissions.length !== originalPermissions.length) {
          setHasChanges(true);
          return;
        }

        // Check if arrays have different contents
        const sortedCurrent = [...currentPermissions].sort();
        const sortedOriginal = [...originalPermissions].sort();
        for (let i = 0; i < sortedCurrent.length; i++) {
          if (sortedCurrent[i] !== sortedOriginal[i]) {
            setHasChanges(true);
            return;
          }
        }
      }

      setHasChanges(false);
    };

    checkChanges();
  }, [rolePermissions, roles]);

  // Toggle permission for a role
  const togglePermission = (roleId: string, permission: string) => {
    setRolePermissions(prev => {
      const rolePerm = prev[roleId] || [];

      if (rolePerm.includes(permission)) {
        return {
          ...prev,
          [roleId]: rolePerm.filter(p => p !== permission)
        };
      } else {
        return {
          ...prev,
          [roleId]: [...rolePerm, permission]
        };
      }
    });
  };

  // Toggle all permissions in a category for a role
  const toggleCategoryPermissions = (roleId: string, category: string, enabled: boolean) => {
    const categoryPermissions = permissionsByCategory[category] || [];

    setRolePermissions(prev => {
      const rolePerm = prev[roleId] || [];

      if (enabled) {
        // Add all permissions in the category
        const newPermissions = [...rolePerm];
        categoryPermissions.forEach(permission => {
          if (!newPermissions.includes(permission)) {
            newPermissions.push(permission);
          }
        });
        return {
          ...prev,
          [roleId]: newPermissions
        };
      } else {
        // Remove all permissions in the category
        return {
          ...prev,
          [roleId]: rolePerm.filter(p => !categoryPermissions.includes(p))
        };
      }
    });
  };

  // Save permission changes
  const savePermissions = async () => {
    if (!hasChanges) return;

    try {
      setIsSaving(true);

      // Save permissions for each role
      for (const role of roles) {
        const currentPermissions = rolePermissions[role.id] || [];

        // Skip if no changes for this role
        if (JSON.stringify(currentPermissions.sort()) === JSON.stringify([...role.permissions].sort())) {
          continue;
        }

        const response = await fetch(`/api/admin/roles/${role.id}/permissions`, {
          method: 'PUT',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            permissions: currentPermissions,
            csrfToken
          }),
        });

        if (!response.ok) {
          const data = await response.json();
          throw new Error(data.error || `Failed to update permissions for role: ${role.name}`);
        }

        // Log activity
        addActivity({
          type: 'system',
          action: 'update',
          description: `Updated permissions for role: ${role.name}`,
          targetId: role.id,
          targetName: role.name,
          metadata: {
            role: role.name,
            previousPermissions: role.permissions,
            newPermissions: currentPermissions
          }
        });
      }

      // Update local state
      setRoles(roles.map(role => ({
        ...role,
        permissions: rolePermissions[role.id] || []
      })));

      setHasChanges(false);
      showToast('Permissions updated successfully', 'success');
    } catch (error) {
      console.error('Error saving permissions:', error);
      showToast(error instanceof Error ? error.message : 'Failed to save permissions', 'error');
    } finally {
      setIsSaving(false);
    }
  };

  // Check if all permissions in a category are enabled for a role
  const isCategoryFullyEnabled = (roleId: string, category: string) => {
    const categoryPermissions = permissionsByCategory[category] || [];
    const rolePerm = rolePermissions[roleId] || [];

    return categoryPermissions.every(permission => rolePerm.includes(permission));
  };

  // Check if some permissions in a category are enabled for a role
  const isCategoryPartiallyEnabled = (roleId: string, category: string) => {
    const categoryPermissions = permissionsByCategory[category] || [];
    const rolePerm = rolePermissions[roleId] || [];

    return categoryPermissions.some(permission => rolePerm.includes(permission)) &&
           !categoryPermissions.every(permission => rolePerm.includes(permission));
  };

  if (isLoading) {
    return (
      <div className="flex justify-center items-center h-64">
        <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-primary-600"></div>
      </div>
    );
  }

  return (
    <Section
      title="Permission Matrix"
      description="Manage permissions for each role"
      actions={
        <Button
          variant="primary"
          size="sm"
          icon={<Save size={16} />}
          onClick={savePermissions}
          isLoading={isSaving}
          loadingText="Saving..."
          disabled={!hasChanges}
        >
          Save Changes
        </Button>
      }
    >
      {hasChanges && (
        <div className="mb-4 p-3 bg-yellow-50 border border-yellow-200 rounded-md flex items-center text-yellow-800">
          <AlertCircle size={16} className="mr-2 flex-shrink-0" />
          <span className="text-sm">
            You have unsaved changes. Click "Save Changes" to apply them.
          </span>
        </div>
      )}

      <Card className="border border-gray-200 overflow-hidden">
        <div className="overflow-x-auto">
          <table className="min-w-full divide-y divide-gray-200">
            <thead className="bg-gray-50">
              <tr>
                <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider sticky left-0 bg-gray-50 z-10">
                  Permission
                </th>
                {roles.map(role => (
                  <th key={role.id} scope="col" className="px-6 py-3 text-center text-xs font-medium text-gray-500 uppercase tracking-wider">
                    {role.name}
                    {role.isSystem && (
                      <div className="text-xs font-normal text-gray-400 normal-case">System Role</div>
                    )}
                  </th>
                ))}
              </tr>
            </thead>
            <tbody className="bg-white divide-y divide-gray-200">
              {Object.entries(permissionsByCategory).map(([category, categoryPermissions]) => (
                <React.Fragment key={category}>
                  {/* Category header */}
                  <tr className="bg-gray-50">
                    <td className="px-6 py-3 text-left text-xs font-medium text-gray-700 uppercase tracking-wider sticky left-0 bg-gray-50 z-10">
                      <div className="flex items-center">
                        <span className="capitalize">{category}</span>
                        <Info size={14} className="ml-1 text-gray-400" />
                      </div>
                    </td>
                    {roles.map(role => (
                      <td key={role.id} className="px-6 py-3 text-center">
                        <label className="inline-flex items-center cursor-pointer">
                          <input
                            type="checkbox"
                            className="form-checkbox h-5 w-5 text-primary-600 rounded"
                            checked={isCategoryFullyEnabled(role.id, category)}
                            ref={input => {
                              if (input) {
                                input.indeterminate = isCategoryPartiallyEnabled(role.id, category);
                              }
                            }}
                            onChange={(e) => toggleCategoryPermissions(role.id, category, e.target.checked)}
                            disabled={role.isSystem}
                          />
                        </label>
                      </td>
                    ))}
                  </tr>

                  {/* Individual permissions */}
                  {categoryPermissions.map(permission => (
                    <tr key={permission} className="hover:bg-gray-50">
                      <td className="px-6 py-2 text-sm text-gray-900 sticky left-0 bg-white z-10 hover:bg-gray-50">
                        <div className="pl-4">
                          {permission.split(':')[1]}
                        </div>
                      </td>
                      {roles.map(role => (
                        <td key={`${role.id}-${permission}`} className="px-6 py-2 text-center">
                          <label className="inline-flex items-center cursor-pointer">
                            <input
                              type="checkbox"
                              className="form-checkbox h-5 w-5 text-primary-600 rounded"
                              checked={(rolePermissions[role.id] || []).includes(permission)}
                              onChange={() => togglePermission(role.id, permission)}
                              disabled={role.isSystem}
                            />
                          </label>
                        </td>
                      ))}
                    </tr>
                  ))}
                </React.Fragment>
              ))}
            </tbody>
          </table>
        </div>
      </Card>

      <div className="mt-4 text-sm text-gray-500 flex items-center">
        <Info size={14} className="mr-1" />
        <span>System roles cannot be modified for security reasons.</span>
      </div>
    </Section>
  );
};

export default PermissionMatrix;
