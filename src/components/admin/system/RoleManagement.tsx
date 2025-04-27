'use client';

import React, { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { Shield, Plus, Edit, Trash2, Save, X, AlertCircle } from 'lucide-react';
import Button from '@/components/ui/Button';
import Card from '@/components/ui/Card';
import Input from '@/components/ui/Input';
import { useToast } from '@/lib/context/ToastContext';
import { useActivity } from '@/lib/context/ActivityContext';
import Section from '@/components/admin/layouts/Section';
import { Role } from '@/lib/rbac/types';

const RoleManagement: React.FC = () => {
  const { showToast } = useToast();
  const { addActivity } = useActivity();

  const [roles, setRoles] = useState<Role[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [editingRole, setEditingRole] = useState<Role | null>(null);
  const [isCreating, setIsCreating] = useState(false);
  const [newRole, setNewRole] = useState<Partial<Role>>({
    name: '',
    description: '',
    permissions: []
  });
  const [csrfToken, setCsrfToken] = useState('');

  // Fetch CSRF token
  useEffect(() => {
    const fetchCsrfToken = async () => {
      try {
        console.log('RoleManagement: Fetching CSRF token...');
        const response = await fetch('/api/auth/csrf');
        if (!response.ok) {
          throw new Error(`Failed to fetch CSRF token: ${response.status}`);
        }
        const data = await response.json();
        console.log('RoleManagement: CSRF token fetched successfully');
        setCsrfToken(data.csrfToken);
      } catch (error) {
        console.error('Error fetching CSRF token:', error);
      }
    };

    fetchCsrfToken();
  }, []);

  // Fetch roles
  useEffect(() => {
    const fetchRoles = async () => {
      try {
        console.log('RoleManagement: Fetching roles...');
        setIsLoading(true);
        const response = await fetch('/api/admin/roles');

        if (!response.ok) {
          throw new Error(`Failed to fetch roles: ${response.status}`);
        }

        const data = await response.json();
        console.log('RoleManagement: Roles fetched successfully:', data.roles?.length || 0, 'roles');

        if (!data.roles || !Array.isArray(data.roles)) {
          console.warn('RoleManagement: Invalid roles data, using defaults');
          // Import predefined roles
          const { PREDEFINED_ROLES } = await import('@/lib/rbac/types');
          setRoles(PREDEFINED_ROLES);
        } else {
          setRoles(data.roles);
        }
      } catch (error) {
        console.error('Error fetching roles:', error);
        showToast('Failed to load roles', 'error');

        // Use default roles if API fails
        try {
          console.log('RoleManagement: Using default roles');
          const { PREDEFINED_ROLES } = await import('@/lib/rbac/types');
          setRoles(PREDEFINED_ROLES);
        } catch (importError) {
          console.error('Error importing default roles:', importError);
        }
      } finally {
        setIsLoading(false);
      }
    };

    fetchRoles();
  }, [showToast]);

  const handleCreateRole = async () => {
    if (!newRole.name || !newRole.description) {
      showToast('Name and description are required', 'error');
      return;
    }

    try {
      const response = await fetch('/api/admin/roles', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          ...newRole,
          csrfToken
        }),
      });

      if (!response.ok) {
        const data = await response.json();
        throw new Error(data.error || 'Failed to create role');
      }

      const data = await response.json();

      // Update local state
      setRoles([...roles, data.role]);

      // Reset form
      setNewRole({
        name: '',
        description: '',
        permissions: []
      });
      setIsCreating(false);

      // Log activity
      addActivity({
        type: 'system',
        action: 'create',
        description: `Created new role: ${data.role.name}`,
        targetId: data.role.id,
        targetName: data.role.name,
        metadata: { role: data.role }
      });

      showToast('Role created successfully', 'success');
    } catch (error) {
      console.error('Error creating role:', error);
      showToast(error instanceof Error ? error.message : 'Failed to create role', 'error');
    }
  };

  const handleUpdateRole = async () => {
    if (!editingRole || !editingRole.name || !editingRole.description) {
      showToast('Name and description are required', 'error');
      return;
    }

    try {
      const response = await fetch(`/api/admin/roles/${editingRole.id}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          name: editingRole.name,
          description: editingRole.description,
          csrfToken
        }),
      });

      if (!response.ok) {
        const data = await response.json();
        throw new Error(data.error || 'Failed to update role');
      }

      // Update local state
      setRoles(roles.map(role =>
        role.id === editingRole.id ? editingRole : role
      ));

      // Reset editing state
      setEditingRole(null);

      // Log activity
      addActivity({
        type: 'system',
        action: 'update',
        description: `Updated role: ${editingRole.name}`,
        targetId: editingRole.id,
        targetName: editingRole.name,
        metadata: { role: editingRole }
      });

      showToast('Role updated successfully', 'success');
    } catch (error) {
      console.error('Error updating role:', error);
      showToast(error instanceof Error ? error.message : 'Failed to update role', 'error');
    }
  };

  const handleDeleteRole = async (roleId: string) => {
    if (!window.confirm('Are you sure you want to delete this role? This action cannot be undone.')) {
      return;
    }

    try {
      const response = await fetch(`/api/admin/roles/${roleId}`, {
        method: 'DELETE',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ csrfToken }),
      });

      if (!response.ok) {
        const data = await response.json();
        throw new Error(data.error || 'Failed to delete role');
      }

      // Update local state
      const deletedRole = roles.find(role => role.id === roleId);
      setRoles(roles.filter(role => role.id !== roleId));

      // Log activity
      if (deletedRole) {
        addActivity({
          type: 'system',
          action: 'delete',
          description: `Deleted role: ${deletedRole.name}`,
          targetId: deletedRole.id,
          targetName: deletedRole.name,
          metadata: { role: deletedRole }
        });
      }

      showToast('Role deleted successfully', 'success');
    } catch (error) {
      console.error('Error deleting role:', error);
      showToast(error instanceof Error ? error.message : 'Failed to delete role', 'error');
    }
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
      title="Role Management"
      description="Create and manage user roles"
      actions={
        !isCreating && !editingRole ? (
          <Button
            variant="primary"
            size="sm"
            icon={<Plus size={16} />}
            onClick={() => setIsCreating(true)}
          >
            Add Role
          </Button>
        ) : null
      }
    >
      {/* Create Role Form */}
      {isCreating && (
        <motion.div
          initial={{ opacity: 0, y: -20 }}
          animate={{ opacity: 1, y: 0 }}
          className="mb-6"
        >
          <Card className="border border-primary-100 bg-primary-50">
            <div className="p-4">
              <div className="flex justify-between items-center mb-4">
                <h3 className="text-lg font-medium text-gray-900">Create New Role</h3>
                <Button
                  variant="ghost"
                  size="sm"
                  icon={<X size={16} />}
                  onClick={() => setIsCreating(false)}
                  ariaLabel="Cancel"
                />
              </div>

              <div className="space-y-4">
                <Input
                  label="Role Name"
                  value={newRole.name || ''}
                  onChange={(e) => setNewRole({ ...newRole, name: e.target.value })}
                  placeholder="e.g., Editor, Manager"
                  required
                />

                <Input
                  label="Description"
                  value={newRole.description || ''}
                  onChange={(e) => setNewRole({ ...newRole, description: e.target.value })}
                  placeholder="Describe the role's responsibilities"
                  required
                />

                <div className="flex justify-end space-x-2 mt-4">
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => setIsCreating(false)}
                  >
                    Cancel
                  </Button>
                  <Button
                    variant="primary"
                    size="sm"
                    icon={<Save size={16} />}
                    onClick={handleCreateRole}
                  >
                    Create Role
                  </Button>
                </div>
              </div>
            </div>
          </Card>
        </motion.div>
      )}

      {/* Edit Role Form */}
      {editingRole && (
        <motion.div
          initial={{ opacity: 0, y: -20 }}
          animate={{ opacity: 1, y: 0 }}
          className="mb-6"
        >
          <Card className="border border-primary-100 bg-primary-50">
            <div className="p-4">
              <div className="flex justify-between items-center mb-4">
                <h3 className="text-lg font-medium text-gray-900">Edit Role</h3>
                <Button
                  variant="ghost"
                  size="sm"
                  icon={<X size={16} />}
                  onClick={() => setEditingRole(null)}
                  ariaLabel="Cancel"
                />
              </div>

              <div className="space-y-4">
                <Input
                  label="Role Name"
                  value={editingRole.name}
                  onChange={(e) => setEditingRole({ ...editingRole, name: e.target.value })}
                  placeholder="e.g., Editor, Manager"
                  required
                  disabled={editingRole.isSystem}
                  helperText={editingRole.isSystem ? "System roles cannot be renamed" : ""}
                />

                <Input
                  label="Description"
                  value={editingRole.description}
                  onChange={(e) => setEditingRole({ ...editingRole, description: e.target.value })}
                  placeholder="Describe the role's responsibilities"
                  required
                />

                <div className="flex justify-end space-x-2 mt-4">
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => setEditingRole(null)}
                  >
                    Cancel
                  </Button>
                  <Button
                    variant="primary"
                    size="sm"
                    icon={<Save size={16} />}
                    onClick={handleUpdateRole}
                  >
                    Save Changes
                  </Button>
                </div>
              </div>
            </div>
          </Card>
        </motion.div>
      )}

      {/* Roles List */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        {roles.map((role) => (
          <Card key={role.id} className="border border-gray-200">
            <div className="p-4">
              <div className="flex items-start justify-between">
                <div className="flex items-center">
                  <div className="flex-shrink-0 h-10 w-10 bg-primary-100 rounded-full flex items-center justify-center">
                    <Shield className="h-5 w-5 text-primary-600" />
                  </div>
                  <div className="ml-4">
                    <h3 className="text-lg font-medium text-gray-900">{role.name}</h3>
                    <p className="text-sm text-gray-500">{role.description}</p>
                  </div>
                </div>

                {!role.isSystem && (
                  <div className="flex space-x-2">
                    <button
                      className="text-indigo-600 hover:text-indigo-900"
                      onClick={() => setEditingRole(role)}
                      title="Edit Role"
                    >
                      <Edit size={18} />
                    </button>
                    <button
                      className="text-red-600 hover:text-red-900"
                      onClick={() => handleDeleteRole(role.id)}
                      title="Delete Role"
                    >
                      <Trash2 size={18} />
                    </button>
                  </div>
                )}

                {role.isSystem && (
                  <div className="flex items-center text-gray-500">
                    <AlertCircle size={16} className="mr-1" />
                    <span className="text-xs">System Role</span>
                  </div>
                )}
              </div>

              <div className="mt-4">
                <div className="text-xs font-medium text-gray-500 uppercase tracking-wider mb-2">
                  Permissions
                </div>
                <div className="flex flex-wrap gap-1">
                  {role.permissions.slice(0, 5).map((permission, index) => (
                    <span key={index} className="px-2 py-1 text-xs rounded-full bg-gray-100 text-gray-800">
                      {permission}
                    </span>
                  ))}
                  {role.permissions.length > 5 && (
                    <span className="px-2 py-1 text-xs rounded-full bg-gray-100 text-gray-800">
                      +{role.permissions.length - 5} more
                    </span>
                  )}
                </div>
              </div>
            </div>
          </Card>
        ))}
      </div>
    </Section>
  );
};

export default RoleManagement;
