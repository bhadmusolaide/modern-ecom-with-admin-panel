'use client';

import React, { useState, useEffect, useCallback, use } from 'react';
import { useRouter } from 'next/navigation';
import { motion } from 'framer-motion';
import {
  User, UserPlus, Edit, Trash2, Search,
  Shield, ShieldOff, Filter, Clock,
  CheckCircle, XCircle, Settings, Lock
} from 'lucide-react';
import { safeFetch } from '@/lib/api/safeFetch';
import Button from '@/components/ui/Button';
import { useFirebaseAuth } from '@/lib/firebase/auth/FirebaseAuthProvider';
import { useToast } from '@/lib/context/ToastContext';
import { useActivity, ActivityProvider } from '@/lib/context/ActivityContext';
import PageHeader from '@/components/admin/PageHeader';
import Container from '@/components/admin/layouts/Container';
import Section from '@/components/admin/layouts/Section';
import Tabs from '@/components/ui/Tabs';
import ResponsiveTable, { Column } from '@/components/ui/ResponsiveTable';
import PermissionGuard from '@/components/admin/PermissionGuard';
import RoleManagement from '@/components/admin/system/RoleManagement';
import UserActivityLog from '@/components/admin/system/UserActivityLog';
import PermissionMatrix from '@/components/admin/system/PermissionMatrix';
import { formatDate } from '@/lib/utils';
import { withAdminPage } from '@/lib/auth/withAdminPage';

interface UserData {
  id: string;
  name: string | null;
  email: string;
  role: string;
  permissions: string[];
  emailVerified: boolean;
  createdAt: string;
  lastLoginAt: string | null;
}

