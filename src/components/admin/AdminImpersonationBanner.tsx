'use client';

import React, { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { Shield, LogOut } from 'lucide-react';
import { useFirebaseAuth } from '@/lib/firebase/auth/FirebaseAuthProvider';
import { useToast } from '@/lib/context/ToastContext';
import { signInWithCustomToken } from 'firebase/auth';
import { auth } from '@/lib/firebase/config';

interface AdminSession {
  id: string;
  email: string;
  name: string;
  role: string;
  timestamp: number;
}

export default function AdminImpersonationBanner() {
  const [adminSession, setAdminSession] = useState<AdminSession | null>(null);
  const [isSwitching, setIsSwitching] = useState(false);
  const router = useRouter();
  const { showToast } = useToast();
  const { user } = useFirebaseAuth();

  useEffect(() => {
    const storedSession = localStorage.getItem('adminSession');
    if (storedSession) {
      try {
        const session = JSON.parse(storedSession);
        setAdminSession(session);
      } catch (error) {
        console.error('Error parsing admin session:', error);
        localStorage.removeItem('adminSession');
      }
    }
  }, []);

  const handleSwitchBack = async () => {
    try {
      setIsSwitching(true);

      // Call the switch-back API to get a token for the admin
      const response = await fetch('/api/admin/switch-back', {
        method: 'POST',
        headers: new Headers({
          'Content-Type': 'application/json',
          'x-admin-id': adminSession?.id || ''
        })
      });

      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.message || 'Failed to switch back to admin account');
      }

      const data = await response.json();

      // Sign in with the custom token
      await signInWithCustomToken(auth, data.customToken);

      // Clear the stored admin session
      localStorage.removeItem('adminSession');
      setAdminSession(null);

      showToast('Switched back to admin account', 'success');
      router.push('/admin/system/users');
    } catch (error) {
      console.error('Error switching back to admin:', error);
      showToast(error instanceof Error ? error.message : 'Failed to switch back to admin account', 'error');
    } finally {
      setIsSwitching(false);
    }
  };

  // Only show the banner if we have an admin session and the current user is not the admin
  if (!adminSession || (user && user.id === adminSession.id)) return null;

  return (
    <div className="sticky top-0 bg-yellow-100 border-b border-yellow-200 z-40">
      <div className="container mx-auto px-4 py-2">
        <div className="flex items-center justify-between">
          <div className="flex items-center space-x-2">
            <Shield className="h-5 w-5 text-yellow-600" />
            <span className="text-sm text-yellow-800">
              Logged in as {user?.name || user?.email} (Impersonating)
            </span>
          </div>
          <button
            onClick={handleSwitchBack}
            disabled={isSwitching}
            className="flex items-center space-x-1 text-sm text-yellow-800 hover:text-yellow-900 disabled:opacity-50"
          >
            <LogOut className="h-4 w-4" />
            <span>Switch back to {adminSession.name}</span>
          </button>
        </div>
      </div>
    </div>
  );
} 