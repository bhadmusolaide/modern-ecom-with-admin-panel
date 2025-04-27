'use client';

import React, { useState, useEffect, use } from 'react';
import { useRouter } from 'next/navigation';
import { motion } from 'framer-motion';
import { Save, ArrowLeft, User, Mail, Shield, Eye, EyeOff } from 'lucide-react';
import Button from '@/components/ui/Button';
import { useFirebaseAuth } from '@/lib/firebase/auth/FirebaseAuthProvider';
import { useToast } from '@/lib/context/ToastContext';
import { useActivity } from '@/lib/context/ActivityContext';
import { withAdminPage } from '@/lib/auth/withAdminPage';
import PageHeader from '@/components/admin/PageHeader';
import PermissionGuard from '@/components/admin/PermissionGuard';
import PasswordStrengthIndicator from '@/components/auth/PasswordStrengthIndicator';

function SystemCreateUserPage(props: { params?: Promise<any> }) {
  // If params are passed, unwrap them with use()
  if (props.params) {
    use(props.params);
  }
  const { user, isLoading, isAdmin } = useFirebaseAuth();
  const router = useRouter();
  const { showToast } = useToast();
  const { addActivity } = useActivity();

  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [role, setRole] = useState<'ADMIN' | 'CUSTOMER'>('ADMIN');
  const [emailVerified, setEmailVerified] = useState(false);
  const [showPassword, setShowPassword] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [csrfToken, setCsrfToken] = useState('');

  // Fetch CSRF token on component mount
  useEffect(() => {
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

    fetchCsrfToken();
  }, [showToast]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSubmitting(true);

    if (!csrfToken) {
      showToast('Security token missing. Please refresh the page.', 'error');
      setIsSubmitting(false);
      return;
    }

    // Validate passwords match
    if (password !== confirmPassword) {
      showToast('Passwords do not match', 'error');
      setIsSubmitting(false);
      return;
    }

    // Validate password strength
    if (password.length < 8) {
      showToast('Password must be at least 8 characters long', 'error');
      setIsSubmitting(false);
      return;
    }

    try {
      const response = await fetch('/api/admin/users/create', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          name,
          email,
          password,
          role,
          emailVerified,
          csrfToken,
        }),
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || 'Failed to create user');
      }

      // Log activity
      addActivity({
        type: 'user',
        action: 'create',
        description: `Created new user: ${name || email}`,
        targetId: data.user?.id,
        targetName: name || email,
        metadata: {
          user: {
            id: data.user?.id,
            email,
            role,
            emailVerified
          }
        }
      });

      showToast('User created successfully', 'success');
      router.push('/admin/system/users');
    } catch (error) {
      showToast(error instanceof Error ? error.message : 'Failed to create user', 'error');
    } finally {
      setIsSubmitting(false);
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
    <PermissionGuard permissions="users:create">
      <div className="container mx-auto px-4 py-8">
        <PageHeader
          title="Create New Admin User"
          description="Add a new admin user to the system"
          showBreadcrumbs={true}
          breadcrumbs={[
            { label: 'Dashboard', href: '/admin' },
            { label: 'System', href: '/admin/system' },
            { label: 'Users', href: '/admin/system/users' },
            { label: 'Create', href: '/admin/system/users/create' }
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
              <h1 className="text-3xl font-bold">Create New User</h1>
              <p className="mt-2">Add a new user to the system</p>
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
                      <label htmlFor="password" className="block text-sm font-medium text-gray-700">
                        Password
                      </label>
                      <div className="relative mt-1">
                        <input
                          type={showPassword ? 'text' : 'password'}
                          id="password"
                          value={password}
                          onChange={(e) => setPassword(e.target.value)}
                          className="input pr-10"
                          required
                        />
                        <button
                          type="button"
                          className="absolute inset-y-0 right-0 pr-3 flex items-center text-gray-400 hover:text-gray-500"
                          onClick={() => setShowPassword(!showPassword)}
                        >
                          {showPassword ? <EyeOff size={18} /> : <Eye size={18} />}
                        </button>
                      </div>
                      <PasswordStrengthIndicator password={password} />
                    </div>

                    <div>
                      <label htmlFor="confirmPassword" className="block text-sm font-medium text-gray-700">
                        Confirm Password
                      </label>
                      <div className="relative mt-1">
                        <input
                          type={showPassword ? 'text' : 'password'}
                          id="confirmPassword"
                          value={confirmPassword}
                          onChange={(e) => setConfirmPassword(e.target.value)}
                          className="input pr-10"
                          required
                        />
                      </div>
                      {password && confirmPassword && (
                        <div className="mt-1 text-sm">
                          {password === confirmPassword ? (
                            <span className="text-green-600">Passwords match</span>
                          ) : (
                            <span className="text-red-600">Passwords do not match</span>
                          )}
                        </div>
                      )}
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
                      >
                        <option value="CUSTOMER">Customer</option>
                        <option value="ADMIN">Admin</option>
                      </select>
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
                            Mark email as verified
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
                      Create Admin User
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

export default withAdminPage(SystemCreateUserPage);
