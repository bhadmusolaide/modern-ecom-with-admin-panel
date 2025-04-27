import { NextRequest } from 'next/server';
import { db } from '@/lib/firebase/admin';
import { serverTimestamp } from 'firebase-admin/firestore';
import { auth as adminAuth } from '@/lib/firebase/admin';
import { checkAccess } from '@/lib/auth/checkAccess';
import { createApiResponse, createErrorResponse } from '@/lib/auth/apiResponse';







// This is a one-time setup route to create an admin user in Firebase
// It should be disabled or removed after use for security reasons

export async function POST(request: NextRequest) {
  try {
    // Check for admin setup key
    const adminSetupKey = request.headers.get('x-admin-setup-key');
    const validSetupKey = process.env.ADMIN_SETUP_KEY || 'secure-setup-key-change-me';

    // First try to authenticate with the setup key
    if (adminSetupKey === validSetupKey) {
      console.log('Admin setup authorized with valid setup key');
    } else {
      // If no valid setup key, use the unified auth check
      const access = await checkAccess(request);

      if (!access.authenticated) {
        return createErrorResponse(
          access.error || 'Authentication required',
          access.status || 401
        );
      }

      if (!access.isAdmin) {
        return createErrorResponse('Forbidden. Only admins can create admin users.', 403);
      }

      console.log('Admin access granted for user:', access.userId);
    }

    // Parse request body
    const body = await request.json();
    const { email, password, name } = body;

    if (!email || !password) {
      return createErrorResponse('Email and password are required', 400);
    }

    // Check if user already exists
    try {
      const userRecord = await adminAuth.getUserByEmail(email);

      // If we get here, user exists - update their role to ADMIN in Firestore
      await db.collection('users').doc(userRecord.uid).update({
        role: 'ADMIN',
        updatedAt: serverTimestamp()
      });

      return createApiResponse({
        message: 'User already exists, updated to admin role',
        userId: userRecord.uid
       });
    } catch (error) {
      // User doesn't exist, continue with creation
      console.log('User does not exist, creating new admin user');
    }

    // Create user with Firebase Auth
    const userRecord = await adminAuth.createUser({
      email,
      password,
      displayName: name || 'Admin User',
      emailVerified: true
    });

    // Create user document in Firestore with ADMIN role
    await db.collection('users').doc(userRecord.uid).set({
      email,
      name: name || 'Admin User',
      role: 'ADMIN',
      emailVerified: true,
      createdAt: serverTimestamp(),
      updatedAt: serverTimestamp()
    });

    return createApiResponse({
      message: 'Admin user created successfully',
      userId: userRecord.uid
     });
  } catch (error) {
    console.error('Error creating admin user:', error);
    return createErrorResponse(
      'Failed to create admin user',
      500,
      { details: error instanceof Error ? error.message : 'Unknown error' }
    );
  }
}