function SystemUsersPage(props: { params?: Promise<any> }) {
  // If params are passed, unwrap them with use()
  if (props.params) {
    use(props.params);
  }
  const { user, isLoading, signInWithCustomToken } = useFirebaseAuth();
  const router = useRouter();
  const { showToast } = useToast();
  const { addActivity } = useActivity();

  const [users, setUsers] = useState<UserData[]>([]);
  const [filteredUsers, setFilteredUsers] = useState<UserData[]>([]);
  const [searchTerm, setSearchTerm] = useState('');
  const [roleFilter, setRoleFilter] = useState('ALL');
  const [verificationFilter, setVerificationFilter] = useState('ALL');
  const [isLoadingUsers, setIsLoadingUsers] = useState(true);
  const [isChangingRole, setIsChangingRole] = useState(false);
  const [activeTab, setActiveTab] = useState('users');
  const [csrfToken, setCsrfToken] = useState('');
  const [isLoggingInAsUser, setIsLoggingInAsUser] = useState(false);

  // Fetch CSRF token
  useEffect(() => {
    const fetchCsrfToken = async () => {
      try {
        console.log('Fetching CSRF token...');
        const data = await safeFetch('/api/auth/csrf');
        console.log('CSRF token fetched successfully');
        setCsrfToken(data.csrfToken);
      } catch (error) {
        console.error('Error fetching CSRF token:', error);
        showToast('Failed to fetch security token', 'error');
      }
    };

    if (!isLoading) {
      fetchCsrfToken();
    }
  }, [isLoading, showToast]);

  // Fetch users
  const fetchUsers = useCallback(async () => {
    try {
      console.log('Fetching users...');
      setIsLoadingUsers(true);

      const data = await safeFetch('/api/admin/users');
      console.log('Users fetched successfully:', data.users?.length || 0, 'users');
      setUsers(data.users || []);
      setFilteredUsers(data.users || []);
    } catch (error) {
      console.error('Error fetching users:', error);
      showToast('Failed to load users', 'error');
    } finally {
      setIsLoadingUsers(false);
    }
  }, [showToast]);

  useEffect(() => {
    if (!isLoading) {
      console.log('Auth loaded, fetching users');
      fetchUsers();
    }
  }, [isLoading, fetchUsers]);

  // Filter users based on search term and filters
  useEffect(() => {
    if (users.length === 0) return;

    let filtered = [...users];

    // Apply search filter
    if (searchTerm) {
      const term = searchTerm.toLowerCase();
      filtered = filtered.filter(
        user =>
          (user.name && user.name.toLowerCase().includes(term)) ||
          user.email.toLowerCase().includes(term)
      );
    }

    // Apply role filter
    if (roleFilter !== 'ALL') {
      filtered = filtered.filter(user => user.role === roleFilter);
    }

    // Apply verification filter
    if (verificationFilter !== 'ALL') {
      filtered = filtered.filter(user =>
        verificationFilter === 'VERIFIED' ? user.emailVerified : !user.emailVerified
      );
    }

    setFilteredUsers(filtered);
  }, [users, searchTerm, roleFilter, verificationFilter]);

  // Handle role change
  const handleToggleRole = async (userId: string, currentRole: string) => {
    if (isChangingRole) return;

    try {
      setIsChangingRole(true);

      // Determine new role
      const newRole = currentRole === 'ADMIN' ? 'CUSTOMER' : 'ADMIN';

      await safeFetch(`/api/admin/users/${userId}/role`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          role: newRole,
          csrfToken
        }),
      });

      // Update local state
      setUsers(prevUsers =>
        prevUsers.map(u =>
          u.id === userId ? { ...u, role: newRole } : u
        )
      );

      // Log activity
      const targetUser = users.find(u => u.id === userId);
      addActivity({
        type: 'user',
        action: 'update',
        description: `Changed ${targetUser?.name || targetUser?.email || 'user'}'s role to ${newRole}`,
        targetId: userId,
        targetName: targetUser?.name || targetUser?.email || 'Unknown user',
        metadata: { previousRole: currentRole, newRole }
      });

      showToast(`User role updated to ${newRole}`, 'success');
    } catch (error) {
      console.error('Error updating user role:', error);
      showToast(error instanceof Error ? error.message : 'Failed to update user role', 'error');
    } finally {
      setIsChangingRole(false);
    }
  };

  // Handle login as user
  const handleLoginAsUser = async (targetUser: UserData) => {
    try {
      setIsLoggingInAsUser(true);

      // Store current admin session
      const currentUser = user;
      if (!currentUser) {
        throw new Error('No current user session found');
      }

      // Call the login-as-user API
      const response = await fetch('/api/admin/login-as-user', {
        method: 'POST',
        headers: new Headers({
          'Content-Type': 'application/json',
          'x-admin-id': currentUser.id
        }),
        body: JSON.stringify({ userId: targetUser.id })
      });

      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.message || 'Failed to login as user');
      }

      const data = await response.json();

      // Sign in with the custom token using FirebaseAuthProvider
      const firebaseUser = await signInWithCustomToken(data.customToken);
      console.log('Successfully signed in as user:', firebaseUser.uid);

      // Store admin session in localStorage
      localStorage.setItem('adminSession', JSON.stringify({
        id: currentUser.id,
        email: currentUser.email,
        name: currentUser.name,
        role: currentUser.role,
        timestamp: Date.now()
      }));

      showToast(`Logged in as ${targetUser.name || targetUser.email}`, 'success');
      router.push('/');
    } catch (error) {
      console.error('Error logging in as user:', error);
      showToast(error instanceof Error ? error.message : 'Failed to login as user', 'error');
    } finally {
      setIsLoggingInAsUser(false);
    }
  };

  // Define columns for the users table
  const userColumns: Column<UserData>[] = [
    {
      header: 'User',
      accessor: 'name',
      cell: (user) => (
        <div className="flex items-center">
          <div className="flex-shrink-0 h-10 w-10 bg-primary-100 rounded-full flex items-center justify-center">
            <User className="h-5 w-5 text-primary-600" />
          </div>
          <div className="ml-4">
            <div className="text-sm font-medium text-gray-900">{user.name || 'No name'}</div>
            <div className="text-sm text-gray-500">{user.email}</div>
          </div>
        </div>
      ),
      sortable: true,
      mobileLabel: 'User'
    },
    {
      header: 'Status',
      accessor: 'emailVerified',
      cell: (user) => (
        <div className="flex items-center">
          {user.emailVerified ? (
            <span className="px-2 inline-flex text-xs leading-5 font-semibold rounded-full bg-green-100 text-green-800">
              <CheckCircle className="mr-1 h-3 w-3 mt-0.5" /> Verified
            </span>
          ) : (
            <span className="px-2 inline-flex text-xs leading-5 font-semibold rounded-full bg-yellow-100 text-yellow-800">
              <XCircle className="mr-1 h-3 w-3 mt-0.5" /> Unverified
            </span>
          )}
        </div>
      ),
      sortable: true,
      mobileLabel: 'Status'
    },
    {
      header: 'Role',
      accessor: 'role',
      cell: (user) => (
        <div className="flex items-center">
          {user.role === 'ADMIN' ? (
            <span className="px-2 inline-flex text-xs leading-5 font-semibold rounded-full bg-purple-100 text-purple-800">
              <Shield className="mr-1 h-3 w-3 mt-0.5" /> Admin
            </span>
          ) : (
            <span className="px-2 inline-flex text-xs leading-5 font-semibold rounded-full bg-blue-100 text-blue-800">
              <User className="mr-1 h-3 w-3 mt-0.5" /> Customer
            </span>
          )}
        </div>
      ),
      sortable: true,
      mobileLabel: 'Role'
    },
    {
      header: 'Created',
      accessor: 'createdAt',
      cell: (user) => (
        <div className="text-sm text-gray-500">
          {formatDate(user.createdAt)}
        </div>
      ),
      sortable: true,
      mobileLabel: 'Created'
    },
    {
      header: 'Last Login',
      accessor: 'lastLoginAt',
      cell: (user) => (
        <div className="text-sm text-gray-500">
          {user.lastLoginAt ? formatDate(user.lastLoginAt) : 'Never'}
        </div>
      ),
      sortable: true,
      mobileLabel: 'Last Login'
    },
    {
      header: 'Actions',
      accessor: 'id',
      cell: (user) => (
        <div className="flex justify-end space-x-2">
          <button
            className="text-indigo-600 hover:text-indigo-900"
            onClick={() => router.push(`/admin/system/users/edit/${user.id}`)}
            title="Edit User"
          >
            <Edit className="h-5 w-5" />
          </button>
          <button
            className={`${user.role === 'ADMIN' ? 'text-orange-600 hover:text-orange-900' : 'text-purple-600 hover:text-purple-900'}`}
            onClick={() => handleToggleRole(user.id, user.role)}
            disabled={isChangingRole}
            title={user.role === 'ADMIN' ? 'Remove Admin Role' : 'Make Admin'}
          >
            {user.role === 'ADMIN' ? (
              <ShieldOff className="h-5 w-5" />
            ) : (
              <Shield className="h-5 w-5" />
            )}
          </button>
          <button
            className="text-red-600 hover:text-red-900"
            onClick={() => router.push(`/admin/system/users/permissions/${user.id}`)}
            title="Manage Permissions"
          >
            <Lock className="h-5 w-5" />
          </button>
          <button
            className="text-green-600 hover:text-green-900"
            onClick={() => handleLoginAsUser(user)}
            title="Login as User"
          >
            <User className="h-5 w-5" />
          </button>
        </div>
      ),
      className: 'text-right',
      mobileLabel: 'Actions'
    }
  ];

  // Define tabs
  const tabs = [
    { id: 'users', label: 'Users', icon: <User size={16} /> },
    { id: 'roles', label: 'Roles', icon: <Shield size={16} /> },
    { id: 'permissions', label: 'Permissions', icon: <Lock size={16} /> },
    { id: 'activity', label: 'Activity Log', icon: <Clock size={16} /> },
  ];

  // Debug information
  useEffect(() => {
    console.log('Auth state:', { isLoading, user: user ? 'authenticated' : 'not authenticated' });
  }, [isLoading, user]);

  if (isLoading) {
    console.log('Rendering loading state...');
    return (
      <div className="container mx-auto px-4 py-8">
        <div className="flex justify-center items-center h-64">
          <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-primary-600"></div>
          <div className="ml-4">Loading authentication...</div>
        </div>
      </div>
    );
  }

  return (
    <PermissionGuard permissions={['users:view', 'roles:view']}>
      <ActivityProvider>
      <div className="container mx-auto px-4 py-8">
        <PageHeader
          title="Admin User Management"
          description="Manage admin users, roles, permissions and activity logs"
          showBreadcrumbs={true}
          breadcrumbs={[
            { label: 'Dashboard', href: '/admin' },
            { label: 'System', href: '/admin/system' },
            { label: 'Users', href: '/admin/system/users' }
          ]}
          actions={[
            {
              label: 'Add Admin User',
              icon: <UserPlus size={16} />,
              onClick: () => router.push('/admin/system/users/create'),
              variant: 'primary'
            }
          ]}
        />

        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5 }}
          className="mt-6"
        >
          <Tabs
            tabs={tabs}
            activeTab={activeTab}
            onChange={setActiveTab}
            className="mb-6"
          />

          {activeTab === 'users' && (
            <Section>
              {/* Search and Filters */}
              <div className="mb-6 flex flex-col md:flex-row gap-4">
                <div className="relative flex-grow">
                  <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                    <Search size={18} className="text-gray-400" />
                  </div>
                  <input
                    type="text"
                    placeholder="Search users..."
                    className="input pl-10"
                    value={searchTerm}
                    onChange={(e) => setSearchTerm(e.target.value)}
                  />
                </div>

                <div className="flex flex-col sm:flex-row gap-4">
                  <div className="relative">
                    <select
                      className="input appearance-none pr-8"
                      value={roleFilter}
                      onChange={(e) => setRoleFilter(e.target.value)}
                    >
                      <option value="ALL">All Roles</option>
                      <option value="ADMIN">Admin</option>
                      <option value="CUSTOMER">Customer</option>
                      <option value="EDITOR">Editor</option>
                      <option value="MANAGER">Manager</option>
                    </select>
                    <div className="absolute inset-y-0 right-0 flex items-center pr-2 pointer-events-none">
                      <Filter size={16} className="text-gray-400" />
                    </div>
                  </div>

                  <div className="relative">
                    <select
                      className="input appearance-none pr-8"
                      value={verificationFilter}
                      onChange={(e) => setVerificationFilter(e.target.value as 'ALL' | 'VERIFIED' | 'UNVERIFIED')}
                    >
                      <option value="ALL">All Users</option>
                      <option value="VERIFIED">Verified</option>
                      <option value="UNVERIFIED">Unverified</option>
                    </select>
                    <div className="absolute inset-y-0 right-0 flex items-center pr-2 pointer-events-none">
                      <Filter size={16} className="text-gray-400" />
                    </div>
                  </div>
                </div>
              </div>

              {/* Users Table */}
              <ResponsiveTable
                data={filteredUsers}
                columns={userColumns}
                keyField="id"
                isLoading={isLoadingUsers}
                emptyMessage="No users found"
                mobileCardMode={true}
              />
            </Section>
          )}

          {activeTab === 'roles' && (
            <PermissionGuard permissions="roles:view">
              <RoleManagement />
            </PermissionGuard>
          )}

          {activeTab === 'permissions' && (
            <PermissionGuard permissions="roles:edit">
              <PermissionMatrix />
            </PermissionGuard>
          )}

          {activeTab === 'activity' && (
            <PermissionGuard permissions="users:view">
              <UserActivityLog />
            </PermissionGuard>
          )}
        </motion.div>
      </div>
      </ActivityProvider>
    </PermissionGuard>
  );
}

export default withAdminPage(SystemUsersPage);
