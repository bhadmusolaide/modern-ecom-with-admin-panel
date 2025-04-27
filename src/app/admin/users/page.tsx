'use client';

import React, { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { motion } from 'framer-motion';
import {
  User, UserPlus, Edit, Trash2, Search,
  CheckCircle, XCircle, Shield, ShieldOff,
  ChevronLeft, ChevronRight, Filter, Lock
} from 'lucide-react';
import Button from '@/components/ui/Button';
import { useFirebaseAuth } from '@/lib/firebase/auth/FirebaseAuthProvider';
import { useToast } from '@/lib/context/ToastContext';
import { withAdminPage } from '@/lib/auth/withAdminPage';

interface UserData {
  id: string;
  name: string | null;
  email: string;
  role: 'ADMIN' | 'CUSTOMER';
  emailVerified: boolean;
  createdAt: string;
  lastLoginAt: string | null;
  isActive?: boolean;
}

function AdminUsersPage() {
  const { user, isLoading, isAdmin } = useFirebaseAuth();
  const router = useRouter();
  const { showToast } = useToast();

  const [users, setUsers] = useState<UserData[]>([]);
  const [filteredUsers, setFilteredUsers] = useState<UserData[]>([]);
  const [isLoadingUsers, setIsLoadingUsers] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [roleFilter, setRoleFilter] = useState<'ALL' | 'ADMIN' | 'CUSTOMER'>('ALL');
  const [verificationFilter, setVerificationFilter] = useState<'ALL' | 'VERIFIED' | 'UNVERIFIED'>('ALL');
  const [statusFilter, setStatusFilter] = useState<'ALL' | 'ACTIVE' | 'DISABLED'>('ALL');
  const [currentPage, setCurrentPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [csrfToken, setCsrfToken] = useState('');
  const [isDeleting, setIsDeleting] = useState(false);
  const [isChangingRole, setIsChangingRole] = useState(false);
  const [isChangingStatus, setIsChangingStatus] = useState(false);
  const usersPerPage = 10;

  useEffect(() => {
    if (!isLoading) {
      if (!user) {
        router.push('/auth/login');
      } else if (!isAdmin) {
        router.push('/account');
        showToast('You do not have permission to access this page', 'error');
      } else {
        fetchUsers();
        fetchCsrfToken();
      }
    }
  }, [user, isLoading, isAdmin, router, showToast]);

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

  const fetchUsers = async () => {
    setIsLoadingUsers(true);
    try {
      const response = await fetch('/api/admin/users');

      if (!response.ok) {
        throw new Error('Failed to fetch users');
      }

      const data = await response.json();
      setUsers(data.users);
      applyFilters(data.users, searchTerm, roleFilter, verificationFilter, statusFilter);
    } catch (error) {
      console.error('Error fetching users:', error);
      showToast('Failed to load users', 'error');
    } finally {
      setIsLoadingUsers(false);
    }
  };

  const applyFilters = (
    userList: UserData[],
    search: string,
    role: 'ALL' | 'ADMIN' | 'CUSTOMER',
    verification: 'ALL' | 'VERIFIED' | 'UNVERIFIED',
    status: 'ALL' | 'ACTIVE' | 'DISABLED'
  ) => {
    let filtered = [...userList];

    // Apply search filter
    if (search) {
      const searchLower = search.toLowerCase();
      filtered = filtered.filter(user =>
        user.name?.toLowerCase().includes(searchLower) ||
        user.email.toLowerCase().includes(searchLower)
      );
    }

    // Apply role filter
    if (role !== 'ALL') {
      filtered = filtered.filter(user => user.role === role);
    }

    // Apply verification filter
    if (verification !== 'ALL') {
      filtered = filtered.filter(user =>
        verification === 'VERIFIED' ? user.emailVerified : !user.emailVerified
      );
    }

    // Apply status filter
    if (status !== 'ALL') {
      filtered = filtered.filter(user =>
        status === 'ACTIVE' ? user.isActive !== false : user.isActive === false
      );
    }

    setFilteredUsers(filtered);
    setTotalPages(Math.ceil(filtered.length / usersPerPage));
    setCurrentPage(1); // Reset to first page when filters change
  };

  useEffect(() => {
    applyFilters(users, searchTerm, roleFilter, verificationFilter, statusFilter);
  }, [searchTerm, roleFilter, verificationFilter, statusFilter, users]);

  const handleDeleteUser = async (userId: string) => {
    if (!csrfToken) {
      showToast('Security token missing. Please refresh the page.', 'error');
      return;
    }

    if (window.confirm('Are you sure you want to delete this user? This action cannot be undone.')) {
      setIsDeleting(true);
      try {
        const response = await fetch(`/api/admin/users/${userId}`, {
          method: 'DELETE',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ csrfToken }),
        });

        if (!response.ok) {
          const data = await response.json();
          throw new Error(data.error || 'Failed to delete user');
        }

        showToast('User deleted successfully', 'success');
        fetchUsers(); // Refresh the user list
      } catch (error) {
        showToast(error instanceof Error ? error.message : 'Failed to delete user', 'error');
      } finally {
        setIsDeleting(false);
      }
    }
  };

  const handleToggleRole = async (userId: string, currentRole: 'ADMIN' | 'CUSTOMER') => {
    if (!csrfToken) {
      showToast('Security token missing. Please refresh the page.', 'error');
      return;
    }

    const newRole = currentRole === 'ADMIN' ? 'CUSTOMER' : 'ADMIN';
    const confirmMessage = currentRole === 'ADMIN'
      ? 'Are you sure you want to remove admin privileges from this user?'
      : 'Are you sure you want to grant admin privileges to this user?';

    if (window.confirm(confirmMessage)) {
      setIsChangingRole(true);
      try {
        const response = await fetch(`/api/admin/users/${userId}/role`, {
          method: 'PUT',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ role: newRole, csrfToken }),
        });

        if (!response.ok) {
          const data = await response.json();
          throw new Error(data.error || 'Failed to update user role');
        }

        showToast(`User role updated to ${newRole.toLowerCase()}`, 'success');
        fetchUsers(); // Refresh the user list
      } catch (error) {
        showToast(error instanceof Error ? error.message : 'Failed to update user role', 'error');
      } finally {
        setIsChangingRole(false);
      }
    }
  };

  const handleToggleStatus = async (userId: string, currentStatus: boolean) => {
    if (!csrfToken) {
      showToast('Security token missing. Please refresh the page.', 'error');
      return;
    }

    const newStatus = !currentStatus;
    const confirmMessage = currentStatus
      ? 'Are you sure you want to disable this user?'
      : 'Are you sure you want to enable this user?';

    if (window.confirm(confirmMessage)) {
      setIsChangingStatus(true);
      try {
        const response = await fetch(`/api/admin/users/${userId}/status`, {
          method: 'PUT',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ isActive: newStatus, csrfToken }),
        });

        if (!response.ok) {
          const data = await response.json();
          throw new Error(data.error || 'Failed to update user status');
        }

        showToast(`User ${newStatus ? 'enabled' : 'disabled'} successfully`, 'success');
        fetchUsers(); // Refresh the user list
      } catch (error) {
        showToast(error instanceof Error ? error.message : 'Failed to update user status', 'error');
      } finally {
        setIsChangingStatus(false);
      }
    }
  };

  const getCurrentPageUsers = () => {
    const startIndex = (currentPage - 1) * usersPerPage;
    const endIndex = startIndex + usersPerPage;
    return filteredUsers.slice(startIndex, endIndex);
  };

  const formatDate = (dateString: string | null) => {
    if (!dateString) return 'Never';
    return new Date(dateString).toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
    });
  };

  if (isLoading || !isAdmin) {
    return (
      <div className="container mx-auto py-12 px-4">
        <div className="flex justify-center items-center h-64">
          <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-primary-600"></div>
        </div>
      </div>
    );
  }

  return (
    <div className="container mx-auto py-12 px-4">
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5 }}
        className="max-w-6xl mx-auto"
      >
        <div className="bg-white rounded-xl shadow-lg overflow-hidden">
          <div className="bg-gradient-to-r from-primary-600 to-primary-800 px-6 py-8 text-white">
            <h1 className="text-3xl font-bold">User Management</h1>
            <p className="mt-2">Manage user accounts and permissions</p>
          </div>

          <div className="p-6">
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

              <div className="flex gap-2">
                <div className="relative">
                  <select
                    className="input appearance-none pr-8"
                    value={roleFilter}
                    onChange={(e) => setRoleFilter(e.target.value as 'ALL' | 'ADMIN' | 'CUSTOMER')}
                  >
                    <option value="ALL">All Roles</option>
                    <option value="ADMIN">Admins</option>
                    <option value="CUSTOMER">Customers</option>
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

                <div className="relative">
                  <select
                    className="input appearance-none pr-8"
                    value={statusFilter}
                    onChange={(e) => setStatusFilter(e.target.value as 'ALL' | 'ACTIVE' | 'DISABLED')}
                  >
                    <option value="ALL">All Status</option>
                    <option value="ACTIVE">Active</option>
                    <option value="DISABLED">Disabled</option>
                  </select>
                  <div className="absolute inset-y-0 right-0 flex items-center pr-2 pointer-events-none">
                    <Filter size={16} className="text-gray-400" />
                  </div>
                </div>
              </div>

              <Button
                variant="primary"
                size="md"
                icon={<UserPlus size={16} />}
                iconPosition="left"
                onClick={() => router.push('/admin/users/create')}
              >
                Add User
              </Button>
            </div>

            {/* Users Table */}
            <div className="overflow-x-auto">
              <table className="min-w-full divide-y divide-gray-200">
                <thead className="bg-gray-50">
                  <tr>
                    <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      User
                    </th>
                    <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Status
                    </th>
                    <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Role
                    </th>
                    <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Created
                    </th>
                    <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Last Login
                    </th>
                    <th scope="col" className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Actions
                    </th>
                  </tr>
                </thead>
                <tbody className="bg-white divide-y divide-gray-200">
                  {isLoadingUsers ? (
                    <tr>
                      <td colSpan={6} className="px-6 py-4 text-center">
                        <div className="flex justify-center">
                          <div className="animate-spin rounded-full h-6 w-6 border-t-2 border-b-2 border-primary-600"></div>
                        </div>
                      </td>
                    </tr>
                  ) : getCurrentPageUsers().length === 0 ? (
                    <tr>
                      <td colSpan={6} className="px-6 py-4 text-center text-gray-500">
                        No users found
                      </td>
                    </tr>
                  ) : (
                    getCurrentPageUsers().map((user) => (
                      <tr key={user.id} className="hover:bg-gray-50">
                        <td className="px-6 py-4 whitespace-nowrap">
                          <div className="flex items-center">
                            <div className="flex-shrink-0 h-10 w-10 bg-gray-200 rounded-full flex items-center justify-center">
                              <User className="h-6 w-6 text-gray-500" />
                            </div>
                            <div className="ml-4">
                              <div className="text-sm font-medium text-gray-900">
                                {user.name || 'No Name'}
                              </div>
                              <div className="text-sm text-gray-500">{user.email}</div>
                            </div>
                          </div>
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap">
                          {user.isActive === false ? (
                            <span className="px-2 inline-flex text-xs leading-5 font-semibold rounded-full bg-red-100 text-red-800">
                              <XCircle size={16} className="mr-1" /> Disabled
                            </span>
                          ) : (
                            <span className="px-2 inline-flex text-xs leading-5 font-semibold rounded-full bg-green-100 text-green-800">
                              <CheckCircle size={16} className="mr-1" /> Active
                            </span>
                          )}
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap">
                          {user.role === 'ADMIN' ? (
                            <span className="px-2 inline-flex text-xs leading-5 font-semibold rounded-full bg-purple-100 text-purple-800">
                              <Shield size={16} className="mr-1" /> Admin
                            </span>
                          ) : (
                            <span className="px-2 inline-flex text-xs leading-5 font-semibold rounded-full bg-blue-100 text-blue-800">
                              <User size={16} className="mr-1" /> Customer
                            </span>
                          )}
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                          {formatDate(user.createdAt)}
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                          {formatDate(user.lastLoginAt)}
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-right text-sm font-medium">
                          <div className="flex justify-end space-x-2">
                            <button
                              className="text-indigo-600 hover:text-indigo-900"
                              onClick={() => router.push(`/admin/users/edit/${user.id}`)}
                              title="Edit User"
                            >
                              <Edit size={18} />
                            </button>
                            <button
                              className={`${user.role === 'ADMIN' ? 'text-orange-600 hover:text-orange-900' : 'text-purple-600 hover:text-purple-900'}`}
                              onClick={() => handleToggleRole(user.id, user.role)}
                              disabled={isChangingRole}
                              title={user.role === 'ADMIN' ? 'Remove Admin Role' : 'Make Admin'}
                            >
                              {user.role === 'ADMIN' ? <ShieldOff size={18} /> : <Shield size={18} />}
                            </button>
                            <button
                              className={`${user.isActive ? 'text-red-600 hover:text-red-900' : 'text-green-600 hover:text-green-900'}`}
                              onClick={() => handleToggleStatus(user.id, user.isActive || false)}
                              disabled={isChangingStatus}
                              title={user.isActive ? 'Disable User' : 'Enable User'}
                            >
                              {user.isActive ? <Lock size={18} /> : <CheckCircle size={18} />}
                            </button>
                            <button
                              className="text-red-600 hover:text-red-900"
                              onClick={() => handleDeleteUser(user.id)}
                              disabled={isDeleting}
                              title="Delete User"
                            >
                              <Trash2 size={18} />
                            </button>
                          </div>
                        </td>
                      </tr>
                    ))
                  )}
                </tbody>
              </table>
            </div>

            {/* Pagination */}
            {totalPages > 1 && (
              <div className="flex items-center justify-between border-t border-gray-200 px-4 py-3 sm:px-6 mt-4">
                <div className="flex-1 flex justify-between sm:hidden">
                  <button
                    onClick={() => setCurrentPage(Math.max(1, currentPage - 1))}
                    disabled={currentPage === 1}
                    className="relative inline-flex items-center px-4 py-2 border border-gray-300 text-sm font-medium rounded-md text-gray-700 bg-white hover:bg-gray-50"
                  >
                    Previous
                  </button>
                  <button
                    onClick={() => setCurrentPage(Math.min(totalPages, currentPage + 1))}
                    disabled={currentPage === totalPages}
                    className="ml-3 relative inline-flex items-center px-4 py-2 border border-gray-300 text-sm font-medium rounded-md text-gray-700 bg-white hover:bg-gray-50"
                  >
                    Next
                  </button>
                </div>
                <div className="hidden sm:flex-1 sm:flex sm:items-center sm:justify-between">
                  <div>
                    <p className="text-sm text-gray-700">
                      Showing <span className="font-medium">{(currentPage - 1) * usersPerPage + 1}</span> to{' '}
                      <span className="font-medium">
                        {Math.min(currentPage * usersPerPage, filteredUsers.length)}
                      </span>{' '}
                      of <span className="font-medium">{filteredUsers.length}</span> results
                    </p>
                  </div>
                  <div>
                    <nav className="relative z-0 inline-flex rounded-md shadow-sm -space-x-px" aria-label="Pagination">
                      <button
                        onClick={() => setCurrentPage(Math.max(1, currentPage - 1))}
                        disabled={currentPage === 1}
                        className="relative inline-flex items-center px-2 py-2 rounded-l-md border border-gray-300 bg-white text-sm font-medium text-gray-500 hover:bg-gray-50"
                      >
                        <span className="sr-only">Previous</span>
                        <ChevronLeft className="h-5 w-5" aria-hidden="true" />
                      </button>
                      {Array.from({ length: totalPages }, (_, i) => i + 1).map((page) => (
                        <button
                          key={page}
                          onClick={() => setCurrentPage(page)}
                          className={`relative inline-flex items-center px-4 py-2 border text-sm font-medium ${
                            page === currentPage
                              ? 'z-10 bg-primary-50 border-primary-500 text-primary-600'
                              : 'bg-white border-gray-300 text-gray-500 hover:bg-gray-50'
                          }`}
                        >
                          {page}
                        </button>
                      ))}
                      <button
                        onClick={() => setCurrentPage(Math.min(totalPages, currentPage + 1))}
                        disabled={currentPage === totalPages}
                        className="relative inline-flex items-center px-2 py-2 rounded-r-md border border-gray-300 bg-white text-sm font-medium text-gray-500 hover:bg-gray-50"
                      >
                        <span className="sr-only">Next</span>
                        <ChevronRight className="h-5 w-5" aria-hidden="true" />
                      </button>
                    </nav>
                  </div>
                </div>
              </div>
            )}
          </div>
        </div>
      </motion.div>
    </div>
  );
}

export default withAdminPage(AdminUsersPage);
