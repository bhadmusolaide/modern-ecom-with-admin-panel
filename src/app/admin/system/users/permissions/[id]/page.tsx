'use client';

import React, { useState, useEffect, use } from 'react';
import { useRouter } from 'next/navigation';
import { motion } from 'framer-motion';
import {
  ArrowLeft, Save, AlertCircle, Info,
  Check, X, User, Shield
} from 'lucide-react';
import Button from '@/components/ui/Button';
import { useFirebaseAuth } from '@/lib/firebase/auth/FirebaseAuthProvider';
import { useToast } from '@/lib/context/ToastContext';
import { useActivity } from '@/lib/context/ActivityContext';
import { withAdminPage } from '@/lib/auth/withAdminPage';
import PageHeader from '@/components/admin/PageHeader';
import Container from '@/components/admin/layouts/Container';
import Section from '@/components/admin/layouts/Section';
import Card from '@/components/ui/Card';
import PermissionGuard from '@/components/admin/PermissionGuard';
import { getAllPermissionsByCategory } from '@/lib/rbac/permissions';

interface UserData {
  id: string;
  name: string | null;
  email: string;
  role: string;
  permissions: string[];
  emailVerified: boolean;
}

function UserPermissionsPage(props: { params: Promise<{ id: string }> }) {
  const { id } = use(props.params);
  const { user, isLoading, isAdmin } = useFirebaseAuth();
  const router = useRouter();
  const { showToast } = useToast();
  const { addActivity } = useActivity();

  const [userData, setUserData] = useState<UserData | null>(null);
  const [permissions, setPermissions] = useState<string[]>([]);
  const [permissionsByCategory, setPermissionsByCategory] = useState<Record<string, string[]>>({});
  const [selectedPermissions, setSelectedPermissions] = useState<string[]>([]);
  const [isLoadingUser, setIsLoadingUser] = useState(true);
  const [isSaving, setIsSaving] = useState(false);
  const [hasChanges, setHasChanges] = useState(false);
  const [csrfToken, setCsrfToken] = useState('');

  // Fetch CSRF token
  useEffect(() => {
    const fetchCsrfToken = async () => {
      try {
        const response = await fetch('/api/auth/csrf');
        const data = await response.json();
        setCsrfToken(data.csrfToken);
      } catch (error) {
        console.error('Error fetching CSRF token:', error);
      }
    };

    fetchCsrfToken();
  }, []);

  // Fetch user data and permissions
  useEffect(() => {
    const fetchUserData = async () => {
      try {
        setIsLoadingUser(true);

        // Fetch user permissions
        const response = await fetch(`/api/admin/users/${id}/permissions`);

        if (!response.ok) {
          const errorText = await response.text();
          console.error('Error response:', errorText);
          throw new Error(errorText || 'Failed to fetch user permissions');
        }

        const data = await response.json();
        console.log('User permissions data:', data);

        if (data.user) {
          setUserData(data.user);
        } else {
          // Fallback to fetching basic user data if not included in permissions response
          const userResponse = await fetch(`/api/admin/users/${id}`);

          if (!userResponse.ok) {
            throw new Error('Failed to fetch user data');
          }

          const userData = await userResponse.json();
          setUserData(userData.user);
        }

        // Set permissions from the response
        setSelectedPermissions(data.permissions || []);
      } catch (error) {
        console.error('Error fetching user data:', error);
        showToast('Failed to load user data', 'error');
        router.push('/admin/system/users');
      } finally {
        setIsLoadingUser(false);
      }
    };

    // Fetch all available permissions
    const fetchPermissions = async () => {
      try {
        const response = await fetch('/api/admin/permissions');

        if (!response.ok) {
          const errorText = await response.text();
          console.error('Error response:', errorText);
          throw new Error(errorText || 'Failed to fetch permissions');
        }

        const data = await response.json();
        console.log('Available permissions:', data.permissions);
        setPermissions(data.permissions);

        // Group permissions by category
        const grouped = data.permissions.reduce((acc: Record<string, string[]>, permission: string) => {
          const category = permission.split(':')[0];
          if (!acc[category]) {
            acc[category] = [];
          }
          acc[category].push(permission);
          return acc;
        }, {});
        setPermissionsByCategory(grouped);
      } catch (error) {
        console.error('Error fetching permissions:', error);
        showToast('Failed to load permissions', 'error');
      }
    };

    if (!isLoading && isAdmin) {
      fetchUserData();
      fetchPermissions();
    }
  }, [isLoading, isAdmin, id, showToast]);

  // Check for changes
  useEffect(() => {
    if (!userData) return;

    const originalPermissions = userData.permissions || [];
    const currentPermissions = selectedPermissions;

    // Check if arrays have different lengths
    if (originalPermissions.length !== currentPermissions.length) {
      setHasChanges(true);
      return;
    }

    // Check if arrays have different contents
    const sortedOriginal = [...originalPermissions].sort();
    const sortedCurrent = [...currentPermissions].sort();
    for (let i = 0; i < sortedOriginal.length; i++) {
      if (sortedOriginal[i] !== sortedCurrent[i]) {
        setHasChanges(true);
        return;
      }
    }

    setHasChanges(false);
  }, [userData, selectedPermissions]);

  // Toggle permission
  const togglePermission = (permission: string) => {
    setSelectedPermissions(prev => {
      if (prev.includes(permission)) {
        return prev.filter(p => p !== permission);
      } else {
        return [...prev, permission];
      }
    });
  };

  // Toggle all permissions in a category
  const toggleCategoryPermissions = (category: string, enabled: boolean) => {
    const categoryPermissions = permissionsByCategory[category] || [];

    setSelectedPermissions(prev => {
      if (enabled) {
        // Add all permissions in the category
        const newPermissions = [...prev];
        categoryPermissions.forEach(permission => {
          if (!newPermissions.includes(permission)) {
            newPermissions.push(permission);
          }
        });
        return newPermissions;
      } else {
        // Remove all permissions in the category
        return prev.filter(p => !categoryPermissions.includes(p));
      }
    });
  };

  // Save permissions
  const savePermissions = async () => {
    if (!hasChanges || !userData) return;

    try {
      setIsSaving(true);

      const response = await fetch(`/api/admin/users/${id}/permissions`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          permissions: selectedPermissions,
          csrfToken
        }),
      });

      if (!response.ok) {
        const data = await response.json();
        throw new Error(data.error || 'Failed to update permissions');
      }

      // Log activity
      addActivity({
        type: 'user',
        action: 'update',
        description: `Updated permissions for user: ${userData.name || userData.email}`,
        targetId: userData.id,
        targetName: userData.name || userData.email,
        metadata: {
          previousPermissions: userData.permissions || [],
          newPermissions: selectedPermissions
        }
      });

      // Update local state
      setUserData({
        ...userData,
        permissions: [...selectedPermissions]
      });

      setHasChanges(false);
      showToast('Permissions updated successfully', 'success');
    } catch (error) {
      console.error('Error saving permissions:', error);
      showToast(error instanceof Error ? error.message : 'Failed to save permissions', 'error');
    } finally {
      setIsSaving(false);
    }
  };

  // Check if all permissions in a category are enabled
  const isCategoryFullyEnabled = (category: string) => {
    const categoryPermissions = permissionsByCategory[category] || [];
    return categoryPermissions.every(permission => selectedPermissions.includes(permission));
  };

  // Check if some permissions in a category are enabled
  const isCategoryPartiallyEnabled = (category: string) => {
    const categoryPermissions = permissionsByCategory[category] || [];
    return categoryPermissions.some(permission => selectedPermissions.includes(permission)) &&
           !categoryPermissions.every(permission => selectedPermissions.includes(permission));
  };

  if (isLoading || isLoadingUser || !userData) {
    return (
      <Container>
        <div className="flex justify-center items-center h-64">
          <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-primary-600"></div>
        </div>
      </Container>
    );
  }

  return (
    <PermissionGuard permissions={['users:edit']}>
      <Container>
        <PageHeader
          title={`User Permissions: ${userData.name || userData.email}`}
          description="Manage individual user permissions"
          showBreadcrumbs={true}
          breadcrumbs={[
            { label: 'Dashboard', href: '/admin' },
            { label: 'System', href: '/admin/system' },
            { label: 'Users', href: '/admin/system/users' },
            { label: 'Permissions', href: `/admin/system/users/permissions/${id}` }
          ]}
          actions={[
            {
              label: 'Back to Users',
              icon: <ArrowLeft size={16} />,
              onClick: () => router.push('/admin/system/users'),
              variant: 'outline'
            },
            {
              label: 'Save Changes',
              icon: <Save size={16} />,
              onClick: savePermissions,
              variant: 'primary',
              disabled: !hasChanges || isSaving,
              isLoading: isSaving,
              loadingText: 'Saving...'
            }
          ]}
        />

        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5 }}
          className="mt-6"
        >
          {hasChanges && (
            <div className="mb-4 p-3 bg-yellow-50 border border-yellow-200 rounded-md flex items-center text-yellow-800">
              <AlertCircle size={16} className="mr-2 flex-shrink-0" />
              <span className="text-sm">
                You have unsaved changes. Click "Save Changes" to apply them.
              </span>
            </div>
          )}

          <Section>
            <div className="mb-6">
              <Card className="border border-gray-200 p-4">
                <div className="flex items-center">
                  <div className="flex-shrink-0 h-12 w-12 bg-primary-100 rounded-full flex items-center justify-center">
                    <User className="h-6 w-6 text-primary-600" />
                  </div>
                  <div className="ml-4">
                    <h3 className="text-lg font-medium text-gray-900">{userData.name || 'No name'}</h3>
                    <p className="text-sm text-gray-500">{userData.email}</p>
                  </div>
                  <div className="ml-auto">
                    <div className="flex items-center">
                      <Shield className="h-5 w-5 text-gray-400 mr-1" />
                      <span className="text-sm font-medium text-gray-700">
                        Role: {userData.role}
                      </span>
                    </div>
                  </div>
                </div>
              </Card>
            </div>

            <div className="mb-4 p-3 bg-blue-50 border border-blue-200 rounded-md flex items-center text-blue-800">
              <Info size={16} className="mr-2 flex-shrink-0" />
              <span className="text-sm">
                These permissions are specific to this user and override the default permissions from their role.
              </span>
            </div>

            <Card className="border border-gray-200 overflow-hidden">
              <div className="divide-y divide-gray-200">
                {Object.entries(permissionsByCategory).map(([category, categoryPermissions]) => (
                  <div key={category} className="p-4">
                    <div className="flex items-center mb-3">
                      <label className="inline-flex items-center cursor-pointer">
                        <input
                          type="checkbox"
                          className="form-checkbox h-5 w-5 text-primary-600 rounded"
                          checked={isCategoryFullyEnabled(category)}
                          ref={input => {
                            if (input) {
                              input.indeterminate = isCategoryPartiallyEnabled(category);
                            }
                          }}
                          onChange={(e) => toggleCategoryPermissions(category, e.target.checked)}
                        />
                        <span className="ml-2 text-base font-medium text-gray-700 capitalize">
                          {category}
                        </span>
                      </label>
                    </div>

                    <div className="ml-6 grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-2">
                      {categoryPermissions.map(permission => (
                        <label key={permission} className="inline-flex items-center cursor-pointer">
                          <input
                            type="checkbox"
                            className="form-checkbox h-4 w-4 text-primary-600 rounded"
                            checked={selectedPermissions.includes(permission)}
                            onChange={() => togglePermission(permission)}
                          />
                          <span className="ml-2 text-sm text-gray-700">
                            {permission.split(':')[1]}
                          </span>
                        </label>
                      ))}
                    </div>
                  </div>
                ))}
              </div>
            </Card>
          </Section>
        </motion.div>
      </Container>
    </PermissionGuard>
  );
}

export default withAdminPage(UserPermissionsPage);
