/**
 * Development mode authentication utilities
 *
 * This file provides mock authentication functionality for development mode.
 * It should NOT be used in production.
 */

import { FirebaseAuthUser as User } from '@/lib/firebase/auth/FirebaseAuthProvider';

// Mock user for development mode
export const DEV_USER: User = {
  uid: 'dev-user-id',
  email: 'dev-admin@example.com',
  displayName: 'Development Admin',
  photoURL: null,
  isAdmin: true,
  token: 'dev-token'
};

/**
 * Check if we're in development mode
 */
export function isDevelopmentMode(): boolean {
  // Check if we're in development mode
  // This needs to work in both client and server components
  if (typeof process !== 'undefined' && process.env && process.env.NODE_ENV) {
    return process.env.NODE_ENV === 'development';
  }

  // Fallback for client components where process.env might not be available
  if (typeof window !== 'undefined') {
    // Check if we're running on localhost or a development URL
    const hostname = window.location.hostname;
    return hostname === 'localhost' ||
           hostname === '127.0.0.1' ||
           hostname.includes('.local');
  }

  return false;
}

/**
 * Get a mock token for development mode
 */
export function getDevToken(): string {
  return 'dev-token';
}
