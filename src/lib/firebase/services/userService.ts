import { db } from '../config';
import { auth } from '../config';
import { 
  collection, doc, getDoc, getDocs, setDoc, updateDoc, 
  query, where, deleteDoc, serverTimestamp, Timestamp 
} from 'firebase/firestore';
import { 
  createUserWithEmailAndPassword, 
  signInWithEmailAndPassword,
  signOut,
  sendPasswordResetEmail,
  updateProfile,
  User as FirebaseUser
} from 'firebase/auth';
import { UserRole } from '@/lib/types';

// Collection reference
const USERS_COLLECTION = 'users';

// User interface matching our application needs
export interface User {
  id: string;
  email: string;
  name?: string;
  role: UserRole;
  createdAt?: Date;
  updatedAt?: Date;
  lastLoginAt?: Date;
  emailVerified: boolean;
  verificationToken?: string;
  resetToken?: string;
  resetTokenExpiry?: Date;
}

// Convert Firestore data to User
const convertToUser = (id: string, data: any): User => {
  return {
    id,
    email: data.email,
    name: data.name || null,
    role: data.role || UserRole.CUSTOMER,
    createdAt: data.createdAt?.toDate(),
    updatedAt: data.updatedAt?.toDate(),
    lastLoginAt: data.lastLoginAt?.toDate(),
    emailVerified: data.emailVerified || false,
    verificationToken: data.verificationToken,
    resetToken: data.resetToken,
    resetTokenExpiry: data.resetTokenExpiry?.toDate(),
  };
};

// Create a new user
export const createUser = async (userData: {
  email: string;
  password: string;
  name?: string;
  role?: UserRole;
  emailVerified?: boolean;
  verificationToken?: string;
}): Promise<User> => {
  try {
    // Create the user in Firebase Auth
    const userCredential = await createUserWithEmailAndPassword(
      auth, 
      userData.email, 
      userData.password
    );
    
    const firebaseUser = userCredential.user;
    
    // Update display name if provided
    if (userData.name) {
      await updateProfile(firebaseUser, {
        displayName: userData.name
      });
    }
    
    // Create additional user data in Firestore
    const userDocRef = doc(db, USERS_COLLECTION, firebaseUser.uid);
    const userDoc = {
      email: userData.email,
      name: userData.name || null,
      role: userData.role || UserRole.CUSTOMER,
      createdAt: serverTimestamp(),
      updatedAt: serverTimestamp(),
      emailVerified: userData.emailVerified || false,
      verificationToken: userData.verificationToken || null,
    };
    
    await setDoc(userDocRef, userDoc);
    
    return {
      id: firebaseUser.uid,
      ...userDoc,
      createdAt: new Date(),
      updatedAt: new Date(),
    } as User;
  } catch (error) {
    console.error('Error creating user:', error);
    throw error;
  }
};

// Get user by ID
export const getUserById = async (id: string): Promise<User | null> => {
  try {
    const userDocRef = doc(db, USERS_COLLECTION, id);
    const userDoc = await getDoc(userDocRef);
    
    if (!userDoc.exists()) {
      return null;
    }
    
    return convertToUser(userDoc.id, userDoc.data());
  } catch (error) {
    console.error('Error getting user by ID:', error);
    throw error;
  }
};

// Get user by email
export const getUserByEmail = async (email: string): Promise<User | null> => {
  try {
    const usersRef = collection(db, USERS_COLLECTION);
    const q = query(usersRef, where('email', '==', email));
    const querySnapshot = await getDocs(q);
    
    if (querySnapshot.empty) {
      return null;
    }
    
    const userDoc = querySnapshot.docs[0];
    return convertToUser(userDoc.id, userDoc.data());
  } catch (error) {
    console.error('Error getting user by email:', error);
    throw error;
  }
};

// Update user
export const updateUser = async (id: string, userData: Partial<User>): Promise<User> => {
  try {
    const userDocRef = doc(db, USERS_COLLECTION, id);
    
    // Remove id from userData to avoid overwriting it
    const { id: _, ...dataToUpdate } = userData;
    
    // Add updatedAt timestamp
    const updateData = {
      ...dataToUpdate,
      updatedAt: serverTimestamp(),
    };
    
    await updateDoc(userDocRef, updateData);
    
    // Get the updated user
    const updatedUserDoc = await getDoc(userDocRef);
    
    if (!updatedUserDoc.exists()) {
      throw new Error('User not found after update');
    }
    
    return convertToUser(updatedUserDoc.id, updatedUserDoc.data());
  } catch (error) {
    console.error('Error updating user:', error);
    throw error;
  }
};

// Update last login time
export const updateLastLogin = async (id: string): Promise<void> => {
  try {
    const userDocRef = doc(db, USERS_COLLECTION, id);
    await updateDoc(userDocRef, {
      lastLoginAt: serverTimestamp(),
      updatedAt: serverTimestamp(),
    });
  } catch (error) {
    console.error('Error updating last login time:', error);
    throw error;
  }
};

// Sign in user
export const signInUser = async (email: string, password: string): Promise<FirebaseUser> => {
  try {
    const userCredential = await signInWithEmailAndPassword(auth, email, password);
    return userCredential.user;
  } catch (error) {
    console.error('Error signing in user:', error);
    throw error;
  }
};

// Sign out user
export const signOutUser = async (): Promise<void> => {
  try {
    await signOut(auth);
  } catch (error) {
    console.error('Error signing out user:', error);
    throw error;
  }
};

// Send password reset email
export const sendPasswordReset = async (email: string): Promise<void> => {
  try {
    await sendPasswordResetEmail(auth, email);
  } catch (error) {
    console.error('Error sending password reset email:', error);
    throw error;
  }
};
