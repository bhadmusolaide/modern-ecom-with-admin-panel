// Firebase admin-side configuration (for server components and API routes)
import * as admin from 'firebase-admin';
import { App } from 'firebase-admin/app';
import { Auth } from 'firebase-admin/auth';
import { Firestore } from 'firebase-admin/firestore';
// For Vercel deployment, use environment variables instead of importing service account file
// const serviceAccount = require('../../firebase-service-account.json');

// Global variables to store the Firebase Admin instances
let app: App;
let auth: Auth;
let db: Firestore;

// Track initialization state
let isInitialized = false;

/**
 * Initialize the Firebase Admin SDK
 * This function is safe to call multiple times - it will only initialize once
 *
 * @returns An object containing the Firebase Admin app, auth, and db instances
 */
export function initializeAdminApp() {
  // If already initialized, return existing instances
  if (isInitialized) {
    return { app, auth, db };
  }

  // If apps already exist, use the first one
  if (admin.apps.length > 0 && admin.apps[0]) {
    app = admin.apps[0];
    auth = admin.auth(app);
    db = admin.firestore(app);
    isInitialized = true;
    return { app, auth, db };
  }

  try {
    // Use environment variables for Firebase Admin configuration (Vercel-compatible)
    const privateKey = process.env.FIREBASE_PRIVATE_KEY?.replace(/\\n/g, '\n');
    const clientEmail = process.env.FIREBASE_CLIENT_EMAIL;
    const projectId = process.env.FIREBASE_PROJECT_ID || process.env.NEXT_PUBLIC_FIREBASE_PROJECT_ID;

    if (!privateKey || !clientEmail || !projectId) {
      throw new Error('Missing required Firebase Admin environment variables');
    }

    // Initialize Firebase Admin using environment variables
    const firebaseAdminConfig = {
      credential: admin.credential.cert({
        projectId,
        clientEmail,
        privateKey,
      }),
      projectId,
    };

    // Initialize the app
    app = admin.initializeApp(firebaseAdminConfig);

    auth = admin.auth(app);

    db = admin.firestore(app);

    // Configure Firestore settings to optimize performance
    db.settings({
      ignoreUndefinedProperties: true,
    });

    isInitialized = true;

    return { app, auth, db };
  } catch (error) {
    console.error('Error initializing Firebase Admin:', error);
    throw error;
  }
}

// Create fallback implementations for use in environments where Firebase Admin can't be initialized
const createFallbackFirestore = (): Firestore => {

  return {
    collection: (collectionPath: string) => {

      return {
        doc: (docId: string) => {

          return {
            get: async () => {

              return {
                exists: false,
                id: docId,
                data: () => ({}),
              };
            },
            set: async (data: Record<string, any>) => {

            },
            update: async (data: Record<string, any>) => {

            },
          };
        },
        where: () => ({ where: () => ({ get: async () => ({ docs: [] }) }) }),
        orderBy: () => ({ limit: () => ({ get: async () => ({ docs: [] }) }) }),
        limit: () => ({ get: async () => ({ docs: [] }) }),
        get: async () => ({ docs: [], empty: true, size: 0 }),
      };
    },
    settings: (settings: Record<string, any>) => {

    },
    batch: () => ({
      set: () => {},
      update: () => {},
      delete: () => {},
      commit: async () => {},
    }),
  } as unknown as Firestore;
};

// Only initialize Firebase Admin once at module load time
// This prevents multiple initializations across API routes
if (typeof window === 'undefined') { // Only run on server
  try {

// Initialize the admin app
    const { app: initializedApp, auth: initializedAuth, db: initializedDb } = initializeAdminApp();
    app = initializedApp;
    auth = initializedAuth;
    db = initializedDb;

} catch (error) {
    console.error('Error in initial Firebase Admin initialization:', error);
    console.error('Error details:', error instanceof Error ? error.message : 'Unknown error');
    console.error('Error stack:', error instanceof Error ? error.stack : 'No stack trace available');
    app = {} as App;
    auth = {} as Auth;
    db = createFallbackFirestore();
  }
}

// Export a function to get the auth instance to prevent direct imports of getAuth
export function getAdminAuth(): Auth {
  if (!isInitialized) {
    initializeAdminApp();
  }
  return auth;
}

// Export a function to get the firestore instance to prevent direct imports of getFirestore
export function getAdminFirestore(): Firestore {
  try {

if (!isInitialized) {

      initializeAdminApp();
    }

    if (!db) {
      console.error('Admin Firestore: DB instance is null or undefined after initialization');
      throw new Error('Failed to initialize Firestore admin instance');
    }

    return db;
  } catch (error) {
    console.error('Admin Firestore: Error getting admin Firestore instance:', error);
    console.error('Admin Firestore: Error details:', error instanceof Error ? error.message : 'Unknown error');
    console.error('Admin Firestore: Error stack:', error instanceof Error ? error.stack : 'No stack trace available');

    // Return fallback Firestore instance
    return createFallbackFirestore();
  }
}

export { app, auth, db };
