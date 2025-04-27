'use client';

import React, { createContext, useContext, useState, useEffect, ReactNode } from 'react';
import { useRouter } from 'next/navigation';
import { useToast } from '@/lib/context/ToastContext';
import { auth, db } from '../config';
import {
  signInWithEmailAndPassword,
  createUserWithEmailAndPassword,
  signOut as firebaseSignOut,
  onAuthStateChanged,
  updateProfile,
  signInWithCustomToken,
  User as FirebaseUser
} from 'firebase/auth';
import { doc, getDoc, updateDoc, setDoc, serverTimestamp } from 'firebase/firestore';
import { storeAuthToken, removeAuthToken } from '@/lib/auth/tokenStorage';

export interface User {
  id: string;
  email: string | null;
  name?: string | null;
  role: 'ADMIN' | 'CUSTOMER' | 'EDITOR' | 'MANAGER';
  permissions?: string[];
  emailVerified?: boolean;
  token?: string; // Add token to the User interface
}

interface FirebaseAuthContextType {
  user: User | null;
  firebaseUser: FirebaseUser | null;
  isLoading: boolean;
  login: (email: string, password: string) => Promise<void>;
  signup: (name: string, email: string, password: string) => Promise<void>;
  logout: () => Promise<void>;
  isAuthenticated: boolean;
  isAdmin: boolean;
  hasPermission: (permission: string | string[]) => boolean;
  getIdToken: () => Promise<string | null>;
  signInWithCustomToken: (token: string) => Promise<FirebaseUser>;
}

const FirebaseAuthContext = createContext<FirebaseAuthContextType | undefined>(undefined);

