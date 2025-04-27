import { NextRequest } from 'next/server';
import { db } from '@/lib/firebase/config';
import { writeBatch, doc, getDoc } from 'firebase/firestore';
import { checkAccess } from '@/lib/auth/checkAccess';
import { createApiResponse, createErrorResponse } from '@/lib/auth/apiResponse';

export async function POST(request: NextRequest) {
  try {
    // Use unified auth check
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

    // Parse request body
    const { action, productIds, data } = await request.json();

    if (!action || !productIds || !Array.isArray(productIds) || productIds.length === 0) {
      return createErrorResponse('Invalid request parameters', 400);
    }

    // Initialize batch
    const batch = writeBatch(db);

    // Process based on action
    switch (action) {
      case 'delete':
        // Delete products
        productIds.forEach(id => {
          const productRef = doc(db, 'products', id);
          batch.delete(productRef);
        });
        break;

      case 'update':
        // Validate update data
        if (!data || typeof data !== 'object') {
          return createErrorResponse('Invalid update data', 400);
        }

        // Update products
        productIds.forEach(id => {
          const productRef = doc(db, 'products', id);
          batch.update(productRef, {
            ...data,
            updatedAt: new Date().toISOString()
          });
        });
        break;

      default:
        return createErrorResponse('Invalid action', 400);
    }

    // Commit batch
    await batch.commit();

    return createApiResponse({
      success: true,
      message: `Successfully processed ${productIds.length} products`,
      action,
      count: productIds.length
    });
  } catch (error) {
    console.error('Error in bulk product operation:', error);
    return createErrorResponse('Internal server error', 500);
  }
}