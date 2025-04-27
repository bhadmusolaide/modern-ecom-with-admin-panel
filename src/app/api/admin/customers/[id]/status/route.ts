/**
 * Customer Status API Route
 * 
 * This file contains API routes for managing customer status.
 * - PUT /api/admin/customers/[id]/status - Update customer status
 */

import { NextRequest } from 'next/server';
import { z } from 'zod';
import { checkAccess } from '@/lib/auth/checkAccess';
import { createApiResponse, createErrorResponse } from '@/lib/auth/apiResponse';
import { setCustomerActiveStatus } from '@/lib/firebase/customers';

interface RouteParams {
  params: {
    id: string;
  };
}

// Validation schema
const updateStatusSchema = z.object({
  isActive: z.boolean(),
  csrfToken: z.string().optional(),
});

/**
 * Update customer status
 * @route PUT /api/admin/customers/[id]/status
 */
export async function PUT(
  request: NextRequest,
  { params }: RouteParams
) {
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
    const validation = updateStatusSchema.safeParse(body);

    if (!validation.success) {
      return createErrorResponse(validation.error.errors[0].message, 400);
    }

    const { isActive } = validation.data;

    // Update customer status
    const result = await setCustomerActiveStatus(params.id, isActive);

    return createApiResponse({
      ...result,
      message: `Customer ${isActive ? 'activated' : 'deactivated'} successfully`
    });
  } catch (error) {
    console.error('Error updating customer status:', error);
    return createErrorResponse(
      'Failed to update customer status',
      500,
      { details: error instanceof Error ? error.message : 'Unknown error' }
    );
  }
}
