'use client';

import React, { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { motion } from 'framer-motion';
import { Save, ArrowLeft, User, Mail, Shield } from 'lucide-react';
import Button from '@/components/ui/Button';
import { useFirebaseAuth } from '@/lib/firebase/auth/FirebaseAuthProvider';
import { useToast } from '@/lib/context/ToastContext';
import { withAdminPage } from '@/lib/auth/withAdminPage';
import PermissionGuard from '@/components/admin/PermissionGuard';

interface UserData {
  id: string;
  name: string | null;
  email: string;
  role: 'ADMIN' | 'CUSTOMER';
  emailVerified: boolean;
  createdAt: string;
  lastLoginAt: string | null;
}

function EditUserPage({ params }: { params: { id: string } }) {
  const { user, isLoading, isAdmin } = useFirebaseAuth();
  const router = useRouter();
  const { showToast } = useToast();

  const [userData, setUserData] = useState<UserData | null>(null);
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [role, setRole] = useState<'ADMIN' | 'CUSTOMER'>('CUSTOMER');
  const [emailVerified, setEmailVerified] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isLoadingUser, setIsLoadingUser] = useState(true);
  const [csrfToken, setCsrfToken] = useState('');

  useEffect(() => {
    if (!isLoading) {
      if (!user) {
        router.push('/auth/login');
      } else if (!isAdmin) {
        router.push('/account');
        showToast('You do not have permission to access this page', 'error');
      } else {
        fetchUser();
        fetchCsrfToken();
      }
    }
  }, [user, isLoading, isAdmin, router, showToast, params.id]);

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
      const response = await fetch(`/api/admin/users/${params.id}`);

      if (!response.ok) {
        throw new Error('Failed to fetch user');
      }

      const data = await response.json();
      setUserData(data.user);
      setName(data.user.name || '');
      setEmail(data.user.email);
      setRole(data.user.role);
      setEmailVerified(data.user.emailVerified);
    } catch (error) {
      console.error('Error fetching user:', error);
      showToast('Failed to load user data', 'error');
      router.push('/admin/users');
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

    try {
      const response = await fetch(`/api/admin/users/${params.id}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
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

      showToast('User updated successfully', 'success');
      router.push('/admin/users');
    } catch (error) {
      showToast(error instanceof Error ? error.message : 'Failed to update user', 'error');
    } finally {
      setIsSubmitting(false);
    }
  };

  if (isLoading || !isAdmin || isLoadingUser) {
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
            onClick={() => router.push('/admin/users')}
          >
            Back to Users
          </Button>
        </div>
      </div>
    );
  }

  return (
    <PermissionGuard permissions={['users:edit']}>
      <div className="container mx-auto py-12 px-4">
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5 }}
        className="max-w-4xl mx-auto"
      >
        <div className="mb-6">
          <Button
            variant="outline"
            size="sm"
            icon={<ArrowLeft size={16} />}
            iconPosition="left"
            onClick={() => router.push('/admin/users')}
          >
            Back to Users
          </Button>
        </div>

        <div className="bg-white rounded-xl shadow-lg overflow-hidden">
          <div className="bg-gradient-to-r from-primary-600 to-primary-800 px-6 py-8 text-white">
            <h1 className="text-3xl font-bold">Edit User</h1>
            <p className="mt-2">Update user information and permissions</p>
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
                      disabled={params.id === user?.id} // Prevent changing own role
                    >
                      <option value="CUSTOMER">Customer</option>
                      <option value="ADMIN">Admin</option>
                    </select>
                    {params.id === user?.id && (
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

                <div className="flex justify-end">
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

export default withAdminPage(EditUserPage);
