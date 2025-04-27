import { NextRequest } from 'next/server';
import { checkAccess } from '@/lib/auth/checkAccess';
import { createApiResponse, createErrorResponse } from '@/lib/auth/apiResponse';

interface RouteParams {
  params: {
    id: string;
  };
}

/**
 * API route for setting a payment method as default
 * @param req The request object
 * @param params The route parameters
 * @returns The response object
 */
export async function PUT(req: NextRequest, { params }: RouteParams) {
  try {
    // Use unified auth check
    const access = await checkAccess(req);

    if (!access.authenticated) {
      return createErrorResponse(
        access.error || 'Authentication required',
        access.status || 401
      );
    }

    const { id } = params;

    // In a real implementation, you would update the payment method in your database
    // For this example, we'll return a mock response

    return createApiResponse({
      success: true,
      message: 'Payment method set as default successfully',
    });
  } catch (error: any) {
    console.error('Error setting payment method as default:', error);

    return createErrorResponse(
      error.message || 'An error occurred while setting the payment method as default',
      500
    );
  }
}