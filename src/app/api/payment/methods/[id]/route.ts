import { NextRequest } from 'next/server';
import { checkAccess } from '@/lib/auth/checkAccess';
import { createApiResponse, createErrorResponse } from '@/lib/auth/apiResponse';

interface RouteParams {
  params: {
    id: string;
  };
}

/**
 * API route for getting a specific payment method
 * @param req The request object
 * @param params The route parameters
 * @returns The response object
 */
export async function GET(req: NextRequest, { params }: RouteParams) {
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

    // In a real implementation, you would fetch the payment method from your database
    // For this example, we'll return a mock response

    // Mock payment method
    const paymentMethod = {
      id,
      userId: access.userId,
      type: 'credit_card',
      provider: 'stripe',
      isDefault: true,
      lastFour: '4242',
      expiryMonth: 12,
      expiryYear: 2025,
      cardBrand: 'Visa',
      createdAt: new Date().toISOString(),
    };

    return createApiResponse({
      paymentMethod,
    });
  } catch (error: any) {
    console.error('Error getting payment method:', error);

    return createErrorResponse(
      error.message || 'An error occurred while getting the payment method',
      500
    );
  }
}

/**
 * API route for deleting a payment method
 * @param req The request object
 * @param params The route parameters
 * @returns The response object
 */
export async function DELETE(req: NextRequest, { params }: RouteParams) {
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

    // In a real implementation, you would delete the payment method from your database
    // For this example, we'll return a mock response

    return createApiResponse({
      success: true,
      message: 'Payment method deleted successfully',
    });
  } catch (error: any) {
    console.error('Error deleting payment method:', error);

    return createErrorResponse(
      error.message || 'An error occurred while deleting the payment method',
      500
    );
  }
}