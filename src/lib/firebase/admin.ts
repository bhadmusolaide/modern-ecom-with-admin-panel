// Firebase admin-side configuration (for server components and API routes)
import * as admin from 'firebase-admin';
import { App } from 'firebase-admin/app';
import { Auth } from 'firebase-admin/auth';
import { Firestore } from 'firebase-admin/firestore';
import serviceAccount from '../../../firebase-service-account.json';

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
  if (admin.apps.length > 0) {
    app = admin.apps[0]!;
    auth = admin.auth(app);
    db = admin.firestore(app);
    isInitialized = true;
    return { app, auth, db };
  }

  try {
    console.log('Firebase Admin: Starting initialization...');
    console.log('Firebase Admin: Service account project ID:', serviceAccount.project_id);

    // Initialize Firebase Admin
    const firebaseAdminConfig = {
      credential: admin.credential.cert(serviceAccount as admin.ServiceAccount),
      projectId: serviceAccount.project_id,
    };

    console.log('Firebase Admin config:', {
      projectId: firebaseAdminConfig.projectId,
      credentialType: 'service_account'
    });

    // Initialize the app
    app = admin.initializeApp(firebaseAdminConfig);
    console.log('Firebase Admin: App initialized:', app.name);

    auth = admin.auth(app);
    console.log('Firebase Admin: Auth initialized');

    db = admin.firestore(app);
    console.log('Firebase Admin: Firestore initialized');

    // Configure Firestore settings to optimize performance
    db.settings({
      ignoreUndefinedProperties: true,
    });

    isInitialized = true;
    console.log('Firebase Admin initialized successfully');
    return { app, auth, db };
  } catch (error) {
    console.error('Error initializing Firebase Admin:', error);
    throw error;
  }
}

// Create fallback implementations for use in environments where Firebase Admin can't be initialized
const createFallbackFirestore = (): Firestore => {
  console.log('Creating fallback Firestore instance for error recovery');

  return {
    collection: (collectionPath: string) => {
      console.log(`Fallback Firestore: Accessing collection ${collectionPath}`);
      return {
        doc: (docId: string) => {
          console.log(`Fallback Firestore: Accessing document ${collectionPath}/${docId}`);
          return {
            get: async () => {
              console.log(`Fallback Firestore: Getting document ${collectionPath}/${docId}`);
              return {
                exists: false,
                id: docId,
                data: () => ({}),
              };
            },
            set: async (data: Record<string, any>) => {
              console.log(`Fallback Firestore: Setting document ${collectionPath}/${docId}`, data);
            },
            update: async (data: Record<string, any>) => {
              console.log(`Fallback Firestore: Updating document ${collectionPath}/${docId}`, data);
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
      console.log('Fallback Firestore: Setting settings', settings);
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
    console.log('Initializing Firebase Admin SDK...');
    console.log('Service account project ID:', serviceAccount.project_id);
    console.log('Environment project ID:', process.env.NEXT_PUBLIC_FIREBASE_PROJECT_ID);

    // Initialize the admin app
    const { app: initializedApp, auth: initializedAuth, db: initializedDb } = initializeAdminApp();
    app = initializedApp;
    auth = initializedAuth;
    db = initializedDb;

    console.log('Firebase Admin SDK initialized successfully');
    console.log('Admin app name:', app.name);
    console.log('Firestore instance:', !!db);
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
    console.log('Admin Firestore: Getting Firestore instance');
    console.log('Admin Firestore: isInitialized:', isInitialized);
    console.log('Admin Firestore: db exists:', !!db);
    console.log('Admin Firestore: db type:', typeof db);

    if (!isInitialized) {
      console.log('Admin Firestore: Initializing admin app');
      initializeAdminApp();
    }

    if (!db) {
      console.error('Admin Firestore: DB instance is null or undefined after initialization');
      throw new Error('Failed to initialize Firestore admin instance');
    }

    console.log('Admin Firestore: Returning Firestore instance:', !!db);
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
