import { NextRequest } from 'next/server';
import Stripe from 'stripe';
import { checkAccess } from '@/lib/auth/checkAccess';
import { createApiResponse, createErrorResponse } from '@/lib/auth/apiResponse';
import { getOrderById } from '@/lib/firebase/orders';

// Initialize Stripe with the secret key
const stripe = new Stripe(process.env.STRIPE_SECRET_KEY || '', {
  apiVersion: '2023-10-16',
  typescript: true,
  appInfo: {
    name: 'OMJ E-commerce',
    version: '1.0.0',
  },
});

/**
 * API route for creating a payment intent
 * @param req The request object
 * @returns The response object
 */
export async function POST(req: NextRequest) {
  try {
    // Use unified auth check
    const access = await checkAccess(req);

    if (!access.authenticated) {
      return createErrorResponse(
        access.error || 'Authentication required',
        access.status || 401
      );
    }

    // Parse the request body
    const body = await req.json();
    const { amount, currency = 'usd', orderId, customerEmail, customerName, metadata = {} } = body;

    // Validate required fields
    if (!amount || !orderId) {
      return createErrorResponse('Missing required fields', 400);
    }

    // Verify the order exists and belongs to the user
    const order = await getOrderById(orderId);

    if (!order) {
      return createErrorResponse('Order not found', 404);
    }

    // If authenticated, verify the order belongs to the user
    if (order.userId && order.userId !== access.userId) {
      return createErrorResponse('Unauthorized', 403);
    }

    // Verify the amount matches the order total
    if (amount !== order.total) {
      return createErrorResponse('Amount does not match order total', 400);
    }

    // Create the payment intent
    const paymentIntent = await stripe.paymentIntents.create({
      amount,
      currency,
      metadata: {
        orderId,
        orderNumber: order.orderNumber,
        ...metadata,
      },
      receipt_email: customerEmail || order.email,
      // Optional automatic payment methods
      automatic_payment_methods: {
        enabled: true,
      },
    });

    // Return the client secret
    return createApiResponse({
      clientSecret: paymentIntent.client_secret,
      paymentIntentId: paymentIntent.id,
    });
  } catch (error: any) {
    console.error('Error creating payment intent:', error);

    return createErrorResponse(
      error.message || 'An error occurred while creating the payment intent',
      500
    );
  }
}