import { NextRequest, NextResponse } from 'next/server';
import { cookies } from 'next/headers';
import { getOrderById } from '@/lib/firebase/orders';
import { PaymentProvider } from '@/lib/types';

/**
 * API route for processing refunds
 * This is a router that delegates to the appropriate payment provider's refund endpoint
 * @param req The request object
 * @returns The response object
 */
export async function POST(req: NextRequest) {
  try {
    // Get user ID from cookies if available
    const cookieStore = await cookies();
    const userId = cookieStore.get('userId')?.value || '';
    
    // Parse the request body
    const body = await req.json();
    const { orderId } = body;
    
    // Validate required fields
    if (!orderId) {
      return NextResponse.json(
        { error: 'Missing required fields' },
        { status: 400 }
      );
    }
    
    // Verify the order exists
    const order = await getOrderById(orderId);
    
    if (!order) {
      return NextResponse.json(
        { error: 'Order not found' },
        { status: 404 }
      );
    }
    
    // Verify the user has permission to refund the order
    // In a real app, you would check if the user is an admin or has the right permissions
    if (userId && !userId.startsWith('admin_')) {
      return NextResponse.json(
        { error: 'Unauthorized' },
        { status: 403 }
      );
    }
    
    // Determine which payment provider to use
    const provider = order.payment.provider;
    
    // Forward the request to the appropriate provider's refund endpoint
    let response;
    
    switch (provider) {
      case PaymentProvider.PAYPAL:
        response = await fetch(`${req.nextUrl.origin}/api/payment/paypal/refund`, {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify(body),
        });
        break;
        
      case PaymentProvider.STRIPE:
        response = await fetch(`${req.nextUrl.origin}/api/payment/stripe/refund`, {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify(body),
        });
        break;
        
      case PaymentProvider.MANUAL:
        // For manual payments, we'll handle the refund directly here
        response = await fetch(`${req.nextUrl.origin}/api/payment/manual/refund`, {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify(body),
        });
        break;
        
      default:
        return NextResponse.json(
          { error: `Unsupported payment provider: ${provider}` },
          { status: 400 }
        );
    }
    
    // Return the response from the provider's refund endpoint
    const result = await response.json();
    
    if (!response.ok) {
      return NextResponse.json(
        { error: result.error || 'An error occurred while processing the refund' },
        { status: response.status }
      );
    }
    
    return NextResponse.json(result);
  } catch (error: any) {
    console.error('Error processing refund:', error);
    
    return NextResponse.json(
      { error: error.message || 'An error occurred while processing the refund' },
      { status: 500 }
    );
  }
}