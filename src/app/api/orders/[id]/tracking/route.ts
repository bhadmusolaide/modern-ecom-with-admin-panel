/**
 * Order Tracking API Route
 *
 * This file contains API routes for managing order tracking information.
 * - PUT /api/orders/[id]/tracking - Add or update tracking information
 */

import { NextRequest, NextResponse } from 'next/server';
import { addOrderTracking, getOrderById } from '@/lib/firebase/orders';
import { auth } from '@/lib/firebase/admin';
import { checkAccess } from '@/lib/auth/checkAccess';
import { createApiResponse, createErrorResponse } from '@/lib/auth/apiResponse';

interface RouteParams {
  params: {
    id: string;
  };
}

/**
 * Add or update tracking information
 * @route PUT /api/orders/[id]/tracking
 */
export async function PUT(
  request: NextRequest,
  { params }: RouteParams
) {
  try {
    const { id } = params;

    // Get authorization token from request headers
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

    // Only admins can add tracking information
    if (!access.isAdmin) {
      return createErrorResponse('Only administrators can add tracking information', 403);
    }

    // Get the existing order
    const existingOrder = await getOrderById(id);

    if (!existingOrder) {
      return createErrorResponse('Order not found', 404);
    }

    // Parse request body
    const trackingData = await request.json();

    // Validate required tracking fields
    if (!trackingData.carrier || !trackingData.trackingNumber) {
      return createErrorResponse('Carrier and tracking number are required', 400);
    }

    // Add tracking information
    const updatedOrder = await addOrderTracking(id, {
      carrier: trackingData.carrier,
      trackingNumber: trackingData.trackingNumber,
      trackingUrl: trackingData.trackingUrl,
      shippedDate: trackingData.shippedDate || new Date().toISOString(),
      estimatedDeliveryDate: trackingData.estimatedDeliveryDate
    });

    return createApiResponse(updatedOrder);
  } catch (error) {
    console.error('Error adding tracking information:', error);
    return createErrorResponse('Failed to add tracking information', 500, { details: error instanceof Error ? error.message : 'Unknown error' });
  }
}