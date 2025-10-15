'use client';

import React from 'react';
import { motion } from 'framer-motion';
import {
  User, Mail, Shield, Database,
  FileText, Settings, LogOut, Package
} from 'lucide-react';
import { useRouter } from 'next/navigation';
import Button from '@/components/ui/Button';
import { useFirebaseAuth } from '@/lib/firebase/auth/FirebaseAuthProvider';
import Card from '@/components/ui/Card';

export default function AccountPage() {
  const { user, logout, isLoading } = useFirebaseAuth();
  const router = useRouter();

  if (isLoading) {
    return (
      <div className="container mx-auto py-12 px-4">
        <div className="flex justify-center items-center h-64">
          <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-primary-600"></div>
        </div>
      </div>
    );
  }

  if (!user) {
    return (
      <div className="container mx-auto py-12 px-4">
        <div className="flex flex-col justify-center items-center h-64 text-center">
          <div className="bg-gray-100 p-6 rounded-full mb-4">
            <User className="h-12 w-12 text-gray-400" />
          </div>
          <h2 className="text-2xl font-semibold text-gray-900 mb-2">Access Denied</h2>
          <p className="text-gray-600 mb-6">You need to be logged in to access your account.</p>
          <div className="space-x-4">
            <Button
              onClick={() => router.push('/auth/login')}
              className="bg-primary-600 hover:bg-primary-700 text-white"
            >
              Sign In
            </Button>
            <Button
              variant="outline"
              onClick={() => router.push('/')}
            >
              Go Home
            </Button>
          </div>
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
        className="max-w-4xl mx-auto"
      >
        <div className="bg-white rounded-xl shadow-lg overflow-hidden">
          <div className="bg-gradient-to-r from-primary-600 to-primary-800 px-6 py-8 text-white">
            <h1 className="text-3xl font-bold">My Account</h1>
            <p className="mt-2">Welcome back, {user.name || user.email}!</p>
          </div>

          <div className="p-6">
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
              <div className="col-span-1">
                <div className="bg-gray-50 p-6 rounded-lg">
                  <div className="flex items-center space-x-4 mb-6">
                    <div className="bg-primary-100 p-3 rounded-full">
                      <User className="h-6 w-6 text-primary-600" />
                    </div>
                    <div>
                      <h2 className="text-lg font-medium">{user.name || 'User'}</h2>
                      <p className="text-sm text-gray-500">{user.email}</p>
                    </div>
                  </div>

                  <div className="space-y-2">
                    <Button
                      variant="outline"
                      size="sm"
                      icon={<User size={16} />}
                      iconPosition="left"
                      className="w-full justify-start"
                      onClick={() => router.push('/account/profile')}
                    >
                      Profile Settings
                    </Button>
                    <Button
                      variant="outline"
                      size="sm"
                      icon={<Package size={16} />}
                      iconPosition="left"
                      className="w-full justify-start"
                      onClick={() => router.push('/account/orders')}
                    >
                      My Orders
                    </Button>
                    <Button
                      variant="outline"
                      size="sm"
                      icon={<Shield size={16} />}
                      iconPosition="left"
                      className="w-full justify-start"
                      onClick={() => router.push('/account/security')}
                    >
                      Security Settings
                    </Button>
                    <Button
                      variant="outline"
                      size="sm"
                      icon={<Database size={16} />}
                      iconPosition="left"
                      className="w-full justify-start"
                      onClick={() => router.push('/account/backup')}
                    >
                      Data Backup
                    </Button>
                    <Button
                      variant="outline"
                      size="sm"
                      icon={<FileText size={16} />}
                      iconPosition="left"
                      className="w-full justify-start"
                      onClick={() => router.push('/account/logs')}
                    >
                      Activity Logs
                    </Button>
                    <Button
                      variant="outline"
                      size="sm"
                      icon={<Settings size={16} />}
                      iconPosition="left"
                      className="w-full justify-start"
                      onClick={() => router.push('/account/preferences')}
                    >
                      Preferences
                    </Button>
                    <Button
                      variant="outline"
                      size="sm"
                      icon={<LogOut size={16} />}
                      iconPosition="left"
                      className="w-full justify-start text-red-600 hover:text-red-700"
                      onClick={logout}
                    >
                      Sign Out
                    </Button>
                  </div>
                </div>
              </div>

              <div className="col-span-2">
                <div className="space-y-6">
                  <Card className="p-6">
                    <h3 className="text-lg font-medium mb-4">Account Overview</h3>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      <div>
                        <p className="text-sm text-gray-500">Email</p>
                        <p className="mt-1">{user.email}</p>
                      </div>
                      <div>
                        <p className="text-sm text-gray-500">Role</p>
                        <p className="mt-1 capitalize">{user.role?.toLowerCase() || 'User'}</p>
                      </div>
                      <div>
                        <p className="text-sm text-gray-500">Last Login</p>
                        <p className="mt-1">{(() => {
                          try {
                            if (!user.lastLoginAt) return 'Never';
                            const date = new Date(user.lastLoginAt);
                            return isNaN(date.getTime()) ? 'Invalid Date' : date.toLocaleString();
                          } catch (error) {
                            console.warn('Invalid lastLoginAt date:', user.lastLoginAt, error);
                            return 'Invalid Date';
                          }
                        })()}</p>
                      </div>
                      <div>
                        <p className="text-sm text-gray-500">Account Created</p>
                        <p className="mt-1">{(() => {
                          try {
                            if (!user.createdAt) return 'Unknown';
                            const date = new Date(user.createdAt);
                            return isNaN(date.getTime()) ? 'Invalid Date' : date.toLocaleString();
                          } catch (error) {
                            console.warn('Invalid createdAt date:', user.createdAt, error);
                            return 'Invalid Date';
                          }
                        })()}</p>
                      </div>
                    </div>
                  </Card>

                  <Card className="p-6">
                    <h3 className="text-lg font-medium mb-4">Quick Actions</h3>
                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                      <Button
                        variant="outline"
                        size="sm"
                        icon={<Package size={16} />}
                        iconPosition="left"
                        className="w-full justify-start"
                        onClick={() => router.push('/account/orders')}
                      >
                        My Orders
                      </Button>
                      <Button
                        variant="outline"
                        size="sm"
                        icon={<Database size={16} />}
                        iconPosition="left"
                        className="w-full justify-start"
                        onClick={() => router.push('/account/backup')}
                      >
                        Create Backup
                      </Button>
                      <Button
                        variant="outline"
                        size="sm"
                        icon={<FileText size={16} />}
                        iconPosition="left"
                        className="w-full justify-start"
                        onClick={() => router.push('/account/logs')}
                      >
                        View Activity Logs
                      </Button>
                    </div>
                  </Card>
                </div>
              </div>
            </div>
          </div>
        </div>
      </motion.div>
    </div>
  );
}
