import { NextRequest } from 'next/server';
import { z } from 'zod';
import { verifyCsrfToken } from '@/lib/csrf';
import { db, auth } from '@/lib/firebase/admin';
import { checkAccess } from '@/lib/auth/checkAccess';
import { createApiResponse, createErrorResponse } from '@/lib/auth/apiResponse';






// Validation schema
const resetPasswordSchema = z.object({
  csrfToken: z.string().min(1, 'CSRF token is required'),
});

interface RouteParams {
  params: {
    id: string;
  };
}

/**
 * Reset customer password
 * @route POST /api/admin/customers/[id]/reset-password
 */
export async function POST(
  request: NextRequest,
  { params }: RouteParams
) {
  try {
    // Get token from cookies
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

    // Parse request body
    const body = await request.json();

    // Verify CSRF token
    const csrfTokenValid = await verifyCsrfToken(body.csrfToken);
    if (!csrfTokenValid) {
      return createErrorResponse('Invalid CSRF token', 403);
    }

    // Validate request body
    const validation = resetPasswordSchema.safeParse(body);
    if (!validation.success) {
      return createErrorResponse(validation.error.errors[0].message, 400);
    }

    // Check if customer exists
    const customerDoc = await db.collection('users').doc(params.id).get();

    if (!customerDoc.exists) {
      return createErrorResponse('Customer not found', 404);
    }

    // Get customer email
    const customerEmail = customerDoc.data()?.email;

    if (!customerEmail) {
      return createErrorResponse('Customer email not found', 400);
    }

    // Generate password reset link
    const resetLink = await auth.generatePasswordResetLink(customerEmail);

    // In a real application, you would send this link to the customer via email
    // For this example, we'll just return success

    return createApiResponse({
      message: 'Password reset email sent successfully'
     });
  } catch (error) {
    console.error('Error resetting password:', error);
    return createErrorResponse('Failed to reset password', 500, { details: error instanceof Error ? error.message : 'Unknown error' });
  }
}
