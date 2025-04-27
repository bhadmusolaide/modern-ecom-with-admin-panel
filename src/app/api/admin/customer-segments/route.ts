/**
 * Customer Segments API Routes
 *
 * This file contains API routes for managing customer segments.
 * - GET /api/admin/customer-segments - Get all customer segments
 */

import { NextRequest } from 'next/server';
import { checkAccess } from '@/lib/auth/checkAccess';
import { createApiResponse, createErrorResponse } from '@/lib/auth/apiResponse';
import { db } from '@/lib/firebase/admin';

/**
 * Get all customer segments
 * @route GET /api/admin/customer-segments
 */
export async function GET(request: NextRequest) {
  try {
    console.log('Customer Segments API: Processing GET request');

    // Unified auth check
    const access = await checkAccess(request);

    if (!access.authenticated) {
      console.error('Customer Segments API: Authentication failed');
      return createErrorResponse(
        access.error || 'Authentication required',
        access.status || 401
      );
    }

    if (!access.isAdmin) {
      console.error('Customer Segments API: Admin access required but user is not admin');
      return createErrorResponse('Forbidden. Admin access required.', 403);
    }

    console.log('Customer Segments API: Admin access granted for user:', access.userId);

    try {
      // Get customer segments
      console.log('Customer Segments API: Fetching segments from database');

      // Use admin SDK directly
      const segmentsRef = db.collection('customer-segments');
      const segmentsSnapshot = await segmentsRef.get();

      // Convert the documents to CustomerSegment objects
      const segments = segmentsSnapshot.docs.map(doc => {
        try {
          return {
            id: doc.id,
            ...doc.data(),
            createdAt: doc.data().createdAt?.toDate(),
            updatedAt: doc.data().updatedAt?.toDate()
          };
        } catch (conversionError) {
          console.error(`Error converting segment ${doc.id}:`, conversionError);
          // Return a minimal valid segment object to prevent the entire operation from failing
          return {
            id: doc.id,
            name: doc.data()?.name || 'Unknown Segment',
            description: '',
            isActive: false,
            customerCount: 0,
            criteria: {}
          };
        }
      });

      if (!segments || segments.length === 0) {
        console.error('Customer Segments API: No segments returned from database');
        return createApiResponse({
          segments: [],
          message: 'No segments found'
        });
      }

      console.log(`Customer Segments API: Successfully retrieved ${segments.length} segments`);

      return createApiResponse({
        segments,
        message: 'Customer segments retrieved successfully'
      });
    } catch (dbError) {
      console.error('Customer Segments API: Database error:', dbError);
      console.error('Error details:', dbError instanceof Error ? dbError.message : 'Unknown error');
      console.error('Error stack:', dbError instanceof Error ? dbError.stack : 'No stack trace');

      return createErrorResponse(
        'Database error while fetching customer segments',
        500,
        {
          details: dbError instanceof Error ? dbError.message : 'Unknown database error',
          stack: dbError instanceof Error ? dbError.stack : 'No stack trace'
        }
      );
    }
  } catch (error) {
    console.error('Customer Segments API: Unhandled error:', error);
    console.error('Error details:', error instanceof Error ? error.message : 'Unknown error');
    console.error('Error stack:', error instanceof Error ? error.stack : 'No stack trace');

    return createErrorResponse(
      'Failed to get customer segments',
      500,
      {
        details: error instanceof Error ? error.message : 'Unknown error',
        stack: error instanceof Error ? error.stack : 'No stack trace'
      }
    );
  }
}