export function FirebaseAuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<User | null>(null);
  const [firebaseUser, setFirebaseUser] = useState<FirebaseUser | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [isInitialized, setIsInitialized] = useState(false);
  const router = useRouter();
  const { showToast } = useToast();

  // Set up Firebase auth state listener
  useEffect(() => {
    let isMounted = true;
    let tokenRefreshInterval: NodeJS.Timeout | null = null;

    const initializeAuth = async (): Promise<() => void> => {
      console.log('Setting up Firebase auth state listener');
      const unsubscribe = onAuthStateChanged(auth, async (fbUser) => {
        if (!isMounted) return;

        setFirebaseUser(fbUser);

        if (fbUser) {
          try {
            console.log('Firebase user authenticated:', fbUser.uid);

            // Get the ID token and store it securely
            const token = await fbUser.getIdToken();
            await storeAuthToken(token);
            console.log('Firebase ID token stored securely');

            // Get user data from Firestore
            const userDoc = await getDoc(doc(db, 'users', fbUser.uid));

            if (userDoc.exists() && isMounted) {
              const userData = userDoc.data();
              setUser({
                id: fbUser.uid,
                email: fbUser.email,
                name: userData.name || fbUser.displayName,
                role: userData.role || 'CUSTOMER',
                permissions: userData.permissions || [],
                emailVerified: fbUser.emailVerified,
                token // Include the token in the user object
              });

              // Update last login time
              await updateDoc(doc(db, 'users', fbUser.uid), {
                lastLoginAt: serverTimestamp(),
                updatedAt: serverTimestamp()
              });
            } else if (isMounted) {
              console.log('User document does not exist in Firestore');
              // Basic user data from Firebase Auth
              setUser({
                id: fbUser.uid,
                email: fbUser.email,
                name: fbUser.displayName,
                role: 'CUSTOMER', // Default role
                emailVerified: fbUser.emailVerified,
                token // Include the token in the user object
              });
            }

            // Set up token refresh interval
            if (tokenRefreshInterval) {
              clearInterval(tokenRefreshInterval);
            }

            // Refresh token every 30 minutes
            tokenRefreshInterval = setInterval(async () => {
              try {
                if (auth.currentUser) {
                  console.log('Refreshing Firebase ID token');
                  const newToken = await auth.currentUser.getIdToken(true);
                  await storeAuthToken(newToken);
                  console.log('Firebase ID token refreshed successfully');

                  // Update the user object with the new token
                  setUser(prevUser => {
                    if (prevUser) {
                      return { ...prevUser, token: newToken };
                    }
                    return prevUser;
                  });
                }
              } catch (refreshError) {
                console.error('Error refreshing token:', refreshError);
              }
            }, 30 * 60 * 1000); // 30 minutes

          } catch (error) {
            console.error('Error fetching user data:', error);
            if (isMounted) setUser(null);
          }
        } else {
          console.log('No Firebase user authenticated');
          if (isMounted) setUser(null);

          // Clear token refresh interval if user is logged out
          if (tokenRefreshInterval) {
            clearInterval(tokenRefreshInterval);
            tokenRefreshInterval = null;
          }
        }

        if (isMounted) {
          setIsLoading(false);
          setIsInitialized(true);
        }
      });

      return unsubscribe;
    };

    let unsubscribeFunc: (() => void) | undefined;

    initializeAuth().then(unsub => {
      unsubscribeFunc = unsub;
    });

    return () => {
      isMounted = false;
      if (unsubscribeFunc) {
        unsubscribeFunc();
      }

      // Clear token refresh interval on unmount
      if (tokenRefreshInterval) {
        clearInterval(tokenRefreshInterval);
      }
    };
  }, []);

  // Don't render children until Firebase Auth is initialized
  if (!isInitialized) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="animate-spin rounded-full h-8 w-8 border-t-2 border-b-2 border-primary"></div>
      </div>
    );
  }

  // Login function
  const login = async (email: string, password: string) => {
    setIsLoading(true);
    try {
      console.log('Attempting to log in with Firebase:', email);

      // Sign in with Firebase
      const userCredential = await signInWithEmailAndPassword(auth, email, password);
      const fbUser = userCredential.user;

      // Get and store the token
      const token = await fbUser.getIdToken();
      await storeAuthToken(token);

      // Update the user object with the token
      setUser(prevUser => {
        if (prevUser) {
          return { ...prevUser, token };
        }
        return prevUser;
      });

      // Get user data from Firestore
      const userDoc = await getDoc(doc(db, 'users', fbUser.uid));

      if (!userDoc.exists()) {
        // Create user document if it doesn't exist
        await setDoc(doc(db, 'users', fbUser.uid), {
          email: fbUser.email,
          name: fbUser.displayName,
          role: 'CUSTOMER', // Default role
          createdAt: serverTimestamp(),
          updatedAt: serverTimestamp(),
          lastLoginAt: serverTimestamp(),
          emailVerified: fbUser.emailVerified
        });
      } else {
        // Update last login time
        await updateDoc(doc(db, 'users', fbUser.uid), {
          lastLoginAt: serverTimestamp(),
          updatedAt: serverTimestamp()
        });
      }

      // Check if user is admin for admin routes
      const userData = userDoc.data();
      if (window.location.pathname.startsWith('/admin') && userData?.role !== 'ADMIN') {
        showToast('You do not have permission to access the admin area', 'error');
        await firebaseSignOut(auth);
        router.push('/');
        throw new Error('Not authorized to access admin area');
      }

      showToast('Logged in successfully', 'success');
    } catch (error) {
      console.error('Login error:', error);
      const errorMessage = error instanceof Error ? error.message : 'Failed to login';
      showToast(errorMessage, 'error');
      throw error;
    } finally {
      setIsLoading(false);
    }
  };

  // Signup function
  const signup = async (name: string, email: string, password: string) => {
    setIsLoading(true);
    try {
      console.log('Attempting to sign up with Firebase:', email);

      // Create user with Firebase
      const userCredential = await createUserWithEmailAndPassword(auth, email, password);
      const fbUser = userCredential.user;

      // Update profile with name
      await updateProfile(fbUser, { displayName: name });

      // Create user document in Firestore
      await setDoc(doc(db, 'users', fbUser.uid), {
        email: fbUser.email,
        name: name,
        role: 'CUSTOMER', // Default role
        createdAt: serverTimestamp(),
        updatedAt: serverTimestamp(),
        lastLoginAt: serverTimestamp(),
        emailVerified: fbUser.emailVerified
      });

      showToast('Account created successfully', 'success');
    } catch (error) {
      console.error('Signup error:', error);
      const errorMessage = error instanceof Error ? error.message : 'Failed to create account';
      showToast(errorMessage, 'error');
      throw error;
    } finally {
      setIsLoading(false);
    }
  };

  // Logout function
  const logout = async () => {
    try {
      // First remove the token to prevent any authenticated requests during logout
      await removeAuthToken();

      // Then sign out from Firebase
      await firebaseSignOut(auth);

      // Clear user state
      setUser(null);
      setFirebaseUser(null);

      // Redirect to home page
      router.push('/');
      showToast('Logged out successfully', 'success');
    } catch (error) {
      console.error('Logout error:', error);
      const errorMessage = error instanceof Error ? error.message : 'Failed to logout';
      showToast(errorMessage, 'error');

      // Even if there's an error, try to clean up
      try {
        await removeAuthToken();
      } catch (cleanupError) {
        console.error('Error during logout cleanup:', cleanupError);
      }
    }
  };

  // Get Firebase ID token for API calls
  const getFirebaseIdToken = async (): Promise<string | null> => {
    try {
      // First check if we have a token in the user object
      if (user?.token) {
        console.log('Using token from user object');
        return user.token;
      }

      // Otherwise, get a fresh token from Firebase
      if (firebaseUser) {
        console.log('Getting fresh token from Firebase');
        // Use a direct call to the Firebase SDK function to avoid infinite recursion
        const token = await firebaseUser.getIdToken(true); // Force refresh

        // Update the user object with the new token
        setUser(prevUser => {
          if (prevUser) {
            return { ...prevUser, token };
          }
          return prevUser;
        });

        return token;
      }
      return null;
    } catch (error) {
      console.error('Error getting Firebase ID token:', error);
      return null;
    }
  };

  // Check if user is authenticated
  const isAuthenticated = !!user;

  // Check if user is admin
  const isAdmin = user?.role === 'ADMIN';

  // Check if user has a specific permission or set of permissions
  const hasPermission = (permission: string | string[]): boolean => {
    if (!user) return false;

    // Admin role has all permissions
    if (user.role === 'ADMIN') return true;

    // For array of permissions, check if user has ALL of them
    if (Array.isArray(permission)) {
      return permission.every(p => hasPermission(p));
    }

    // Check user's direct permissions
    if (user.permissions?.includes(permission)) {
      return true;
    }

    // Check for wildcard permissions
    if (user.permissions) {
      const category = permission.split(':')[0];
      if (user.permissions.includes(`${category}:*`) || user.permissions.includes('*')) {
        return true;
      }
    }

    // Default to false if no permissions match
    return false;
  };

  // Add signInWithCustomToken function
  const handleSignInWithCustomToken = async (token: string): Promise<FirebaseUser> => {
    try {
      const userCredential = await signInWithCustomToken(auth, token);
      return userCredential.user;
    } catch (error) {
      console.error('Error signing in with custom token:', error);
      throw error;
    }
  };

  const value = {
    user,
    firebaseUser,
    isLoading,
    login,
    signup,
    logout,
    isAuthenticated,
    isAdmin,
    hasPermission,
    getIdToken: getFirebaseIdToken,
    signInWithCustomToken: handleSignInWithCustomToken
  };

  return <FirebaseAuthContext.Provider value={value}>{children}</FirebaseAuthContext.Provider>;
}

export function useFirebaseAuth() {
  const context = useContext(FirebaseAuthContext);
  if (context === undefined) {
    throw new Error('useFirebaseAuth must be used within a FirebaseAuthProvider');
  }
  return context;
}
