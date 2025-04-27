import { NextRequest } from 'next/server';
import { db, auth } from '@/lib/firebase/admin';
import { z } from 'zod';
import { createApiResponse, createErrorResponse } from '@/lib/auth/apiResponse';

// Validation schema
const userSchema = z.object({
  uid: z.string().min(1, 'User ID is required'),
  email: z.string().email('Invalid email address'),
  name: z.string().optional(),
  role: z.enum(['ADMIN', 'CUSTOMER']).default('CUSTOMER'),
  emailVerified: z.boolean().default(false),
});

// This API route is called after a user is created in Firebase Auth
// to store additional user data in Firestore
export async function POST(request: NextRequest) {
  try {
    const body = await request.json();

    // Validate request body
    const validation = userSchema.safeParse(body);
    if (!validation.success) {
      return createErrorResponse(validation.error.errors[0].message, 400);
    }

    const { uid, email, name, role, emailVerified } = validation.data;

    // Check if user exists in Firebase Auth
    try {
      await auth.getUser(uid);
    } catch (error) {
      return createErrorResponse('User does not exist in Firebase Auth', 404);
    }

    // Create user document in Firestore
    await db.collection('users').doc(uid).set({
      email,
      name: name || null,
      role,
      emailVerified,
      createdAt: new Date(),
      updatedAt: new Date(),
    });

    return createApiResponse({ success: true });
  } catch (error) {
    console.error('Error creating Firebase user:', error);
    return createErrorResponse(
      'Failed to create user',
      500,
      { details: error instanceof Error ? error.message : 'Unknown error' }
    );
  }
}

// Get user data from Firestore
export async function GET(request: NextRequest) {
  try {
    const uid = request.nextUrl.searchParams.get('uid');

    if (!uid) {
      return createErrorResponse('User ID is required', 400);
    }

    // Get user from Firestore
    const userDoc = await db.collection('users').doc(uid).get();

    if (!userDoc.exists) {
      return createErrorResponse('User not found', 404);
    }

    const userData = userDoc.data();

    return createApiResponse({
      user: {
        id: userDoc.id,
        ...userData,
        createdAt: userData?.createdAt?.toDate(),
        updatedAt: userData?.updatedAt?.toDate(),
        lastLoginAt: userData?.lastLoginAt?.toDate(),
        resetTokenExpiry: userData?.resetTokenExpiry?.toDate(),
      }
    });
  } catch (error) {
    console.error('Error getting Firebase user:', error);
    return createErrorResponse(
      'Failed to get user',
      500,
      { details: error instanceof Error ? error.message : 'Unknown error' }
    );
  }
}
