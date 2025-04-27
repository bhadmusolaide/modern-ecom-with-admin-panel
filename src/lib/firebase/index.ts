/**
 * Firebase index file
 *
 * This file exports all Firebase functionality for easier imports
 * It consolidates exports from both config and auth modules
 */

// Re-export Firebase instances from config
export { app, auth, db } from './config';

// Re-export Firebase auth functionality
export {
  FirebaseAuthProvider,
  useFirebaseAuth,
  type User as FirebaseAuthUser
} from './auth/FirebaseAuthProvider';

// Compatibility layer is no longer needed as we've migrated to useFirebaseAuth

// Re-export utility functions
export * from './utils';
