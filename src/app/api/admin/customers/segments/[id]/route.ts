import { NextRequest } from 'next/server';
import { z } from 'zod';
import { verifyCsrfToken } from '@/lib/csrf';
import { db } from '@/lib/firebase/admin';
import { checkAccess } from '@/lib/auth/checkAccess';
import { createApiResponse, createErrorResponse } from '@/lib/auth/apiResponse';






// Validation schema for segment update
const updateSegmentSchema = z.object({
  name: z.string().min(2, 'Name must be at least 2 characters').optional(),
  description: z.string().optional(),
  criteria: z.object({
    minSpent: z.number().optional(),
    maxSpent: z.number().optional(),
    minOrders: z.number().optional(),
    maxOrders: z.number().optional(),
    dateRange: z.object({
      start: z.string().optional(),
      end: z.string().optional(),
    }).optional(),
    purchasedProducts: z.array(z.string()).optional(),
    purchasedCategories: z.array(z.string()).optional(),
    tags: z.array(z.string()).optional(),
  }).optional(),
  isActive: z.boolean().optional(),
  csrfToken: z.string().min(1, 'CSRF token is required'),
});

// Validation schema for segment deletion
const deleteSegmentSchema = z.object({
  csrfToken: z.string().min(1, 'CSRF token is required'),
});

interface RouteParams {
  params: {
    id: string;
  };
}

/**
 * Update a customer segment
 * @route PUT /api/admin/customers/segments/[id]
 */
export async function PUT(
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
    const validation = deleteSegmentSchema.safeParse(body);
    if (!validation.success) {
      return createErrorResponse(validation.error.errors[0].message, 400);
    }

    // Check if segment exists
    const segmentDoc = await db.collection('customer-segments').doc(params.id).get();

    if (!segmentDoc.exists) {
      return createErrorResponse('Segment not found', 404);
    }

    // Delete segment
    await deleteCustomerSegment(params.id);

    return createApiResponse({
      message: 'Segment deleted successfully'
     });
  } catch (error) {
    console.error('Error deleting segment:', error);
    return createErrorResponse('Failed to delete segment', 500, { details: error instanceof Error ? error.message : 'Unknown error' });
  }
}
