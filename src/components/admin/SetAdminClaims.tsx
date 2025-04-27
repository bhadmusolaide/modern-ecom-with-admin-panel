'use client';

import { useState } from 'react';
import { useToast } from '@/lib/context/ToastContext';
import { useFirebaseAuth } from '@/lib/firebase/auth/FirebaseAuthProvider';

export default function SetAdminClaims() {
  const [uid, setUid] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const { showToast } = useToast();
  const { getIdToken } = useFirebaseAuth();

  const handleSetAdminClaims = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!uid.trim()) {
      showToast('User ID is required', 'error');
      return;
    }
    
    setIsLoading(true);
    
    try {
      // Get the current user's ID token
      const token = await getIdToken();
      
      // Call the API to set admin claims
      const response = await fetch('/api/admin/set-admin-claims', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          ...(token ? { 'Authorization': `Bearer ${token}` } : {})
        },
        body: JSON.stringify({ uid })
      });
      
      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || 'Failed to set admin claims');
      }
      
      const data = await response.json();
      showToast(data.message || 'Admin claims set successfully', 'success');
      setUid('');
    } catch (error) {
      console.error('Error setting admin claims:', error);
      showToast(
        error instanceof Error ? error.message : 'Failed to set admin claims',
        'error'
      );
    } finally {
      setIsLoading(false);
    }
  };
  
  return (
    <div className="bg-white dark:bg-neutral-900 rounded-lg shadow-sm border border-neutral-200 dark:border-neutral-700 p-6">
      <h2 className="text-lg font-medium text-neutral-800 dark:text-white mb-4">Set Admin Claims</h2>
      <p className="text-sm text-neutral-600 dark:text-neutral-400 mb-4">
        Use this form to set admin custom claims for a user. This will grant them full admin access.
      </p>
      
      <form onSubmit={handleSetAdminClaims} className="space-y-4">
        <div>
          <label htmlFor="uid" className="block text-sm font-medium text-neutral-700 dark:text-neutral-300 mb-1">
            Firebase User ID
          </label>
          <input
            id="uid"
            type="text"
            value={uid}
            onChange={(e) => setUid(e.target.value)}
            className="w-full px-3 py-2 rounded-md border border-neutral-300 dark:border-neutral-600 bg-white dark:bg-neutral-800 text-neutral-800 dark:text-neutral-200"
            placeholder="Enter Firebase user ID"
            disabled={isLoading}
          />
        </div>
        
        <div className="flex justify-end">
          <button
            type="submit"
            disabled={isLoading}
            className="px-4 py-2 bg-primary text-white rounded-md hover:bg-primary-dark disabled:opacity-50 disabled:cursor-not-allowed"
          >
            {isLoading ? 'Setting Claims...' : 'Set Admin Claims'}
          </button>
        </div>
      </form>
      
      <div className="mt-4 text-sm text-neutral-600 dark:text-neutral-400">
        <p className="font-medium">How to find a user ID:</p>
        <ol className="list-decimal list-inside mt-2 space-y-1">
          <li>Go to the Firebase Console</li>
          <li>Navigate to Authentication &gt; Users</li>
          <li>Find the user you want to make an admin</li>
          <li>Copy their User UID</li>
        </ol>
      </div>
    </div>
  );
}
