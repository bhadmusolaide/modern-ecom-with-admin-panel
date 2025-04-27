import { NextRequest } from 'next/server';
import { z } from 'zod';
import { verifyCsrfToken } from '@/lib/csrf';
import { db } from '@/lib/firebase/admin';
import { checkAccess } from '@/lib/auth/checkAccess';
import { createApiResponse, createErrorResponse } from '@/lib/auth/apiResponse';






// Validation schema for role update
const updateRoleSchema = z.object({
  role: z.enum(['ADMIN', 'CUSTOMER']),
  csrfToken: z.string().min(1, 'CSRF token is required'),
});

// Update user role
export async function PUT(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    console.log('User role update API: Processing request for user ID:', params.id);

    // Unified auth check
    const access = await checkAccess(request);

    if (!access.authenticated) {
      console.error('User role update API: Authentication failed');
      return createErrorResponse(
        access.error || 'Authentication required',
        access.status || 401
      );
    }

    if (!access.isAdmin) {
      console.error('User role update API: Admin access required but user is not admin');
      return createErrorResponse('Forbidden. Admin access required.', 403);
    }

    console.log('User role update API: Admin access granted for user:', access.userId);

    // Parse and validate request body
    let body;
    try {
      body = await request.json();
      console.log('User role update API: Received request body:', JSON.stringify(body));
    } catch (parseError) {
      console.error('User role update API: Error parsing request body:', parseError);
      return createErrorResponse('Invalid request body', 400);
    }

    const validation = updateRoleSchema.safeParse(body);

    if (!validation.success) {
      console.error('User role update API: Validation failed:', validation.error.errors);
      return createErrorResponse(validation.error.errors[0].message, 400);
    }

    // Verify CSRF token
    const { csrfToken, role } = validation.data;
    console.log(`User role update API: Verifying CSRF token: ${csrfToken ? csrfToken.substring(0, 10) + '...' : 'undefined'}`);

    if (!csrfToken) {
      console.error('User role update API: CSRF token is missing');
      return createErrorResponse('CSRF token is required', 403);
    }

    const isValidToken = verifyCsrfToken(csrfToken);
    if (!isValidToken) {
      console.error('User role update API: Invalid CSRF token');
      return createErrorResponse('Invalid CSRF token', 403);
    }

    console.log('User role update API: CSRF token verified successfully');

    // Prevent changing your own role
    if (params.id === access.userId) {
      console.error('User role update API: User attempting to change their own role');
      return createErrorResponse('You cannot change your own role', 400);
    }

    // Check if user exists
    const userDoc = await db.collection('users').doc(params.id).get();

    if (!userDoc.exists) {
      console.error('User role update API: User not found with ID:', params.id);
      return createErrorResponse('User not found', 404);
    }

    const userData = userDoc.data();
    console.log(`User role update API: Updating role for user ${params.id} from ${userData.role} to ${role}`);

    // Update user role in Firestore
    await db.collection('users').doc(params.id).update({
      role,
      updatedAt: new Date()
    });

    // Construct the updated user object
    const updatedUser = {
      id: params.id,
      name: userData.name,
      email: userData.email,
      role: role
    };

    console.log('User role update API: Role updated successfully');

    return createApiResponse({
      user: updatedUser,
      message: `User role updated to ${role.toLowerCase()}`,
    }, 200);
  } catch (error) {
    console.error('User role update API: Unhandled error:', error);
    return createErrorResponse(
      'Failed to update user role',
      500,
      { details: error instanceof Error ? error.message : 'Unknown error' }
    );
  }
}
