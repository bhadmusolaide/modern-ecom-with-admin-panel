import NextAuth from 'next-auth';
import { getAuth } from 'firebase-admin/auth';
import { db } from '../firebase/admin';

const config = {
  providers: [],
  callbacks: {
    async session({ session, token }: any) {
      if (session?.user) {
        session.user.id = token.sub;
      }
      return session;
    },
    async jwt({ token, user }: any) {
      if (user) {
        token.sub = user.id;
      }
      return token;
    },
  },
  pages: {
    signIn: '/auth/signin',
    error: '/auth/error',
  },
};

const { handlers: { GET, POST }, auth } = NextAuth(config);
export { GET, POST, auth };

/**
 * Verify a Firebase ID token
 * @deprecated Use checkAccess from @/lib/auth/checkAccess instead
 */
export async function verifyToken(token: string) {
  console.warn('verifyToken is deprecated. Use checkAccess from @/lib/auth/checkAccess instead.');
  try {
    const decodedToken = await getAuth().verifyIdToken(token);
    return decodedToken;
  } catch (error) {
    console.error('Error verifying token:', error);
    return null;
  }
}

/**
 * Get a user by ID from Firestore
 */
export async function getUserById(id: string) {
  try {
    const userDoc = await db.collection('users').doc(id).get();
    if (!userDoc.exists) {
      return null;
    }
    return userDoc.data();
  } catch (error) {
    console.error('Error getting user:', error);
    return null;
  }
}

/**
 * Update a user in Firestore
 */
export async function updateUser(id: string, data: any) {
  try {
    await db.collection('users').doc(id).update(data);
    return true;
  } catch (error) {
    console.error('Error updating user:', error);
    return false;
  }
}
