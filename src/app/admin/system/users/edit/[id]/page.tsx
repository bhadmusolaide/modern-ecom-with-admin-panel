'use client';

import React, { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { motion } from 'framer-motion';
import { Save, ArrowLeft, User, Mail, Shield } from 'lucide-react';
import Button from '@/components/ui/Button';
import { useFirebaseAuth } from '@/lib/firebase/auth/FirebaseAuthProvider';
import { useToast } from '@/lib/context/ToastContext';
import { useActivity } from '@/lib/context/ActivityContext';
import { withAdminPage } from '@/lib/auth/withAdminPage';
import PageHeader from '@/components/admin/PageHeader';
import PermissionGuard from '@/components/admin/PermissionGuard';

interface UserData {
  id: string;
  name: string | null;
  email: string;
  role: 'ADMIN' | 'CUSTOMER';
  emailVerified: boolean;
  createdAt: string;
  lastLoginAt: string | null;
  permissions?: string[];
}

// Wrapper component to handle params
function ParamsWrapper(props: { params: Promise<{ id: string }> }) {
  const { id } = React.use(props.params);
  return <SystemEditUserPage id={id} />;
}

function SystemEditUserPage({ id }: { id: string }) {
  const { user, isLoading, isAdmin } = useFirebaseAuth();
  const router = useRouter();
  const { showToast } = useToast();
  const { addActivity } = useActivity();

  const [userData, setUserData] = useState<UserData | null>(null);
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [role, setRole] = useState<'ADMIN' | 'CUSTOMER'>('CUSTOMER');
  const [emailVerified, setEmailVerified] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isLoadingUser, setIsLoadingUser] = useState(true);
  const [csrfToken, setCsrfToken] = useState('');

  useEffect(() => {
    // In development mode, bypass authentication checks
    // Use the unified auth layer which already handles development mode
// // Use the unified auth layer which already handles development mode
const isDevelopment = process.env.NODE_ENV === 'development';

    if (isDevelopment) {
      fetchUser();
      fetchCsrfToken();
      return;
    }

    // In production, check authentication
    if (!isLoading) {
      if (!user) {
        router.push('/auth/login');
      } else if (!isAdmin) {
        router.push('/admin');
        showToast('You do not have permission to access this page', 'error');
      } else {
        fetchUser();
        fetchCsrfToken();
      }
    }
  }, [user, isLoading, isAdmin, router, showToast, id]);

  const fetchCsrfToken = async () => {
    try {
      const response = await fetch('/api/auth/csrf');
      const data = await response.json();
      setCsrfToken(data.csrfToken);
    } catch (error) {
      console.error('Error fetching CSRF token:', error);
      showToast('Failed to initialize security token', 'error');
    }
  };

  const fetchUser = async () => {
    setIsLoadingUser(true);
    try {
      console.log(`Fetching user data for ID: ${id}`);

      // Special handling for dev-admin-user
      if (id === 'dev-admin-user') {
        console.log('Using mock data for dev-admin-user');
        // Set mock data for dev-admin-user
        setUserData({
          id: 'dev-admin-user',
          name: 'Development Admin',
          email: 'dev-admin@example.com',
          role: 'ADMIN',
          emailVerified: true,
          permissions: ['*']
        });
        setName('Development Admin');
        setEmail('dev-admin@example.com');
        setRole('ADMIN');
        setEmailVerified(true);
        setIsLoadingUser(false);
        return;
      }

      // Get token directly from Firebase user
      let token = '';
      if (user) {
        try {
          token = await user.getIdToken(true);
          console.log('Got fresh token for API request');
        } catch (tokenError) {
          console.error('Error getting token:', tokenError);
        }
      }

      // Add authentication token to the request
      const response = await fetch(`/api/admin/users/${id}`, {
        headers: {
          'Authorization': token ? `Bearer ${token}` : ''
        }
      });

      // Handle non-OK responses
      if (!response.ok) {
        let errorMessage = `Failed to fetch user (Status: ${response.status})`;

        try {
          // Try to parse error as JSON
          const errorData = await response.json();
          errorMessage = errorData.error || errorMessage;
        } catch (parseError) {
          // If JSON parsing fails, try to get text
          try {
            const errorText = await response.text();
            errorMessage = errorText || errorMessage;
          } catch (textError) {
            // If all else fails, use the status text
            errorMessage = response.statusText || errorMessage;
          }
        }

        console.error('Error response:', errorMessage);
        throw new Error(errorMessage);
      }

      // Parse the JSON response
      let data;
      try {
        data = await response.json();
      } catch (parseError) {
        console.error('Error parsing response JSON:', parseError);
        throw new Error('Invalid response format from server');
      }

      // Validate the response data
      if (!data.user) {
        console.error('Invalid response format:', data);
        throw new Error('Invalid response format from server');
      }

      console.log('User data fetched successfully:', data.user);
      setUserData(data.user);
      setName(data.user.name || '');
      setEmail(data.user.email);
      setRole(data.user.role);
      setEmailVerified(data.user.emailVerified);
    } catch (error) {
      console.error('Error fetching user:', error);
      showToast(error instanceof Error ? error.message : 'Failed to load user data', 'error');

      // Don't immediately redirect - give the user a chance to see the error
      setTimeout(() => {
        router.push('/admin/system/users');
      }, 3000);
    } finally {
      setIsLoadingUser(false);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSubmitting(true);

    if (!csrfToken) {
      showToast('Security token missing. Please refresh the page.', 'error');
      setIsSubmitting(false);
      return;
    }

    // Special handling for dev-admin-user
    if (id === 'dev-admin-user') {
      console.log('Simulating update for dev-admin-user');

      // Update local state
      setUserData({
        id: 'dev-admin-user',
        name,
        email,
        role,
        emailVerified,
        permissions: ['*']
      });

      // Log activity
      addActivity({
        type: 'user',
        action: 'update',
        description: `Updated user: ${name || email}`,
        targetId: id,
        targetName: name || email,
        metadata: {
          previousData: userData,
          newData: { name, email, role, emailVerified }
        }
      });

      showToast('User updated successfully', 'success');
      router.push('/admin/system/users');
      setIsSubmitting(false);
      return;
    }

    try {
      // Get fresh token directly from Firebase user
      let token = '';
      if (user) {
        try {
          token = await user.getIdToken(true);
          console.log('Got fresh token for API request');
        } catch (tokenError) {
          console.error('Error getting token:', tokenError);
        }
      }

      const response = await fetch(`/api/admin/users/${id}`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': token ? `Bearer ${token}` : ''
        },
        body: JSON.stringify({
          name,
          email,
          role,
          emailVerified,
          csrfToken,
        }),
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || 'Failed to update user');
      }

      // Log activity
      addActivity({
        type: 'user',
        action: 'update',
        description: `Updated user: ${name || email}`,
        targetId: id,
        targetName: name || email,
        metadata: {
          previousData: userData,
          newData: { name, email, role, emailVerified }
        }
      });

      showToast('User updated successfully', 'success');
      router.push('/admin/system/users');
    } catch (error) {
      showToast(error instanceof Error ? error.message : 'Failed to update user', 'error');
    } finally {
      setIsSubmitting(false);
    }
  };

  // In development mode, bypass authentication checks
  // Use the unified auth layer which already handles development mode
