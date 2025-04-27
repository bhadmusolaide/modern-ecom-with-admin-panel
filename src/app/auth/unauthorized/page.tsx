'use client';

import React, { useEffect } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { useFirebaseAuth } from '@/lib/firebase/auth/FirebaseAuthProvider';

export default function UnauthorizedPage() {
  const { user, isLoading, logout } = useFirebaseAuth();
  const router = useRouter();

  // If user is admin, redirect to admin dashboard
  useEffect(() => {
    if (user && !isLoading && user.role === 'ADMIN') {
      router.push('/admin');
    }
  }, [user, isLoading, router]);

  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-50 py-12 px-4 sm:px-6 lg:px-8">
      <div className="max-w-md w-full space-y-8">
        <div>
          <h2 className="mt-6 text-center text-3xl font-extrabold text-gray-900">
            Access Denied
          </h2>
          <p className="mt-2 text-center text-sm text-gray-600">
            You don't have permission to access this page.
          </p>
        </div>
        <div className="mt-8 space-y-6">
          <div className="rounded-md shadow-sm space-y-4">
            <p className="text-center text-gray-700">
              This area is restricted to administrators only.
            </p>
            <p className="text-center text-gray-700">
              If you believe you should have access, please contact the site administrator.
            </p>
          </div>

          <div className="flex flex-col space-y-4">
            <Link
              href="/"
              className="w-full flex justify-center py-2 px-4 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-primary hover:bg-primary-dark focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-primary"
            >
              Return to Home
            </Link>
            
            {user && (
              <button
                onClick={() => logout()}
                className="w-full flex justify-center py-2 px-4 border border-gray-300 rounded-md shadow-sm text-sm font-medium text-gray-700 bg-white hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-primary"
              >
                Sign out
              </button>
            )}
            
            {!user && (
              <Link
                href="/auth/login"
                className="w-full flex justify-center py-2 px-4 border border-gray-300 rounded-md shadow-sm text-sm font-medium text-gray-700 bg-white hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-primary"
              >
                Sign in with a different account
              </Link>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}