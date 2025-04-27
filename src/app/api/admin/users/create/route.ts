import { NextRequest } from 'next/server';
import { z } from 'zod';
import { verifyCsrfToken } from '@/lib/csrf';
import { auth, db } from '@/lib/firebase/admin';
import { checkAccess } from '@/lib/auth/checkAccess';
import { createApiResponse, createErrorResponse } from '@/lib/auth/apiResponse';







// Validation schema
const createUserSchema = z.object({
  name: z.string().min(2, 'Name must be at least 2 characters').optional(),
  email: z.string().email('Invalid email address'),
  password: z.string().min(8, 'Password must be at least 8 characters'),
  role: z.enum(['ADMIN', 'CUSTOMER']).default('ADMIN'),
  emailVerified: z.boolean().default(false),
  csrfToken: z.string().min(1, 'CSRF token is required'),
});

export async function POST(request: NextRequest) {
  try {
    // Unified auth check
    const access = await checkAccess(request);

    if (!access.authenticated) {
      return createErrorResponse(
        access.error || 'Authentication required',
        access.status || 401
      );
    }

    if (!access.isAdmin) {
      return createErrorResponse('Forbidden. Admin access required.', 403);
    }

    console.log('Admin access granted for user:', access.userId);

    // Parse and validate request body
    const body = await request.json();
    const validation = createUserSchema.safeParse(body);

    if (!validation.success) {
      return createErrorResponse(validation.error.errors[0].message, 400);
    }

    // Verify CSRF token
    const { csrfToken, ...userData } = validation.data;
    if (!verifyCsrfToken(csrfToken)) {
      return createErrorResponse('Invalid CSRF token', 403);
    }

    // Check if email is already taken
    const usersRef = db.collection('users');
    const snapshot = await usersRef.where('email', '==', userData.email).get();

    if (!snapshot.empty) {
      return createErrorResponse('Email is already taken', 400);
    }

    try {
      // Create user in Firebase Auth
      const userRecord = await auth.createUser({
        email: userData.email,
        password: userData.password,
        displayName: userData.name || undefined,
        emailVerified: userData.emailVerified,
      });

      // Store additional user data in Firestore
      await db.collection('users').doc(userRecord.uid).set({
        name: userData.name || null,
        email: userData.email,
        role: userData.role,
        emailVerified: userData.emailVerified,
        createdAt: new Date(),
        updatedAt: new Date(),
      });

      // Return user data
      return createApiResponse({
        user: {
          id: userRecord.uid,
          name: userData.name || null,
          email: userData.email,
          role: userData.role,
          emailVerified: userData.emailVerified,
          createdAt: new Date(),
        },
        message: 'User created successfully',
      }, 201);
    } catch (error) {
      console.error('Error creating user in Firebase:', error);
      return createErrorResponse('Failed to create user', 500, { details: error instanceof Error ? error.message : 'Unknown error' });
    }
  } catch (error) {
    console.error('Error creating user:', error);
    return createErrorResponse('Failed to create user', 500, { details: error instanceof Error ? error.message : 'Unknown error' });
  }
}
