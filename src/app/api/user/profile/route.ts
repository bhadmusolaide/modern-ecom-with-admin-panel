import { NextRequest } from 'next/server';
import { z } from 'zod';
import { auth, db } from '@/lib/firebase/admin';
import { checkAccess } from '@/lib/auth/checkAccess';
import { createApiResponse, createErrorResponse } from '@/lib/auth/apiResponse';


// Validation schema
const updateProfileSchema = z.object({
  name: z.string().min(2, 'Name must be at least 2 characters'),
  email: z.string().email('Invalid email address'),
});

// Handle OPTIONS requests for CORS preflight
export async function OPTIONS() {
  return createApiResponse({  }, 200);
}

export async function PUT(request: NextRequest) {
  try {
    // Use unified auth check
    const access = await checkAccess(request);

    // Check if authenticated
    if (!access.authenticated) {
      return createErrorResponse(
        access.error || 'Authentication required',
        access.status || 401
      );
    }

    // Parse and validate request body
    const body = await request.json();
    const validation = updateProfileSchema.safeParse(body);

    if (!validation.success) {
      return createErrorResponse(validation.error.errors[0].message, 400);
    }

    const { name, email } = validation.data;

    // Check if email is already taken by another user
    if (email) {
      // Query Firestore for users with the same email
      const usersRef = db.collection('users');
      const snapshot = await usersRef.where('email', '==', email).get();

      // Check if any user with this email exists (other than the current user)
      let emailTaken = false;
      snapshot.forEach(doc => {
        if (doc.id !== access.userId) {
          emailTaken = true;
        }
      });

      if (emailTaken) {
        return createErrorResponse('Email is already taken', 400);
      }
    }

    // Update user in Firebase Auth
    await auth.updateUser(access.userId, {
      displayName: name,
      email: email
    });

    // Update user in Firestore
    await db.collection('users').doc(access.userId).update({
      name,
      email,
      updatedAt: new Date()
    });

    // Get the updated user data
    const userDoc = await db.collection('users').doc(access.userId).get();
    const userData = userDoc.data();

    // Return updated user data
    return createApiResponse({
      user: {
        id: userDoc.id,
        name: userData?.name,
        email: userData?.email,
        role: userData?.role,
        emailVerified: userData?.emailVerified || false,
        createdAt: userData?.createdAt?.toDate(),
        updatedAt: userData?.updatedAt?.toDate(),
      },
    });
  } catch (error) {
    console.error('Profile update error:', error);
    return createErrorResponse('Failed to update profile', 500, { details: error instanceof Error ? error.message : 'Unknown error' });
  }
}
