'use client';

import { useState } from 'react';
import Link from 'next/link';
import { ArrowLeft, Tool, Shield, User, Key } from 'lucide-react';
import SetAdminClaims from '@/components/admin/SetAdminClaims';
import PermissionGuard from '@/components/admin/PermissionGuard';

export default function AdminToolsPage() {
  return (
    <div className="container mx-auto pb-20">
      <div className="flex flex-col md:flex-row md:items-center md:justify-between mb-6">
        <div className="flex items-center">
          <Link
            href="/admin/system"
            className="mr-4 p-2 rounded-full hover:bg-neutral-100 dark:hover:bg-neutral-800 transition-colors"
          >
            <ArrowLeft size={20} className="text-neutral-500 dark:text-neutral-400" />
          </Link>
          <div>
            <h1 className="text-2xl font-bold text-neutral-800 dark:text-white">Admin Tools</h1>
            <p className="text-neutral-600 dark:text-neutral-400">Advanced tools for system administration</p>
          </div>
        </div>
      </div>

      <PermissionGuard
        permissions={['system:admin']}
        fallback={
          <div className="bg-white dark:bg-neutral-900 rounded-lg shadow-sm border border-neutral-200 dark:border-neutral-700 p-6 text-center">
            <Shield size={48} className="mx-auto text-neutral-400 dark:text-neutral-600 mb-4" />
            <h2 className="text-xl font-bold text-neutral-800 dark:text-white mb-2">Access Denied</h2>
            <p className="text-neutral-600 dark:text-neutral-400">
              You don't have permission to access admin tools.
            </p>
          </div>
        }
      >
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <SetAdminClaims />
          
          <div className="bg-white dark:bg-neutral-900 rounded-lg shadow-sm border border-neutral-200 dark:border-neutral-700 p-6">
            <h2 className="text-lg font-medium text-neutral-800 dark:text-white mb-4">Authentication Status</h2>
            <AuthStatus />
          </div>
        </div>
      </PermissionGuard>
    </div>
  );
}

function AuthStatus() {
  const [loading, setLoading] = useState(false);
  const [status, setStatus] = useState<any>(null);
  
  const checkAuthStatus = async () => {
    setLoading(true);
    try {
      // Import Firebase auth dynamically
      const { auth } = await import('@/lib/firebase/config');
      const currentUser = auth.currentUser;
      
      if (!currentUser) {
        setStatus({
          authenticated: false,
          message: 'No user is currently signed in'
        });
        return;
      }
      
      // Get the ID token
      const token = await currentUser.getIdToken(true);
      
      // Get the token result which includes claims
      const tokenResult = await currentUser.getIdTokenResult();
      
      setStatus({
        authenticated: true,
        uid: currentUser.uid,
        email: currentUser.email,
        displayName: currentUser.displayName,
        emailVerified: currentUser.emailVerified,
        isAdmin: tokenResult.claims.admin === true,
        claims: tokenResult.claims,
        tokenLength: token.length,
        tokenPreview: token.substring(0, 10) + '...' + token.substring(token.length - 5)
      });
    } catch (error) {
      console.error('Error checking auth status:', error);
      setStatus({
        error: error instanceof Error ? error.message : 'Unknown error checking auth status'
      });
    } finally {
      setLoading(false);
    }
  };
  
  return (
    <div>
      <button
        onClick={checkAuthStatus}
        disabled={loading}
        className="px-4 py-2 bg-primary text-white rounded-md hover:bg-primary-dark disabled:opacity-50 disabled:cursor-not-allowed mb-4"
      >
        {loading ? 'Checking...' : 'Check Auth Status'}
      </button>
      
      {status && (
        <div className="mt-4 p-4 bg-neutral-50 dark:bg-neutral-800 rounded-md">
          {status.error ? (
            <p className="text-red-500">{status.error}</p>
          ) : status.authenticated ? (
            <div className="space-y-2">
              <p className="text-green-500 font-medium">User is authenticated</p>
              <p><span className="font-medium">UID:</span> {status.uid}</p>
              <p><span className="font-medium">Email:</span> {status.email}</p>
              <p><span className="font-medium">Name:</span> {status.displayName || 'Not set'}</p>
              <p><span className="font-medium">Email Verified:</span> {status.emailVerified ? 'Yes' : 'No'}</p>
              <p><span className="font-medium">Admin:</span> {status.isAdmin ? 'Yes' : 'No'}</p>
              <p><span className="font-medium">Token:</span> {status.tokenPreview} ({status.tokenLength} chars)</p>
              <div>
                <p className="font-medium">Claims:</p>
                <pre className="mt-1 p-2 bg-neutral-100 dark:bg-neutral-700 rounded text-xs overflow-auto">
                  {JSON.stringify(status.claims, null, 2)}
                </pre>
              </div>
            </div>
          ) : (
            <p className="text-yellow-500">{status.message}</p>
          )}
        </div>
      )}
    </div>
  );
}
