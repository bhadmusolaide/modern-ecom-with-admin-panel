import { NextRequest } from 'next/server';
import { auth as adminAuth } from '@/lib/firebase/admin';
import { createApiResponse, createErrorResponse } from '@/lib/auth/apiResponse';

export async function POST(request: NextRequest) {
  try {
    // Get the admin ID from the request header
    const adminId = request.headers.get('x-admin-id');
    if (!adminId) {
      return createErrorResponse('Admin ID is required', 400);
    }

    // Verify that the admin ID exists
    try {
      await adminAuth.getUser(adminId);
    } catch (error) {
      return createErrorResponse('Invalid admin ID', 400);
    }

    // Create a custom token for the admin
    const customToken = await adminAuth.createCustomToken(adminId, {
      adminImpersonation: false
    });

    return createApiResponse({
      customToken
    });
  } catch (error) {
    console.error('Error in switch-back:', error);
    return createErrorResponse(
      'Failed to switch back to admin account',
      500,
      { details: error instanceof Error ? error.message : 'Unknown error' }
    );
  }
} 