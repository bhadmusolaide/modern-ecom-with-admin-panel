import { NextRequest } from 'next/server';
import { z } from 'zod';
import { getAdminAuth, getAdminFirestore } from '@/lib/firebase/admin';
import { createApiResponse, createErrorResponse } from '@/lib/auth/apiResponse';
import { checkAccess } from '@/lib/auth/checkAccess';

// Validation schema
const loginAsUserSchema = z.object({
  userId: z.string().min(1, 'User ID is required'),
});

export async function POST(request: NextRequest) {
  // Ensure we use properly initialized Admin SDK instances
  const adminAuth = getAdminAuth();
  const db = getAdminFirestore();

  try {
    // Check access and ensure the requester is an authenticated admin
    const access = await checkAccess(request);
    if (!access.authenticated) {
      return createErrorResponse(access.error || 'Authentication required', access.status || 401);
    }
    if (!access.isAdmin) {
      return createErrorResponse('Forbidden. Admin access required.', 403);
    }

    const body = await request.json();
    const validation = loginAsUserSchema.safeParse(body);
    if (!validation.success) {
      return createErrorResponse(validation.error.errors[0].message, 400);
    }

    const { userId } = validation.data;

    // Get the target user's data from Firebase Auth
    let userRecord;
    try {
      userRecord = await adminAuth.getUser(userId);
    } catch (e: any) {
      if (e?.code === 'auth/user-not-found') {
        return createErrorResponse('User not found in authentication', 404);
      }
      return createErrorResponse('Failed to retrieve user record', 500, { details: e?.message || String(e) });
    }

    // Get the target user's Firestore profile (optional but preferred)
    let userDoc;
    try {
      userDoc = await db.collection('users').doc(userId).get();
    } catch (e: any) {
      // Do not fail impersonation purely due to Firestore read error
      userDoc = { exists: false, data: () => ({}) } as any;
    }

    const userData = userDoc.exists ? userDoc.data() : {};

    // Create a custom token for the target user
    let customToken: string;
    try {
      customToken = await adminAuth.createCustomToken(userId, {
        adminImpersonation: true,
        originalAdminId: access.userId
      });
    } catch (e: any) {
      return createErrorResponse('Failed to create custom token', 500, { details: e?.message || String(e) });
    }

    return createApiResponse({
      customToken,
      user: {
        id: userId,
        email: userRecord.email,
        name: userData?.name || userRecord.displayName,
        role: userData?.role || 'CUSTOMER',
        emailVerified: userRecord.emailVerified
      }
    });
  } catch (error) {
    console.error('Error in login-as-user:', error);
    return createErrorResponse(
      'Failed to login as user',
      500,
      { details: error instanceof Error ? error.message : 'Unknown error' }
    );
  }
}