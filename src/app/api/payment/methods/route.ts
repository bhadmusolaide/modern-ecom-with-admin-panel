import { NextRequest, NextResponse } from 'next/server';
import { cookies } from 'next/headers';
import { PaymentMethod, PaymentProvider } from '@/lib/types';

/**
 * API route for getting saved payment methods
 * @param req The request object
 * @returns The response object
 */
export async function GET(req: NextRequest) {
  try {
    // Get the session to check authentication
    const session = await getServerSession(authOptions);
    
    // Check if the user is authenticated
    if (!session?.user) {
      return NextResponse.json(
        { error: 'Unauthorized' },
        { status: 401 }
      );
    }
    
    // In a real implementation, you would fetch the user's saved payment methods from your database
    // For this example, we'll return some mock data
    
    // Mock saved payment methods
    const paymentMethods = [
      {
        id: 'pm_1234567890',
        type: PaymentMethod.CREDIT_CARD,
        provider: PaymentProvider.STRIPE,
        isDefault: true,
        lastFour: '4242',
        expiryMonth: 12,
        expiryYear: 2025,
        cardBrand: 'Visa',
        createdAt: new Date().toISOString(),
      },
      {
        id: 'pm_0987654321',
        type: PaymentMethod.PAYPAL,
        provider: PaymentProvider.PAYPAL,
        isDefault: false,
        createdAt: new Date(Date.now() - 86400000).toISOString(), // 1 day ago
      },
    ];
    
    return NextResponse.json({
      paymentMethods,
    });
  } catch (error: any) {
    console.error('Error getting payment methods:', error);
    
    return NextResponse.json(
      { error: error.message || 'An error occurred while getting payment methods' },
      { status: 500 }
    );
  }
}

/**
 * API route for creating a new payment method
 * @param req The request object
 * @returns The response object
 */
export async function POST(req: NextRequest) {
  try {
    // Get the session to check authentication
    const session = await getServerSession(authOptions);
    
    // Check if the user is authenticated
    if (!session?.user) {
      return NextResponse.json(
        { error: 'Unauthorized' },
        { status: 401 }
      );
    }
    
    // Parse the request body
    const body = await req.json();
    const { paymentMethodId, isDefault = false } = body;
    
    // Validate required fields
    if (!paymentMethodId) {
      return NextResponse.json(
        { error: 'Missing required fields' },
        { status: 400 }
      );
    }
    
    // In a real implementation, you would save the payment method to your database
    // For this example, we'll return a mock response
    
    // Mock saved payment method
    const paymentMethod = {
      id: paymentMethodId,
      type: PaymentMethod.CREDIT_CARD,
      provider: PaymentProvider.STRIPE,
      isDefault,
      lastFour: '4242',
      expiryMonth: 12,
      expiryYear: 2025,
      cardBrand: 'Visa',
      createdAt: new Date().toISOString(),
    };
    
    return NextResponse.json({
      paymentMethod,
    });
  } catch (error: any) {
    console.error('Error creating payment method:', error);
    
    return NextResponse.json(
      { error: error.message || 'An error occurred while creating the payment method' },
      { status: 500 }
    );
  }
}