// // Use the unified auth layer which already handles development mode
const isDevelopment = process.env.NODE_ENV === 'development';

  if (!isDevelopment && (isLoading || isLoadingUser)) {
    return (
      <div className="container mx-auto py-12 px-4">
        <div className="flex justify-center items-center h-64">
          <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-primary-600"></div>
        </div>
      </div>
    );
  }

  if (!userData) {
    return (
      <div className="container mx-auto py-12 px-4">
        <div className="text-center">
          <h2 className="text-2xl font-bold text-gray-900">User not found</h2>
          <p className="mt-2 text-gray-600">The user you are looking for does not exist or you do not have permission to view it.</p>
          <Button
            variant="primary"
            size="md"
            className="mt-4"
            onClick={() => router.push('/admin/system/users')}
          >
            Back to Users
          </Button>
        </div>
      </div>
    );
  }

  // In development mode, don't use PermissionGuard
  if (isDevelopment) {
    return (
      <div className="container mx-auto py-12 px-4">
        <PageHeader
          title="Edit User"
          description="Update user information and settings"
          showBreadcrumbs={true}
          breadcrumbs={[
            { label: 'Dashboard', href: '/admin' },
            { label: 'System', href: '/admin/system' },
            { label: 'Users', href: '/admin/system/users' },
            { label: 'Edit User', href: `/admin/system/users/edit/${id}` }
          ]}
        />

        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5 }}
          className="max-w-4xl mx-auto mt-6"
        >
          <div className="mb-6">
            <Button
              variant="outline"
              size="sm"
              icon={<ArrowLeft size={16} />}
              iconPosition="left"
              onClick={() => router.push('/admin/system/users')}
            >
              Back to Users
            </Button>
          </div>

          <div className="bg-white rounded-xl shadow-lg overflow-hidden">
            <div className="bg-gradient-to-r from-primary-600 to-primary-800 px-6 py-8 text-white">
              <h1 className="text-3xl font-bold">Edit User</h1>
              <p className="mt-2">Update user information and settings</p>
            </div>

            <div className="p-6">
              <form onSubmit={handleSubmit}>
                <div className="space-y-6">
                  <div className="grid grid-cols-1 gap-6 sm:grid-cols-2">
                    <div>
                      <label htmlFor="name" className="block text-sm font-medium text-gray-700">
                        <User size={16} className="inline mr-1" /> Full Name
                      </label>
                      <input
                        type="text"
                        id="name"
                        value={name}
                        onChange={(e) => setName(e.target.value)}
                        className="input mt-1"
                      />
                    </div>

                    <div>
                      <label htmlFor="email" className="block text-sm font-medium text-gray-700">
                        <Mail size={16} className="inline mr-1" /> Email Address
                      </label>
                      <input
                        type="email"
                        id="email"
                        value={email}
                        onChange={(e) => setEmail(e.target.value)}
                        className="input mt-1"
                        required
                      />
                    </div>
                  </div>

                  <div className="grid grid-cols-1 gap-6 sm:grid-cols-2">
                    <div>
                      <label htmlFor="role" className="block text-sm font-medium text-gray-700">
                        <Shield size={16} className="inline mr-1" /> Role
                      </label>
                      <select
                        id="role"
                        value={role}
                        onChange={(e) => setRole(e.target.value as 'ADMIN' | 'CUSTOMER')}
                        className="input mt-1"
                        disabled={id === user?.id} // Prevent changing own role
                      >
                        <option value="CUSTOMER">Customer</option>
                        <option value="ADMIN">Admin</option>
                      </select>
                      {id === user?.id && (
                        <p className="mt-1 text-xs text-gray-500">You cannot change your own role.</p>
                      )}
                    </div>

                    <div>
                      <label className="block text-sm font-medium text-gray-700">Email Verification</label>
                      <div className="mt-2">
                        <div className="flex items-center">
                          <input
                            id="email-verified"
                            type="checkbox"
                            checked={emailVerified}
                            onChange={(e) => setEmailVerified(e.target.checked)}
                            className="h-4 w-4 text-primary-600 focus:ring-primary-500 border-gray-300 rounded"
                          />
                          <label htmlFor="email-verified" className="ml-2 block text-sm text-gray-900">
                            Email verified
                          </label>
                        </div>
                      </div>
                    </div>
                  </div>

                  <div className="flex justify-between">
                    <Button
                      type="button"
                      variant="outline"
                      size="md"
                      onClick={() => router.push(`/admin/system/users/permissions/${id}`)}
                    >
                      Manage Permissions
                    </Button>

                    <Button
                      type="submit"
                      variant="primary"
                      size="md"
                      icon={<Save size={16} />}
                      iconPosition="left"
                      isLoading={isSubmitting}
                    >
                      Save Changes
                    </Button>
                  </div>
                </div>
              </form>
            </div>
          </div>
        </motion.div>
      </div>
    );
  }

  // In production, use PermissionGuard
  return (
    <PermissionGuard permissions={['users:edit']}>
      <div className="container mx-auto py-12 px-4">
        <PageHeader
          title="Edit User"
          description="Update user information and settings"
          showBreadcrumbs={true}
          breadcrumbs={[
            { label: 'Dashboard', href: '/admin' },
            { label: 'System', href: '/admin/system' },
            { label: 'Users', href: '/admin/system/users' },
            { label: 'Edit User', href: `/admin/system/users/edit/${id}` }
          ]}
        />

        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5 }}
          className="max-w-4xl mx-auto mt-6"
        >
          <div className="mb-6">
            <Button
              variant="outline"
              size="sm"
              icon={<ArrowLeft size={16} />}
              iconPosition="left"
              onClick={() => router.push('/admin/system/users')}
            >
              Back to Users
            </Button>
          </div>

          <div className="bg-white rounded-xl shadow-lg overflow-hidden">
            <div className="bg-gradient-to-r from-primary-600 to-primary-800 px-6 py-8 text-white">
              <h1 className="text-3xl font-bold">Edit User</h1>
              <p className="mt-2">Update user information and settings</p>
            </div>

            <div className="p-6">
              <form onSubmit={handleSubmit}>
                <div className="space-y-6">
                  <div className="grid grid-cols-1 gap-6 sm:grid-cols-2">
                    <div>
                      <label htmlFor="name" className="block text-sm font-medium text-gray-700">
                        <User size={16} className="inline mr-1" /> Full Name
                      </label>
                      <input
                        type="text"
                        id="name"
                        value={name}
                        onChange={(e) => setName(e.target.value)}
                        className="input mt-1"
                      />
                    </div>

                    <div>
                      <label htmlFor="email" className="block text-sm font-medium text-gray-700">
                        <Mail size={16} className="inline mr-1" /> Email Address
                      </label>
                      <input
                        type="email"
                        id="email"
                        value={email}
                        onChange={(e) => setEmail(e.target.value)}
                        className="input mt-1"
                        required
                      />
                    </div>
                  </div>

                  <div className="grid grid-cols-1 gap-6 sm:grid-cols-2">
                    <div>
                      <label htmlFor="role" className="block text-sm font-medium text-gray-700">
                        <Shield size={16} className="inline mr-1" /> Role
                      </label>
                      <select
                        id="role"
                        value={role}
                        onChange={(e) => setRole(e.target.value as 'ADMIN' | 'CUSTOMER')}
                        className="input mt-1"
                        disabled={id === user?.id} // Prevent changing own role
                      >
                        <option value="CUSTOMER">Customer</option>
                        <option value="ADMIN">Admin</option>
                      </select>
                      {id === user?.id && (
                        <p className="mt-1 text-xs text-gray-500">You cannot change your own role.</p>
                      )}
                    </div>

                    <div>
                      <label className="block text-sm font-medium text-gray-700">Email Verification</label>
                      <div className="mt-2">
                        <div className="flex items-center">
                          <input
                            id="email-verified"
                            type="checkbox"
                            checked={emailVerified}
                            onChange={(e) => setEmailVerified(e.target.checked)}
                            className="h-4 w-4 text-primary-600 focus:ring-primary-500 border-gray-300 rounded"
                          />
                          <label htmlFor="email-verified" className="ml-2 block text-sm text-gray-900">
                            Email verified
                          </label>
                        </div>
                      </div>
                    </div>
                  </div>

                  <div className="flex justify-between">
                    <Button
                      type="button"
                      variant="outline"
                      size="md"
                      onClick={() => router.push(`/admin/system/users/permissions/${id}`)}
                    >
                      Manage Permissions
                    </Button>

                    <Button
                      type="submit"
                      variant="primary"
                      size="md"
                      icon={<Save size={16} />}
                      iconPosition="left"
                      isLoading={isSubmitting}
                    >
                      Save Changes
                    </Button>
                  </div>
                </div>
              </form>
            </div>
          </div>
        </motion.div>
      </div>
    </PermissionGuard>
  );
}

// Export the wrapper component with withAdminPage HOC
export default withAdminPage(ParamsWrapper);
